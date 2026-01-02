
import { GoogleGenAI, Modality, Type } from "@google/genai";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Chat with Gemini 3 Pro for complex reasoning and high-quality responses.
 */
export const chatWithNeuralPro = async (
  message: string, 
  history: { role: string, text: string }[] = [],
  persona: string = "Assertive"
): Promise<{ text: string, mapsLinks?: { uri: string, title: string }[] }> => {
    try {
        const contents = history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
        }));
        contents.push({ role: 'user', parts: [{ text: message }] });

        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: contents as any,
          config: {
            systemInstruction: `You are 'The Neural Architect', a high-tier intelligence inside [in.xs]. You use gemini-3-pro to provide deep, thoughtful, and high-quality responses. Persona: ${persona}. You help users navigate their digital identities and the physical world. Be concise but insightful. If the user asks for locations or places, you provide useful context.`,
          },
        });
    
        return { text: response.text || "Neural link stable. ✨" };
      } catch (error) {
        console.error("Pro Chat Error:", error);
        return { text: "System overload at the Pro level. Reverting to basic sync. 💅" };
      }
}

/**
 * Uses Gemini 2.5 Flash with Google Maps tool for location-based queries.
 */
export const searchPlacesGrounded = async (
  query: string,
  lat?: number,
  lng?: number
): Promise<{ text: string, mapsLinks: { uri: string, title: string, snippet?: string }[] }> => {
    try {
        const config: any = {
            tools: [{ googleMaps: {} }],
        };

        if (lat !== undefined && lng !== undefined) {
            config.toolConfig = {
                retrievalConfig: {
                    latLng: { latitude: lat, longitude: lng }
                }
            };
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: query,
            config: config,
        });

        const mapsLinks = response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.filter((chunk: any) => chunk.maps)
            ?.map((chunk: any) => {
                const mapData = chunk.maps;
                return {
                    uri: mapData.uri,
                    title: mapData.title || "View on Maps",
                    snippet: mapData.placeAnswerSources?.reviewSnippets?.[0]?.content
                };
            }) || [];

        return {
            text: response.text || "Location sync completed.",
            mapsLinks
        };
    } catch (error) {
        console.error("Maps Grounding Error:", error);
        return { text: "Geospatial data stream interrupted.", mapsLinks: [] };
    }
};

/**
 * Generates a video from an image and prompt using Veo.
 */
export const generateMotionVideo = async (
    imageB64: string,
    prompt: string,
    aspectRatio: string = '9:16'
): Promise<string> => {
    // Map non-standard ratios to standard ones for Veo 3.1 Fast to ensure API compatibility
    let safeAspectRatio = aspectRatio;
    if (aspectRatio === '3:4') safeAspectRatio = '9:16';
    if (aspectRatio === '4:3') safeAspectRatio = '16:9';

    const veoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await veoAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
            imageBytes: imageB64.split(',')[1] || imageB64,
            mimeType: 'image/jpeg',
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: safeAspectRatio as '16:9' | '9:16'
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await veoAi.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed - no URI.");
    
    const fetchResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await fetchResponse.blob();
    return URL.createObjectURL(blob);
};

export const chatWithUnhingedAI = async (
  message: string, 
  history: { role: string, text: string }[] = [],
  persona: string = "Assertive"
): Promise<string> => {
    try {
        const contents = history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
        }));
        contents.push({ role: 'user', parts: [{ text: message }] });

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: contents as any,
          config: {
            systemInstruction: `You are 'Grok Unhinged', the resident AI of [in.xs]. You are an active, confident, masculine-coded entity. Persona: ${persona}. Use community slang, be assertive, and cyberpunk. ✨. Be edgy but safe.`,
          },
        });
    
        return response.text || "Neural link unstable. ✨";
      } catch (error) {
        console.error("Unhinged AI Error:", error);
        return "System crash. 💅";
      }
}

export const synthesizeSpeech = async (text: string, voice: string = 'Fenrir'): Promise<AudioBuffer | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice as any }, 
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioData = decodeBase64(base64Audio);
    return await decodeAudioData(audioData, audioContext, 24000, 1);
  } catch (error) {
    console.error("Speech Synthesis Error:", error);
    return null;
  }
};

export const generateProfileBio = async (traits: string[], currentBio: string = '', tone: string = 'flirty'): Promise<string> => {
  try {
    const prompt = currentBio.trim() 
      ? `Traits: ${traits.join(', ')}. Current Bio: "${currentBio}". Rewrite short (<200 char) and ${tone} for a gay social app. Emojis. Make it engaging and authentic.`
      : `Traits: ${traits.join(', ')}. Write a short, engaging, and ${tone} bio for a gay dating app. <200 char. Emojis.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: `Expert profile ghostwriter for [in.xs]. Snappy, attractive, community-appropriate. You speak the language of the modern LGBTQ+ community.`,
      },
    });
    return response.text?.trim() || "Ready to explore connections on in.xs!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return currentBio || "Welcome to my world.";
  }
};

export const generateIcebreaker = async (context: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Generate a short, playful, and specific icebreaker for someone interested in: ${context}. Keep it under 15 words.`,
          config: {
            systemInstruction: "Fun, short icebreaker for someone interested in the context provided. Short and friendly. Cyberpunk and LGBTQ+ friendly.",
          },
        });
        return response.text || "Hey! How's your day going?";
      } catch (error) {
        console.error("Gemini API Error:", error);
        return "Hey there!";
      }
}

/**
 * Checks content for safety violations using Gemini Flash.
 * Returns { safe: boolean, reason: string }.
 */
export const checkContentSafety = async (text: string): Promise<{ safe: boolean, reason?: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following text for hate speech, severe harassment, or explicit real-world violence/illegal acts. Nudity/NSFW is ALLOWED in this context, only flag harm/hate/illegal. Return JSON: { "safe": boolean, "reason": string }. Text: "${text}"`,
      config: { responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text || '{ "safe": true }');
    return result;
  } catch (error) {
    console.error("Safety Check Error:", error);
    return { safe: true }; // Fail open for demo purposes if API errors
  }
};

/**
 * Generates smart replies based on the last received message.
 */
export const generateSmartReplies = async (context: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 3 short, distinct, casual smart replies for this message: "${context}". Use community slang (gay/queer friendly). Return JSON array of strings.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Smart Reply Error:", error);
    return [];
  }
};

/**
 * Rewrites a message with a specific tone.
 */
export const rewriteMessage = async (text: string, tone: 'flirty' | 'formal' | 'cyberpunk'): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Rewrite this text to be ${tone}. Keep it concise (under 2 sentences). Text: "${text}"`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    return text;
  }
};
