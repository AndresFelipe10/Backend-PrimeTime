const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        // 1. CAPTURAMOS EL USERID: Igual que en plan.js para trazabilidad
        const { materias, tareas, userId } = req.body;

        console.log(`📩 Petición de Análisis recibida para el Usuario ID: ${userId || 'No proporcionado'}`);

        console.log(
            "Gemini API Key cargada:",
            process.env.GEMINI_API_KEY ? "SÍ" : "NO"
        );

        const prompt = `
Analiza la carga académica y responde usando el esquema JSON provisto.

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

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

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
                ],
                // 2. CONFIGURACIÓN NATIVA: Forzamos el formato JSON limpio directamente
                generationConfig: {
                    responseMimeType: "application/json"
                }
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
            throw new Error('Gemini no devolvió candidatos');
        }

        const text = response.data.candidates[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('Gemini devolvió respuesta vacía');
        }

        let resultado;
        try {
            // Ya viene sin los bloques de código Markdown ```json
            resultado = JSON.parse(text);
        } catch {
            console.error("JSON inválido:", text);
            return res.status(500).json({
                error: "Gemini devolvió un formato inválido",
                contenido: text
            });
        }

        console.log(`✅ Análisis completado para el usuario ${userId}`);
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