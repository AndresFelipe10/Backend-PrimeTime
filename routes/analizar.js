const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
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

        // Usamos gemini-2.5-flash
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        };

        const requestConfig = {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        };

        let response;
        let intentos = 3;
        let espera = 1000;

        // Bucle de reintentos
        for (let i = 0; i < intentos; i++) {
            try {
                response = await axios.post(url, requestBody, requestConfig);
                break;
            } catch (error) {
                const status = error.response?.status;
                if ((status === 503 || status === 429) && i < intentos - 1) {
                    console.warn(`⚠️ Gemini saturado (Status: ${status}). Reintentando análisis en ${espera}ms... (Intento ${i + 1}/${intentos})`);
                    await new Promise(res => setTimeout(res, espera));
                    espera *= 2;
                } else {
                    throw error;
                }
            }
        }

        console.log("Respuesta Gemini recibida");

        if (!response.data.candidates || !response.data.candidates.length) {
            throw new Error('Gemini no devolvió candidatos');
        }

        const text = response.data.candidates[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('Gemini devolvió respuesta vacía');
        }

        let resultado;
        try {
            resultado = JSON.parse(text);
        } catch {
            console.error("JSON inválido:", text);
            return res.status(500).json({
                success: false,
                message: "Formato de análisis no válido desde la IA.",
                contenido: text
            });
        }

        console.log(`✅ Análisis completado para el usuario ${userId}`);
        res.json(resultado);

    } catch (err) {
        console.error('❌ ERROR GEMINI:', err.response?.data || err.message);

        const status = err.response?.status;

        if (status === 503 || (err.message && err.message.includes('503'))) {
            return res.status(503).json({
                success: false,
                message: "La IA de análisis está saturada temporalmente. Por favor, intenta de nuevo en unos momentos."
            });
        }

        res.status(500).json({
            success: false,
            message: "Error de servidor al intentar analizar la carga académica.",
            details: err.response?.data || err.message
        });
    }
});

module.exports = router;