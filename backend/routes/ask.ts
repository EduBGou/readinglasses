import { Router } from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();
export default router;

router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const { message, history } = req.body;

        if (!message) {
            res.status(400).json({ error: "The 'message' field is required." });
            return;
        }
        const chat = ai.chats.create({
            model: 'gemini-3.5-flash-lite',
            history: history || []
        });

        const result = await chat.sendMessage({
            message: `Este seguinte trecho foi retirado de um documento ou livro, explique o que escritor quis dizer com: '${message}'. Responda-me no idioma do trecho.`
        });

        res.json({ answer: result.text });
    } catch (error) {
        console.error("Gemini API Error - ", error);
        res.status(500).json({ error: "Failed to generate AI response." });
    }
});
