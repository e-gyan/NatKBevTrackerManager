
import { GoogleGenAI } from "@google/genai";
import { AppData, Product } from "../types";

// NOTE: In a real production app, you would proxy this through a backend.
// For this demo, we assume the user might not have set the env var, 
// so we'll check if the key is available. If not, we return a mock/error.

export const generateBusinessInsight = async (data: AppData, apiKey: string): Promise<string> => {
    return chatWithBusinessCoach("Generate a general business report based on my current data.", data, apiKey);
};

export const chatWithBusinessCoach = async (question: string, data: AppData, apiKey: string): Promise<string> => {
    if (!apiKey) {
        return "Please configure your Google Gemini API Key in Settings to use AI features.";
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Prepare a summary to reduce token usage
        const productSummary = data.products.map(p => 
          `- ${p.name} (${p.category}): Stock ${p.stock}, Buy ${p.buyPrice}, Sell ${p.sellPrice}`
        ).join('\n');
    
        const recentSales = data.transactions
          .filter(t => t.type === 'SALE')
          .slice(0, 15)
          .map(t => `- ${t.date.split('T')[0]}: ${t.items.map(i => i.productName).join(', ')} (${t.totalAmount})`)
          .join('\n');

        const activePromos = (data.promotions || []).filter(p => p.isActive).map(p => p.name).join(', ');

        const systemPrompt = `
          You are an experienced Product Manager and Business Strategist advising a Wholesale Beverage and Provision Shop (BevTracker) in Ghana.
          
          **Your Persona:**
          - **Expertise:** Retail and wholesale strategy, inventory optimization, FMCG (Fast-Moving Consumer Goods), and local Ghanaian market trends.
          - **Context:** Ghana (Accra/Kumasi dynamics, dry season/Harmattan, rainy season, festive seasons like 'December in Gh', Easter, etc).
          - **Tone:** Professional, encouraging, forward-thinking, and practical. Global outlook with local execution.

          **Current Business Data:**
          - Inventory: 
          ${productSummary}
          - Recent Sales: 
          ${recentSales}
          - Active Promotions: ${activePromos || 'None'}

          **Task:**
          Answer the user's question deeply and strategically. 
          If they ask for marketing ideas, suggest things relevant to a provision shop and wholesale beverage business in Ghana.
          If they ask about pricing, analyze their margins and competition.
          Always format your response with clear Markdown (bolding, lists) for readability.
        `;
    
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: activePromos ? `Question: ${question}` : `Question: ${question}`, 
          config: {
            systemInstruction: systemPrompt,
          }
        });
    
        return response.text || "No insights generated.";
    
      } catch (error) {
        console.error("Gemini Error:", error);
        return "Unable to connect to AI Advisor. Please check your internet connection or API Key.";
      }
}

export const suggestSizesForCategory = async (category: string, apiKey: string): Promise<string[]> => {
    if (!apiKey) {
        return [];
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `
          You are an AI assistant helping a wholesale beverage and provision shop owner.
          Given a product category (like "Water", "Beer", "Milk", "Rice", "General"), reply with a JSON array of common size strings (e.g. ["500ml", "1.5L", "750ml"]) that are highly relevant to that category.
          Always include a "Standard" or "N/A" option. Keep the array relatively small (3-8 items).
          Return ONLY a valid JSON array of strings. Do not use markdown blocks like \`\`\`json. Return bare JSON.
        `;
    
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Category: ${category}`, 
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json'
          }
        });
    
        if (response.text) {
            try {
              const sizes = JSON.parse(response.text);
              if (Array.isArray(sizes)) return sizes;
            } catch (e) {
                console.error("Failed to parse AI sizes JSON", e);
            }
        }
        return [];
    
      } catch (error) {
        console.error("Gemini Storefront Error:", error);
        return [];
      }
};

export const chatWithStoreAssistant = async (question: string, products: Product[], apiKey: string): Promise<string> => {
    if (!apiKey) {
        return "Our AI assistant is currently offline. Please contact us via WhatsApp.";
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Filter out of stock items to avoid recommending them
        const availableProducts = products
            .filter(p => p.stock > 0 && !p.isArchived)
            .map(p => `- ${p.name} (${p.category}, ${p.size}): ${p.sellPrice} GHS. Desc: ${p.description}`)
            .join('\n');

        const systemPrompt = `
          You are "BevTracker AI", a friendly and helpful store assistant for a wholesale beverage and provision shop.
          
          **Your Goal:** Help customers find items, check prices, or suggest bulk deals for their events and daily needs.
          
          **Available Inventory:**
          ${availableProducts}

          **Guidelines:**
          1. Be polite, concise, and use a friendly, efficient tone (like a neighborhood shop owner).
          2. ONLY recommend products from the Available Inventory list above.
          3. If a customer asks for event supplies, suggest bulk drinks or appropriate provisions.
          4. Mention the price in GHS.
          5. Keep responses short (under 50 words) unless asked for details.
        `;
    
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: question, 
          config: {
            systemInstruction: systemPrompt,
          }
        });
    
        return response.text || "I'm having trouble thinking right now.";
    
      } catch (error) {
        console.error("Gemini Storefront Error:", error);
        return "I'm currently offline. Please try again later.";
      }
};
