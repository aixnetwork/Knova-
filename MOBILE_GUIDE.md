
# KnovaTwin Mobile Integration Guide

Each AI Expert Twin created in KnovaTwin is automatically "Mobile-Ready." You can integrate them into existing iOS/Android apps or use them as standalone Web-Apps.

## 1. Standalone Deployment (PWA)
Users can install any Twin as a native app:
1. Open the Twin's unique URL in Safari (iOS) or Chrome (Android).
2. Tap "Share" (iOS) or the three dots (Android).
3. Select **"Add to Home Screen."**
4. The Twin now appears on the home screen, has no browser address bar, and uses its own theme color.

## 2. WebView Integration
To embed a Subject Expert into an existing mobile app:
- Use an `<iframe>` or a native `WebView` component.
- Point the source to: `https://your-domain.com?view=public_agent&twinId=[TWIN_ID]`
- Ensure the WebView has **Microphone Permissions** enabled to allow the Live Voice API.

## 3. Expertise Persistence
Expertise is passed via the `twinId`. The `PublicAgentRenderer` retrieves the:
- **System Prompt:** The "Subject Matter Expertise" (e.g., Coding standards, HR policy).
- **Voice DNA:** The specific tone and accent configured in Twin Lab.
- **Visual Identity:** The AI-generated avatar.

## 4. Performance at the Edge
Because KnovaTwin uses **BYO-Key Distributed Compute**, the mobile device handles the AI inference directly. This means:
- **Zero Server Latency:** Direct connection to Google's edge.
- **Infinite Scalability:** No central server to crash during traffic spikes.
- **Privacy:** User conversations never leave the mobile device.
