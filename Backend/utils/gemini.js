import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getGeminiAPIResponse = async (prompt, options = {}) => {
    const { systemInstruction, image, history = [] } = options;

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: systemInstruction || undefined 
        });

        const currentMessageParts = [];
        if (image && image.data) {
            currentMessageParts.push({ 
                inlineData: { mimeType: image.mimeType, data: image.data } 
            });
        }
        if (prompt) {
            currentMessageParts.push({ text: prompt });
        }

        if (currentMessageParts.length === 0) return "No text or image provided.";

        // 🧠 Scenario A: Multi-turn Chat Sequence (With History)
        if (history && history.length > 0) {
            const formattedHistory = history.map(msg => ({
                role: msg.role === "assistant" ? "model" : msg.role,
                parts: msg.parts.map(part => {
                    if (part.text) return { text: part.text };
                    if (part.inlineData) {
                        return {
                            inlineData: {
                                mimeType: part.inlineData.mimeType,
                                data: part.inlineData.data
                            }
                        };
                    }
                    return part;
                })
            }));

            // Last message ko history se nikaalte hain kyunki use sendMessage me bhejenge
            if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === "user") {
                formattedHistory.pop();
            }

            const chatSession = model.startChat({ history: formattedHistory });
            const result = await chatSession.sendMessage(currentMessageParts);
            return result.response.text();
        }

        // 📄 Scenario B: Standalone Request (No History)
        const result = await model.generateContent(currentMessageParts);
        return result.response.text();

    } catch (error) {
        console.error("Gemini API Error:", error);
        return "AI temporary pipeline disconnect. Try reloading your thread.";
    }
};

export default getGeminiAPIResponse;