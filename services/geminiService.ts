
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
    AssessmentResult, 
    ExternalAssessment,
    MarketingAssets,
    MicroLesson
} from '../types';

export const COURSE_MODEL = 'gemini-2.5-flash';
// According to guidelines, default to gemini-2.5-flash-image using generateContent
export const IMAGE_MODEL = 'gemini-2.5-flash-image'; 
export const SPEECH_MODEL = 'gemini-2.5-flash-preview-tts';

// --- Client Management ---
let client: GoogleGenAI | null = null;

export const getClient = (): GoogleGenAI => {
    if (!client) {
        // Robust Key Retrieval: Checks Vite env, Process env, then Local Storage with Safety Checks
        const metaEnv = (import.meta as any)?.env || {};
        const processEnv = typeof process !== 'undefined' ? process.env : {};

        const rawKey = metaEnv.VITE_API_KEY || 
                       processEnv.API_KEY || 
                       processEnv.VITE_API_KEY || 
                       localStorage.getItem('knovatwin_custom_api_key') || 
                       '';
        
        const apiKey = rawKey.trim();
                       
        if (!apiKey) {
            console.warn("API Key not found in environment or local storage");
        }
        client = new GoogleGenAI({ apiKey });
    }
    return client;
};

export const hasValidKey = (): boolean => {
    const metaEnv = (import.meta as any)?.env || {};
    const processEnv = typeof process !== 'undefined' ? process.env : {};
    const rawKey = metaEnv.VITE_API_KEY || 
                   processEnv.API_KEY || 
                   processEnv.VITE_API_KEY || 
                   localStorage.getItem('knovatwin_custom_api_key') || 
                   '';
    return rawKey.trim().length > 0;
};

export const resetClient = () => {
    client = null;
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
        return { valid: false, error: error.message || 'Invalid API Key' };
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
    - description (detailed summary of what will be covered)
    - keyConcepts (array of strings, specific terms/ideas from the source)
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
                keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['title', 'description', 'keyConcepts']
            }
          }
        },
        required: ['title', 'description', 'modules']
      }
    }
  })) as GenerateContentResponse;
  
  const data = JSON.parse(cleanJson(response.text || '{}'));
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
export const generateBiceData = async (industry: string, strategy: string) => {
    const ai = getClient();
    const prompt = `Generate mock BICE (Business Impact) data for:
    Industry: ${industry}
    Strategy: ${strategy}
    
    Return JSON with departments, skills, and a list of employees with scores.`;
    
    const response = await retryOperation(() => ai.models.generateContent({
        model: COURSE_MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    })) as GenerateContentResponse;
    return JSON.parse(cleanJson(response.text || '{}'));
};

// --- Assessment ---

export const generateAssessment = async (course: Course): Promise<AssessmentQuestion[]> => {
    const ai = getClient();
    const prompt = `Generate a final assessment for the course: ${course.title}.
    Include 3 multiple choice and 2 open ended questions.
    Return JSON.`;
    
    const response = await retryOperation(() => ai.models.generateContent({
        model: COURSE_MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' } 
    })) as GenerateContentResponse;
    return JSON.parse(cleanJson(response.text || '[]'));
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
