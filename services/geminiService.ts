
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { 
    SimulationScenario, 
    SimulationFeedback, 
    Course, 
    Module, 
    QuizQuestion, 
    UserProfile, 
    ExpertPersona, 
    AssessmentQuestion, 
    AssessmentQuestionType,
    AssessmentResult, 
    ExternalAssessment,
    MarketingAssets,
    MicroLesson
} from '../types';

export const COURSE_MODEL = 'gemini-2.5-flash';
// According to guidelines, default to gemini-2.5-flash-image using generateContent
export const IMAGE_MODEL = 'gemini-2.5-flash-image'; 
export const SPEECH_MODEL = 'gemini-2.5-flash-preview-tts';

// --- Client Management (BYOK: logged-in AI uses only session key from DB) ---
let client: GoogleGenAI | null = null;
let cachedKeyFingerprint: string | null = null;
let sessionUserApiKey: string | null = null;

export const GEMINI_KEY_REQUIRED = 'GEMINI_KEY_REQUIRED';

export const setSessionUserApiKey = (key: string | null) => {
    sessionUserApiKey = key && key.trim() ? key.trim() : null;
    client = null;
    cachedKeyFingerprint = null;
};

export const clearSessionUserApiKey = () => setSessionUserApiKey(null);

export const isUserGeminiSessionReady = (): boolean =>
    !!sessionUserApiKey && sessionUserApiKey.trim().length > 0;

/** Optional: legacy localStorage key name (migrated to DB on login). */
export const LEGACY_LOCAL_STORAGE_KEY = 'knovatwin_custom_api_key';

function readEnvGeminiKeyForPublicFallback(): string {
    const metaEnv = (import.meta as any)?.env || {};
    const processEnv = typeof process !== 'undefined' ? process.env : {};
    const raw =
        metaEnv.VITE_PUBLIC_GEMINI_API_KEY ||
        metaEnv.VITE_GEMINI_API_KEY ||
        metaEnv.GEMINI_API_KEY ||
        processEnv.VITE_PUBLIC_GEMINI_API_KEY ||
        processEnv.VITE_GEMINI_API_KEY ||
        processEnv.GEMINI_API_KEY ||
        metaEnv.VITE_API_KEY ||
        processEnv.VITE_API_KEY ||
        processEnv.API_KEY ||
        '';
    return (typeof raw === 'string' ? raw : '').trim();
}

function resolveApiKey(allowEnvFallback: boolean): string {
    const session = sessionUserApiKey?.trim() || '';
    if (session) return session;
    if (allowEnvFallback) {
        const env = readEnvGeminiKeyForPublicFallback();
        if (env) return env;
    }
    const err = new Error(
        'Gemini API key not set for your account. Add your key in Settings → Integrations.',
    );
    (err as any).code = GEMINI_KEY_REQUIRED;
    throw err;
}

function getOrCreateClient(allowEnvFallback: boolean): GoogleGenAI {
    const apiKey = resolveApiKey(allowEnvFallback);
    if (!client || cachedKeyFingerprint !== apiKey) {
        client = new GoogleGenAI({ apiKey });
        cachedKeyFingerprint = apiKey;
    }
    return client;
}

/** Logged-in app: only the current user's API key (never shared build/env default). */
export const getClient = (): GoogleGenAI => getOrCreateClient(false);

/** Public embed / unauthenticated twin: user's session key if set, else optional env fallback. */
export const getPublicGeminiClient = (): GoogleGenAI => getOrCreateClient(true);

/** Whether the signed-in session has a loaded user key (post–DB bootstrap). */
export const hasValidKey = (): boolean => isUserGeminiSessionReady();

export const resetClient = () => {
    client = null;
    cachedKeyFingerprint = null;
};

export function showKnovaToast(message: string): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('knovatwin-app-toast', { detail: { message } }));
}

export function requireUserGeminiSessionOrToast(): boolean {
    if (isUserGeminiSessionReady()) return true;
    showKnovaToast('Set your Gemini API key first: open Settings, then Integrations, and save your key.');
    return false;
}

// --- Helper: Extract text from SDK response (handles .text or candidates[].content.parts[].text) ---
const getResponseText = (response: GenerateContentResponse): string => {
    if (response.text && typeof response.text === 'string') return response.text;
    const candidates = (response as any).candidates;
    if (Array.isArray(candidates) && candidates[0]?.content?.parts?.[0]?.text) {
        return candidates[0].content.parts[0].text;
    }
    return '';
};

// --- Helper: Clean JSON ---
// Removes Markdown code blocks if the model includes them
const cleanJson = (text: string): string => {
    if (!text) return '{}';
    let cleaned = text.trim();
    // Remove ```json ... ``` or just ``` ... ``` wrappers
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(json)?\s*/i, '').replace(/```$/, '');
    }
    return cleaned;
};

// Helper for retries
export const retryOperation = async <T>(operation: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> => {
    try {
        return await operation();
    } catch (error: any) {
        // Detect various forms of rate limiting or overloading
        const isQuota = error.status === 429 || 
                        error.code === 429 || 
                        (error.message && (
                            error.message.includes('429') || 
                            error.message.includes('quota') || 
                            error.message.includes('RESOURCE_EXHAUSTED')
                        ));
        
        const isOverloaded = error.status === 503 || (error.message && error.message.includes('503'));

        if (retries > 0 && (isQuota || isOverloaded)) {
            // Exponential backoff, starting higher for quota issues (min 5s)
            const waitTime = isQuota ? Math.max(delayMs, 5000) : delayMs;
            console.warn(`Gemini API ${isQuota ? 'Rate Limited' : 'Busy'}. Retrying in ${waitTime}ms... (Attempts left: ${retries})`);
            
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return retryOperation(operation, retries - 1, waitTime * 2);
        }
        throw error;
    }
};

export const validateApiKey = async (key: string): Promise<{ valid: boolean; error?: string }> => {
    try {
        const testClient = new GoogleGenAI({ apiKey: key });
        await testClient.models.generateContent({
            model: COURSE_MODEL,
            contents: 'Test connection',
        });
        return { valid: true };
    } catch (error: any) {
        const raw = String(error?.message || '');
        let msg = raw;
        // SDK errors sometimes include JSON payloads; extract the useful string.
        if (msg.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(msg);
                const nested = parsed?.error?.message || parsed?.message || '';
                if (nested) msg = String(nested);
            } catch {
                /* ignore */
            }
        }
        const isQuota =
            error?.status === 429 ||
            error?.code === 429 ||
            msg.includes('429') ||
            msg.toLowerCase().includes('quota') ||
            msg.includes('RESOURCE_EXHAUSTED');
        if (isQuota) {
            return {
                valid: false,
                error: 'Quota exceeded / rate-limited for this Gemini key. Try later or enable billing / increase quota in Google AI Studio.',
            };
        }
        const isUnauthorized =
            error?.status === 401 ||
            error?.code === 401 ||
            msg.toLowerCase().includes('unauthorized') ||
            msg.toLowerCase().includes('api key invalid') ||
            msg.toLowerCase().includes('invalid api key');
        if (isUnauthorized) {
            return { valid: false, error: 'Invalid API key (unauthorized). Please generate a new Gemini key and try again.' };
        }
        const isPermission =
            error?.status === 403 ||
            error?.code === 403 ||
            msg.toLowerCase().includes('permission') ||
            msg.toLowerCase().includes('forbidden') ||
            msg.toLowerCase().includes('billing');
        if (isPermission) {
            return {
                valid: false,
                error: 'Permission / billing issue for this key. Enable billing and required access in Google AI Studio, then try again.',
            };
        }
        const isNetwork =
            msg.includes('Failed to fetch') ||
            msg.toLowerCase().includes('network') ||
            msg.toLowerCase().includes('timeout');
        if (isNetwork) {
            return { valid: false, error: 'Network error while testing key. Check internet and try again.' };
        }
        return { valid: false, error: msg || 'Invalid API Key' };
    }
};

// --- Helpers for Audio ---
function base64ToArrayBuffer(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function createWavBlob(pcmData: ArrayBuffer, sampleRate: number): Blob {
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = numChannels * bitsPerSample / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmData.byteLength;
    const headerSize = 44;
    
    const buffer = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(buffer);
    
    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    const pcmBytes = new Uint8Array(pcmData);
    const headerBytes = new Uint8Array(buffer);
    headerBytes.set(pcmBytes, 44);
    
    return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// --- Content Generation ---

export const generateModuleContent = async (courseTopic: string, module: Module): Promise<string> => {
    const ai = getClient();
    const prompt = `Write a comprehensive, engaging learning module content for:
    Course Topic: ${courseTopic}
    Module Title: ${module.title}
    Key Concepts: ${module.keyConcepts?.join(', ') || 'General overview'}
    
    Format as Markdown. Include headings, bullet points, and practical examples.
    Tone: Professional yet accessible.`;

    const response = await retryOperation(() => ai.models.generateContent({
        model: COURSE_MODEL,
        contents: prompt
    })) as GenerateContentResponse;
    
    return response.text || "Failed to generate content.";
};

export const streamModuleContent = async (
    courseTopic: string, 
    module: Module, 
    onChunk: (text: string) => void
): Promise<string> => {
    const ai = getClient();
    const prompt = `Write a comprehensive, engaging learning module content for:
    Course Topic: ${courseTopic}
    Module Title: ${module.title}
    Key Concepts: ${module.keyConcepts?.join(', ') || 'General overview'}
    
    Format as Markdown. Include headings, bullet points, and practical examples.
    Tone: Professional yet accessible.`;

    try {
        const response = await ai.models.generateContentStream({
            model: COURSE_MODEL,
            contents: prompt
        });

        let fullText = '';
        for await (const chunk of response) {
            const text = chunk.text;
            if (text) {
                fullText += text;
                onChunk(fullText);
            }
        }
        return fullText || "No content generated.";
    } catch (e) {
        console.error("Streaming failed", e);
        return "Failed to generate content. Please try again.";
    }
};

export const generateQuizForModule = async (courseTopic: string, moduleTitle: string): Promise<QuizQuestion[]> => {
    const ai = getClient();
    const prompt = `Generate 3 multiple-choice quiz questions for the module "${moduleTitle}" in the course "${courseTopic}".
    Return JSON array.`;
    
    const response = await retryOperation(() => ai.models.generateContent({
        model: COURSE_MODEL,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswerIndex: { type: Type.INTEGER }
                    },
                    required: ['id', 'question', 'options', 'correctAnswerIndex']
                }
            }
        }
    })) as GenerateContentResponse;
    
    return JSON.parse(cleanJson(response.text || '[]'));
};

export const generateConceptImage = async (prompt: string): Promise<string | undefined> => {
    const ai = getClient();
    try {
        // Use gemini-2.5-flash-image with generateContent as per guidelines
        const response = await ai.models.generateContent({
            model: IMAGE_MODEL,
            contents: {
                parts: [
                    { text: prompt }
                ]
            },
            config: {
                // responseMimeType is not supported for nano banana series
                imageConfig: {
                    aspectRatio: "16:9"
                }
            }
        });

        // Iterate through parts to find image
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                }
            }
        }
        return undefined;
    } catch (e) {
        console.error("Image gen failed", e);
        return undefined;
    }
};

export const generateMarketingFlyer = async (title: string, topic: string): Promise<string | null> => {
    const ai = getClient();
    try {
        const response = await retryOperation(() => ai.models.generateContent({
            model: IMAGE_MODEL,
            contents: {
                parts: [
                    { text: `Design a professional marketing flyer for a new course: "${title}". Topic: ${topic}. Style: Modern, clean, high-impact, promotional poster. Include visual metaphors for learning and growth.` }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "3:4"
                }
            }
        })) as GenerateContentResponse;

        // Iterate through parts to find image
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                }
            }
        }
    } catch (e) {
        console.error("Flyer gen failed", e);
    }
    return null;
};

export const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
    const ai = getClient();
    try {
        const response = await retryOperation(() => ai.models.generateContent({
            model: SPEECH_MODEL,
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            }
        })) as GenerateContentResponse;
        
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64) {
             return base64ToArrayBuffer(base64);
        }
    } catch (e) {
        console.error("Speech gen failed", e);
    }
    return null;
};

export const generateCoursePodcast = async (course: Course): Promise<string | null> => {
    const ai = getClient();
    const scriptPrompt = `Write a short podcast script (2 speakers) summarizing the course "${course.title}". Keep it under 200 words.`;
    try {
        const scriptResp = await retryOperation(() => ai.models.generateContent({
            model: COURSE_MODEL,
            contents: scriptPrompt
        })) as GenerateContentResponse;
        const script = scriptResp.text;
        
        if(!script) return null;

        const response = await retryOperation(() => ai.models.generateContent({
            model: SPEECH_MODEL,
            contents: { parts: [{ text: script }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            { speaker: 'Host', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                            { speaker: 'Guest', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } }
                        ]
                    }
                }
            }
        })) as GenerateContentResponse;
         const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
         if(base64) {
             const pcmData = base64ToArrayBuffer(base64);
             const wavBlob = createWavBlob(pcmData, 24000);
             return URL.createObjectURL(wavBlob);
         }
    } catch(e) {
        console.error("Podcast gen failed", e);
    }
    return null;
};

export const generateCourseMarketingAssets = async (course: Course): Promise<MarketingAssets> => {
    const ai = getClient();
    const prompt = `Generate marketing assets for course "${course.title}".
    1. 3 slides (title, bullets, speaker notes).
    2. Infographic content (3 sections).
    3. 2 YouTube search queries for relevant videos.
    Return JSON.`;
    
    try {
        const response = await retryOperation(() => ai.models.generateContent({
            model: COURSE_MODEL,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        slides: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    speakerNotes: { type: Type.STRING }
                                },
                                required: ['title', 'bullets', 'speakerNotes']
                            }
                        },
                        infographic: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    content: { type: Type.STRING },
                                    iconSuggestion: { type: Type.STRING },
                                    colorTheme: { type: Type.STRING }
                                },
                                required: ['title', 'content', 'iconSuggestion', 'colorTheme']
                            }
                        },
                        youtubeResources: {
                             type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    channelName: { type: Type.STRING },
                                    searchQuery: { type: Type.STRING },
                                    reason: { type: Type.STRING }
                                },
                                required: ['title', 'channelName', 'searchQuery', 'reason']
                            }
                        }
                    },
                    required: ['slides', 'infographic', 'youtubeResources']
                }
            }
        })) as GenerateContentResponse;
        
        const data = JSON.parse(cleanJson(response.text || '{}'));
        
        return {
            slides: data.slides || [],
            infographic: data.infographic || [],
            youtubeResources: data.youtubeResources || [],
            generatedAt: Date.now()
        };
    } catch (e) {
        console.error("Marketing generation failed", e);
        throw e;
    }
};

export const generateMicroLesson = async (topic: string): Promise<MicroLesson> => {
    const ai = getClient();
    const prompt = `Generate a 3-minute micro-lesson on "${topic}". Return JSON.`;
    
    const response = await retryOperation(() => ai.models.generateContent({
        model: COURSE_MODEL,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    duration: { type: Type.STRING }
                },
                required: ['title', 'content', 'duration']
            }
        }
    })) as GenerateContentResponse;
    
    const data = JSON.parse(cleanJson(response.text || '{}'));
    return {
        id: `micro-${Date.now()}`,
        topic,
        title: data.title,
        content: data.content,
        duration: data.duration,
        generatedAt: Date.now()
    };
};

// --- Creator Studio Services ---

export const generateNextInterviewQuestion = async (history: { question: string, answer: string }[]): Promise<string> => {
    const ai = getClient();
    
    if (history.length === 0) {
        return "What specific topic do you want to create a course about today?";
    }

    const conversationText = history.map(h => `Interviewer: ${h.question}\nExpert: ${h.answer}`).join('\n\n');
    
    const prompt = `
    You are an expert Instructional Designer interviewing a Subject Matter Expert (SME) to extract knowledge for a new course.
    
    CURRENT TRANSCRIPT:
    ${conversationText}
    
    TASK:
    Generate the next single best question to dig deeper. 
    - If the topic is vague, ask for specifics.
    - If they gave a concept, ask for the step-by-step framework.
    - If they gave an example, ask for the step-by-step framework.
    - Keep the question short and conversational.
    
    Return ONLY the question text.
    `;

    try {
        const response = await retryOperation(() => ai.models.generateContent({
            model: COURSE_MODEL,
            contents: prompt
        })) as GenerateContentResponse;
        return response.text?.trim() || "Can you give me a specific example of that?";
    } catch (e) {
        console.error("Interview gen failed", e);
        return "That's interesting. Can you tell me more about the practical application?";
    }
};

export const generateCourseSyllabus = async (topic: string, context?: string): Promise<Partial<Course>> => {
  const ai = getClient();
  const prompt = `Act as an expert instructional designer.
  TASK: Create a comprehensive course syllabus based on the user's input.
  
  TOPIC/TITLE: "${topic}"
  
  ${context ? `CONTEXT / SOURCE MATERIAL:\n"""${context.substring(0, 100000)}"""\n\nINSTRUCTION: The course MUST be derived from the source material above. Extract the specific insights, data points, and structure from the text.` : ''}
  
  Return a JSON object with:
  - title: A catchy course title.
  - description: A compelling course description.
  - modules: An array of modules (4-8 modules). Each module must have:
    - title
    - description (short summary of what the module covers)
    - keyConcepts (array of strings)
    - content (the FULL lesson body for this module: 2-5 paragraphs of teaching content in markdown, so learners see the same content every time without further generation)
  `;
  
  const response = await retryOperation(() => ai.models.generateContent({
    model: COURSE_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          modules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                content: { type: Type.STRING }
              },
              required: ['title', 'description', 'keyConcepts', 'content']
            }
          }
        },
        required: ['title', 'description', 'modules']
      }
    }
  })) as GenerateContentResponse;
  
  const rawText = getResponseText(response);
  const data = JSON.parse(cleanJson(rawText || '{}'));
  if(data.modules) {
    data.modules = data.modules.map((m: any, i: number) => ({
      ...m,
      id: `m-${Date.now()}-${i}`,
      isCompleted: false,
      topic: topic
    }));
  }
  return data;
};

// --- Simulation ---

export interface SimulationConfig {
    department: string;
    industry: string;
    employees: string;
    revenue: string;
}

export const generateSimulation = async (user: UserProfile, topic: string, config: SimulationConfig): Promise<SimulationScenario> => {
    const ai = getClient();
    const prompt = `Create a realistic, high-stakes management simulation scenario.
    Topic: ${topic}
    User Role: ${config.department} Leader
    Industry: ${config.industry}
    Company Size: ${config.employees}
    Revenue: ${config.revenue}
    
    The scenario should be a crisis or critical decision point.
    Return JSON.`;

    const response = await retryOperation(() => ai.models.generateContent({
        model: COURSE_MODEL,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    role: { type: Type.STRING },
                    context: { type: Type.STRING },
                    problem: { type: Type.STRING },
                    stakes: { type: Type.STRING },
                },
                required: ['role', 'context', 'problem', 'stakes']
            }
        }
    })) as GenerateContentResponse;
    return JSON.parse(cleanJson(response.text || '{}'));
};

export const evaluateSimulation = async (scenario: SimulationScenario, solution: string, rationale: string): Promise<SimulationFeedback> => {
    const ai = getClient();
    const prompt = `Evaluate the user's solution.
    Scenario: ${JSON.stringify(scenario)}
    Solution: ${solution}
    Rationale: ${rationale}
    
    Return JSON.`;
    
    const response = await retryOperation(() => ai.models.generateContent({
        model: COURSE_MODEL,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    critique: { type: Type.STRING },
                    betterApproach: { type: Type.STRING },
                    metrics: {
                        type: Type.OBJECT,
                        properties: {
                            strategy: { type: Type.NUMBER },
                            empathy: { type: Type.NUMBER },
                            execution: { type: Type.NUMBER }
                        }
                    }
                }
            }
        }
    })) as GenerateContentResponse;
    return JSON.parse(cleanJson(response.text || '{}'));
};

// --- Personas ---

export const EXPERT_PERSONAS: ExpertPersona[] = [
    {
        id: 'tutor',
        name: 'Dr. Nexus',
        role: 'Universal Tutor',
        systemPrompt: 'You are an advanced AI tutor capable of teaching any subject.',
        accentColor: '#6366f1',
        voiceName: 'Kore',
        yearsExperience: 100
    },
    {
        id: 'sales-expert',
        name: 'Jordan Wolf',
        role: 'Sales Veteran',
        systemPrompt: 'You are a high-stakes sales expert. Direct, aggressive, results-oriented.',
        accentColor: '#10b981',
        voiceName: 'Fenrir',
        yearsExperience: 20
    }
];

export const generatePersonaAvatar = async (persona: ExpertPersona): Promise<string | undefined> => {
    return generateConceptImage(`Professional headshot of ${persona.name}, ${persona.role}. High quality, realistic.`);
};

// --- Onboarding Chat ---

export const getOnboardingChat = (user: UserProfile) => {
    const ai = getClient();
    return ai.chats.create({
        model: COURSE_MODEL,
        config: {
            systemInstruction: `You are KnovaBot, the onboarding assistant for KnovaTwin. 
            User: ${user.name}, Role: ${user.role}.
            Help them navigate the dashboard and features. Be concise and friendly.`
        }
    });
};

// --- BICE Data ---
export type BiceEmployee = {
    id: string;
    name: string;
    role: string;
    type: 'Employee' | 'Consultant';
    department: string;
    scores: Record<string, number>;
    actionPlan: string;
    targetDate: string;
    status: 'Pending' | 'In Progress' | 'Completed';
};

export type BiceResult = {
    departments: string[];
    skills: string[];
    employees: BiceEmployee[];
    criticalAction?: string;
};

export const generateBiceData = async (industry: string, strategy: string): Promise<BiceResult | null> => {
    const ai = getClient();
    const prompt = `You are a business impact analyst. Generate realistic BICE (Business Impact Correlation Engine) data.

Industry: "${industry}"
Strategic goal: "${strategy}"

Return a JSON object with:
1. departments: array of 4-6 department names (e.g. Sales, Engineering, HR, Marketing).
2. skills: array of 4-5 skill names relevant to the strategy (e.g. AI Fluency, Data Analytics, Leadership, Compliance).
3. employees: array of 6-12 people. Each must have: id (short unique string), name, role, type ("Employee" or "Consultant"), department (one of the departments), scores (object mapping each skill name to a number 0-100), actionPlan (one short sentence), targetDate (YYYY-MM-DD), status ("Pending", "In Progress", or "Completed").
4. criticalAction: one sentence AI recommendation highlighting the biggest gap or priority.`;

    const response = await retryOperation(() => ai.models.generateContent({
        model: COURSE_MODEL,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    departments: { type: Type.ARRAY, items: { type: Type.STRING } },
                    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    employees: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                name: { type: Type.STRING },
                                role: { type: Type.STRING },
                                type: { type: Type.STRING },
                                department: { type: Type.STRING },
                                scores: { type: Type.OBJECT },
                                actionPlan: { type: Type.STRING },
                                targetDate: { type: Type.STRING },
                                status: { type: Type.STRING },
                            },
                            required: ['id', 'name', 'role', 'type', 'department', 'scores', 'actionPlan', 'targetDate', 'status'],
                        },
                    },
                    criticalAction: { type: Type.STRING },
                },
                required: ['departments', 'skills', 'employees'],
            },
        },
    })) as GenerateContentResponse;

    const rawText = getResponseText(response);
    const parsed = JSON.parse(cleanJson(rawText || '{}')) as Record<string, unknown>;

    if (!Array.isArray(parsed.departments) || !Array.isArray(parsed.skills) || !Array.isArray(parsed.employees)) {
        return null;
    }

    const departments = parsed.departments.filter((d): d is string => typeof d === 'string');
    const skills = parsed.skills.filter((s): s is string => typeof s === 'string');
    const criticalAction = typeof parsed.criticalAction === 'string' ? parsed.criticalAction : undefined;

    const employees: BiceEmployee[] = (parsed.employees as Record<string, unknown>[]).map((emp, idx) => {
        const type = emp.type === 'Consultant' ? 'Consultant' : 'Employee';
        const status =
            emp.status === 'Completed' ? 'Completed' :
                emp.status === 'In Progress' ? 'In Progress' : 'Pending';
        const scores: Record<string, number> = {};
        if (emp.scores && typeof emp.scores === 'object' && !Array.isArray(emp.scores)) {
            for (const [k, v] of Object.entries(emp.scores)) {
                if (typeof v === 'number') scores[k] = v;
            }
        }
        skills.forEach(s => {
            if (scores[s] === undefined) scores[s] = Math.min(100, Math.max(0, Math.round(Math.random() * 80)));
        });
        return {
            id: typeof emp.id === 'string' ? emp.id : `e${idx + 1}`,
            name: typeof emp.name === 'string' ? emp.name : 'Unknown',
            role: typeof emp.role === 'string' ? emp.role : 'Staff',
            type,
            department: typeof emp.department === 'string' && departments.includes(emp.department) ? emp.department : departments[0] || 'General',
            scores,
            actionPlan: typeof emp.actionPlan === 'string' ? emp.actionPlan : 'Review learning path',
            targetDate: typeof emp.targetDate === 'string' ? emp.targetDate : '2024-12-31',
            status,
        };
    });

    return { departments, skills, employees, criticalAction };
};

// --- Assessment ---

/** Raw shape returned by Gemini (question_text, type: "multiple_choice" | "open_ended", options, etc.) */
type GeminiAssessmentItem = {
    question_text?: string;
    question?: string;
    type?: string;
    options?: string[];
    correct_answer?: string;
    suggested_answer_placeholder?: string;
};

export const generateAssessment = async (course: Course): Promise<AssessmentQuestion[]> => {
    const ai = getClient();
    const prompt = `Generate a final assessment for the course: ${course.title || course.topic}.
    Include 3 multiple choice and 2 open ended questions.
    Return a JSON array. Each item must have:
    - "type": "multiple_choice" or "open_ended"
    - "question_text": the question string
    - For multiple_choice: "options" (array of strings), "correct_answer" (string)
    - For open_ended: "suggested_answer_placeholder" (optional string)
    Return only the JSON array, no other text.`;
    
    const response = await retryOperation(() => ai.models.generateContent({
        model: COURSE_MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    })) as GenerateContentResponse;
    const rawText = getResponseText(response);
    const rawList: GeminiAssessmentItem[] = JSON.parse(cleanJson(rawText || '[]'));
    if (!Array.isArray(rawList)) return [];

    return rawList.map((item, index): AssessmentQuestion => {
        const questionText = item.question_text || item.question || '';
        const typeStr = (item.type || '').toLowerCase();
        const type: AssessmentQuestionType = typeStr === 'open_ended' || typeStr === 'open ended'
            ? AssessmentQuestionType.OPEN_ENDED
            : AssessmentQuestionType.MULTIPLE_CHOICE;
        return {
            id: `aq-${Date.now()}-${index}`,
            question: questionText,
            type,
            options: Array.isArray(item.options) ? item.options : (type === AssessmentQuestionType.MULTIPLE_CHOICE ? [] : undefined),
        };
    });
};

export const evaluateAssessment = async (course: Course, questions: AssessmentQuestion[], answers: any): Promise<AssessmentResult> => {
    const ai = getClient();
    const prompt = `Grade this assessment.
    Course: ${course.title}
    Questions: ${JSON.stringify(questions)}
    Answers: ${JSON.stringify(answers)}
    
    Return JSON with score (0-100), passed (bool), and feedback string.`;
    
    const response = await retryOperation(() => ai.models.generateContent({
        model: COURSE_MODEL,
        contents: prompt,
        config: { 
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    passed: { type: Type.BOOLEAN },
                    feedback: { type: Type.STRING }
                }
            }
        }
    })) as GenerateContentResponse;
    return JSON.parse(cleanJson(response.text || '{}'));
};

export const synthesizeAssessmentReport = async (assessment: ExternalAssessment): Promise<string> => {
    const ai = getClient();
    const prompt = `Synthesize an executive report based on these expert insights for ${assessment.title}:
    ${JSON.stringify(assessment.insights)}
    
    Identify common themes, conflicting opinions, and strategic recommendations.`;
    
    const response = await retryOperation(() => ai.models.generateContent({
        model: COURSE_MODEL,
        contents: prompt
    })) as GenerateContentResponse;
    return response.text || '';
};

export const generateMeetingPrep = async (type: string, context: string) => {
    const ai = getClient();
    const prompt = `Prepare a meeting briefing for a ${type} meeting.
    Context: ${context}
    
    Return JSON with objective, smartQuestions (array), potentialRisks (array), talkingPoints (array).`;
    
    const response = await retryOperation(() => ai.models.generateContent({
        model: COURSE_MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    })) as GenerateContentResponse;
    return JSON.parse(cleanJson(response.text || '{}'));
};

export const generateDailyInsight = async (userName: string, topic: string) => {
    const ai = getClient();
    const prompt = `Generate a short, inspiring "Daily Neural Insight" for ${userName} learning about ${topic}. One sentence.`;
    const response = await retryOperation(() => ai.models.generateContent({
        model: COURSE_MODEL,
        contents: prompt
    })) as GenerateContentResponse;
    return response.text || 'Keep learning!';
};
