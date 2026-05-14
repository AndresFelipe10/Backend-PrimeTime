const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { materias, tareas } = req.body;

        console.log("📩 Petición recibida en /api/analizar");

        console.log(
            "Gemini API Key cargada:",
            process.env.GEMINI_API_KEY ? "SÍ" : "NO"
        );

        const prompt = `
Analiza la carga académica y responde ÚNICAMENTE con este JSON:

{
  "nivelCarga":"Alta/Media/Baja",
  "porcentajeCarga":0,
  "advertencias":[],
  "recomendaciones":[],
  "consejoDia":""
}

Datos:
Materias: ${JSON.stringify(materias)}
Tareas: ${JSON.stringify(tareas)}
`;

        const url =
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await axios.post(
            url,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log("Respuesta Gemini recibida");

        if (
            !response.data.candidates ||
            !response.data.candidates.length
        ) {
            throw new Error(
                'Gemini no devolvió candidatos'
            );
        }

        const text =
            response.data.candidates[0]
            ?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error(
                'Gemini devolvió respuesta vacía'
            );
        }

        const cleanText = text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        let resultado;

        try {
            resultado = JSON.parse(cleanText);
        } catch {
            console.error("JSON inválido:", cleanText);

            return res.status(500).json({
                error: "Gemini devolvió un formato inválido",
                contenido: cleanText
            });
        }

        console.log("✅ Análisis completado");

        res.json(resultado);

    } catch (err) {
        console.error(
            '❌ ERROR GEMINI:',
            err.response?.data || err.message
        );

        res.status(500).json({
            error: 'Error en análisis',
            details: err.response?.data || err.message
        });
    }
});

module.exports = router;