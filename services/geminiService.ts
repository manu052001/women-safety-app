import { GoogleGenAI } from "@google/genai";
import { ChatMessage, PoliceStation } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const findNearestPoliceStation = async (lat: number, lng: number): Promise<PoliceStation | null> => {
  if (!apiKey) return null;

  try {
    // Request a specific format to make parsing easier since JSON schema isn't supported with Google Maps tool
    const prompt = `
      Find the nearest police station to Latitude: ${lat}, Longitude: ${lng}. 
      Provide the output specifically in this format:
      Name: [Station Name]
      Address: [Station Address]
      Phone: [Phone Number or "100" if unavailable]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
            retrievalConfig: {
                latLng: {
                    latitude: lat,
                    longitude: lng
                }
            }
        }
      }
    });

    // Extract grounding URI if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let mapsUri = '';
    
    if (groundingChunks) {
        // Look for the first valid maps URI
        for (const chunk of groundingChunks) {
            if (chunk.web?.uri && chunk.web.uri.includes('maps.google')) {
                mapsUri = chunk.web.uri;
                break;
            }
        }
    }

    const text = response.text || '';
    
    // Basic parsing based on the requested format
    const nameMatch = text.match(/Name:\s*(.+)/i);
    const addressMatch = text.match(/Address:\s*(.+)/i);
    const phoneMatch = text.match(/Phone:\s*(.+)/i);

    const name = nameMatch ? nameMatch[1].trim() : "Nearest Authority";
    const address = addressMatch ? addressMatch[1].trim() : text.substring(0, 100); // Fallback to raw text if parse fails
    const phoneNumber = phoneMatch ? phoneMatch[1].trim() : "100";

    return {
      name,
      address,
      phoneNumber,
      googleMapsUri: mapsUri || `https://www.google.com/maps/search/police+station/@${lat},${lng},14z`
    };

  } catch (error) {
    console.error("Gemini Maps Error:", error);
    return null;
  }
};

export const generateEmergencyMessage = async (
  lat: number,
  lng: number,
  policeStation?: PoliceStation | null
): Promise<string> => {
  if (!apiKey) {
    let msg = `*SOS! I NEED HELP!* I'm in danger.\n\n📍 *My Live Location:*\nhttps://www.google.com/maps?q=${lat},${lng}`;
    if (policeStation) {
      msg += `\n\n👮 *Nearest Police:* ${policeStation.name}`;
    }
    msg += `\n\n📸 *Evidence is being recorded.*`;
    return msg;
  }

  try {
    const prompt = `
      I am in an emergency situation. 
      My coordinates: ${lat}, ${lng}.
      ${policeStation ? `Nearest Police Station: ${policeStation.name} (${policeStation.address}, Phone: ${policeStation.phoneNumber}).` : ''}
      
      Write a VERY URGENT WhatsApp message using bold formatting (*text*).
      1. State "SOS! HELP NEEDED!" clearly.
      2. Include the Google Maps link: https://www.google.com/maps?q=${lat},${lng}
      3. Mention I am recording evidence.
      4. Mention the nearest police station details if available.
      Keep it under 300 characters.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return `*SOS! HELP!* I am in danger.\n📍 https://www.google.com/maps?q=${lat},${lng}`;
  }
};

export const getSafetyAdvice = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  if (!apiKey) return "I cannot connect to the AI service right now. Please call emergency services directly if you are in danger.";

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are Women Safety AI, a safety assistant. Your goal is to provide calm, practical, and immediate safety advice to women. If the user seems to be in immediate danger, tell them to call the police/emergency services immediately. Keep responses concise and actionable. Do not be verbose.",
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Connection error. Please ensure you are safe and try again, or contact emergency services.";
  }
};