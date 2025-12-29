import { GoogleGenAI, Type } from "@google/genai";
import { JournalEntry } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateDailyInsight = async (entry: JournalEntry): Promise<{ text: string, mood: 'positive' | 'neutral' | 'needs-care' }> => {
  if (!process.env.API_KEY) {
    return { 
      text: "坚持记录是变好的第一步。（需要 API Key 才能获取 AI 洞察）", 
      mood: 'neutral' 
    };
  }

  const prompt = `
    作为一位温暖、有同理心的个人成长教练，请分析用户的这篇日记。
    
    用户今天的成就：${entry.achievements.join(', ')}
    用户今天的幸福时刻：${entry.happiness.join(', ')}
    能量消耗情况：${entry.drainerLevel} (${entry.drainerNote || '无详细说明'})
    今天最重要的事情：${entry.todayMitDescription}
    是否完成：${entry.mitCompleted ? "是" : "否"}
    ${!entry.mitCompleted ? `未完成原因：${entry.mitReason}` : ''}
    明天最重要的事：${entry.tomorrowMit}

    任务：
    1. 提供一段简短、温暖的中文反馈（不超过 50 字）。如果用户完成了重要事项或有成就感，给予肯定；如果有能量消耗或未完成事项，给予温柔的鼓励或建议。
    2. 判断这篇日记的整体情绪基调 (positive, neutral, needs-care)。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING },
            mood: { type: Type.STRING, enum: ['positive', 'neutral', 'needs-care'] }
          },
          required: ['insight', 'mood']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      text: result.insight || "每天进步一点点，加油！",
      mood: result.mood || 'neutral'
    };

  } catch (error) {
    console.error("Gemini AI Error:", error);
    return {
      text: "很高兴看到你今天的记录，继续保持。",
      mood: 'neutral'
    };
  }
};