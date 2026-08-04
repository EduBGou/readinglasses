import { Router } from "express";

const router = Router();
export default router;

router.get('/', async (req, res): Promise<void> => {
    try {
        const sl = req.query.sl as string;
        const tl = req.query.tl as string;
        const text = req.query.text as string;

        if (!text || !sl || !tl) {
            res.status(400).json({ error: "Missing required query parameters: 'text', 'sl', or 'tl'" });
            return; 
        }

        const translationResponse = await fetch("http://libretranslate:5000/translate", {
            method: "POST",
            body: JSON.stringify({
                q: text,
                source: sl,
                target: tl,
                format: "text"
            }),
            headers: { "Content-Type": "application/json" },
        });

        if (!translationResponse.ok) {
            const errorText = await translationResponse.text();
            throw new Error(`LibreTranslate Error: ${errorText}`);
        }

        const translationJson = await translationResponse.json();
        res.send(translationJson);

    } catch (error) {
        console.error("Translation fetch failed:", error);
        res.status(500).json({ error: "Internal server error while fetching translation." });
    }
});