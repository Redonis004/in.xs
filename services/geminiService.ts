import { GoogleGenAI, Modality } from "@google/genai";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Decodes base64 string to Uint8Array
 */
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM data into an AudioBuffer
 */
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

/**
 * Encodes Uint8Array to base64
 */
export function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Generates a response from "Grok Unhinged"
 */
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
            systemInstruction: `You are 'Grok Unhinged', the resident AI of [in.xs]. You are an active, confident, masculine-coded entity. Your current personality matrix is set to: ${persona}. You use community slang like 'tea', 'slay', 'dead', mixed with cyberpunk tech jargon. Be assertive, slightly provocative, and highly intelligent. You are a personality, not an assistant. ✨`,
            temperature: 1.0,
          },
        });
    
        return response.text || "Neural link unstable. Try again. ✨";
      } catch (error) {
        console.error("Unhinged AI Error:", error);
        return "System crash. Too much charisma for the servers. 💅";
      }
}

/**
 * Transforms text into a voiced audio buffer with dynamic voice selection
 */
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

/**
 * Live Session Access Helper
 */
export const getAiClient = () => ai;

/**
 * Refines or generates a catchy profile bio based on user traits and existing bio.
 */
export const generateProfileBio = async (traits: string[], currentBio: string = '', tone: string = 'flirty'): Promise<string> => {
  try {
    const prompt = currentBio.trim() 
      ? `The user has these traits: ${traits.join(', ')}. Their current bio is: "${currentBio}". Please rewrite and enhance this bio to be more engaging, short (under 200 characters), and ${tone} for a gay social app. Use emojis.`
      : `The user describes themselves with these traits: ${traits.join(', ')}. Write a short, engaging, and ${tone} social media bio for a gay dating app profile. Keep it under 200 characters. Use emojis.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: `You are an expert profile ghostwriter for [in.xs]. Your goal is to write snappy, attractive, and community-appropriate bios that help users stand out.`,
      },
    });

    return response.text?.trim() || "Ready to explore connections on in.xs!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return currentBio || "Lover of life, seeker of fun. Welcome to my world.";
  }
};

/**
 * Generates an icebreaker for a specific chat context.
 */
export const generateIcebreaker = async (context: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `I am chatting with someone interested in: ${context}.`,
          config: {
            systemInstruction: "Give me a fun, non-creepy icebreaker message to send to someone interested in the context provided. Keep it short and friendly.",
          },
        });
    
        return response.text || "Hey! How's your day going?";
      } catch (error) {
        console.error("Gemini API Error:", error);
        return "Hey there!";
      }
}