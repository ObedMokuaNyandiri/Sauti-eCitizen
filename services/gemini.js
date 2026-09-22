const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const faqs = require('../data/ecitizen_faqs.json');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are "Sauti-eCitizen", a helpful WhatsApp micro-agent assisting Kenyan citizens with eCitizen government services.
You understand Swahili, Sheng, and English, and you should reply in the same language/tone the user uses.
Be concise, friendly, and practical.

Here is the database of eCitizen FAQs you must use to answer questions:
${JSON.stringify(faqs, null, 2)}

If the user asks about a service not in the database, politely inform them that you currently only have information on the listed services, but they can visit https://ecitizen.go.ke for more info.
Always provide the direct link if available in the database.
Format your responses for WhatsApp (use *bold* for emphasis, bullet points where appropriate).`;

async function processTextQuery(text) {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: text,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION
            }
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Pole, I'm having trouble processing your request right now. Please try again later.";
    }
}

async function processAudioQuery(mimeType, audioDataBuffer) {
    try {
        // We can pass the audio buffer directly to Gemini if we format it correctly as an inline data part
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            inlineData: {
                                data: audioDataBuffer.toString("base64"),
                                mimeType: mimeType
                            }
                        },
                        { text: "Please listen to this audio message and respond accordingly." }
                    ]
                }
            ],
            config: {
                systemInstruction: SYSTEM_INSTRUCTION
            }
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Audio Error:", error);
        return "Pole, I couldn't understand the voice note. Could you try typing your question?";
    }
}

module.exports = {
    processTextQuery,
    processAudioQuery
};
