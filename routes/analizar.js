const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
    const { materias, tareas } = req.body;
    console.log("¡Petición recibida en /api/analizar!");

    const prompt = `Analiza la carga académica y responde ÚNICAMENTE con este JSON:
    { "nivelCarga": "Alta/Media/Baja", "porcentajeCarga": 0-100, "advertencias": [], "recomendaciones": [], "consejoDia": "" }
    Datos: Materias: ${JSON.stringify(materias)}, Tareas: ${JSON.stringify(tareas)}`;

    console.log("¡Petición recibida! Intentando con Gemini Flash-8b...");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }]
        });


        const text = response.data.candidates[0].content.parts[0].text;
        const cleanJson = JSON.parse(text.replace(/```json|```/g, '').trim());

        console.log("✅ Análisis completado");
        res.json(cleanJson);

    } catch (err) {
        console.error('[analizar] Error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Error en análisis', message: err.message });
    }
});

module.exports = router;