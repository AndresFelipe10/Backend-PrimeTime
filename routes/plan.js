const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { materias, tareas } = req.body;

        console.log("📩 Petición recibida en /api/plan");

        console.log(
            "Gemini API Key:",
            process.env.GEMINI_API_KEY ? "CARGADA ✅" : "NO ENCONTRADA ❌"
        );

        const prompt = `
### ROL
Actúa como un Asistente de Aprendizaje de Alto Rendimiento y Tutor Experto en áreas STEM y Humanidades. Tu objetivo es optimizar el tiempo del estudiante integrando sus clases y tareas en un plan de estudio cohesivo.

### DATOS DE ENTRADA
1. Horario de Clases Semanal:
${JSON.stringify(materias)}

2. Compromisos/Tareas Pendientes:
${JSON.stringify(tareas)}

### TAREAS
1. Identifica bloques libres.
2. Prioriza tareas difíciles.
3. Da guías profesionales concretas.

### REGLAS
- Responde ÚNICAMENTE JSON válido
- Sin texto adicional
- Hora formato HH:mm

### ESTRUCTURA

{
  "dias":[
    {
      "dia":"Lunes",
      "sesiones":[
        {
          "hora":"HH:mm",
          "materia":"Nombre",
          "actividad":"Descripción",
          "duracionMin":60,
          "esEstudioIndependiente":true
        }
      ]
    }
  ]
}
`.trim();

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

        console.log("📨 Respuesta recibida desde Gemini");

        if (
            !response.data.candidates ||
            response.data.candidates.length === 0
        ) {
            throw new Error(
                "Gemini no devolvió candidatos"
            );
        }

        const text =
            response.data.candidates[0]
            ?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error(
                "Gemini devolvió texto vacío"
            );
        }

        const cleanText = text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        let resultado;

        try {
            resultado = JSON.parse(cleanText);
        } catch (e) {
            console.error(
                "❌ JSON inválido recibido:",
                cleanText
            );

            return res.status(500).json({
                error: "Gemini devolvió JSON inválido",
                rawResponse: cleanText
            });
        }

        console.log("✅ Plan generado correctamente");

        res.json(resultado);

    } catch (err) {

        console.error(
            "❌ ERROR GEMINI:",
            err.response?.data || err.message
        );

        res.status(500).json({
            error: "Error generando plan",
            details: err.response?.data || err.message
        });
    }
});

module.exports = router;