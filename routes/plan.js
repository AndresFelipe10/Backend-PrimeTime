const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        // 1. CAPTURAMOS EL USERID: Ahora el backend sabe exactamente de quién es la petición
        const { materias, tareas, userId } = req.body;

        console.log(`📩 Petición de IA recibida para el Usuario ID: ${userId || 'No proporcionado'}`);

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
- Responde ÚNICAMENTE usando el esquema JSON provisto.
- Hora formato HH:mm

### ESTRUCTURA DE SALIDA REQUERIDA
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

        // URL de la API de Gemini
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
                // 2. CONFIGURACIÓN NATIVA: Forzamos a Gemini a responder en formato JSON puro
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

        console.log("📨 Respuesta recibida desde Gemini");

        if (
            !response.data.candidates ||
            response.data.candidates.length === 0
        ) {
            throw new Error("Gemini no devolvió candidatos");
        }

        const text = response.data.candidates[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error("Gemini devolvió texto vacío");
        }

        let resultado;
        try {
            // Al usar responseMimeType, text ya viene como un JSON string limpio sin ```json
            resultado = JSON.parse(text);
        } catch (e) {
            console.error("❌ JSON inválido recibido:", text);
            return res.status(500).json({
                error: "Gemini devolvió un formato inválido",
                rawResponse: text
            });
        }

        console.log(`✅ Plan generado correctamente para el usuario ${userId}`);
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