const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
    const { materias, tareas } = req.body;
    console.log("¡Petición recibida en /api/plan!");

    const prompt = `
    ### ROL
    Actúa como un Asistente de Aprendizaje de Alto Rendimiento y Tutor Experto en áreas STEM y Humanidades. Tu objetivo es optimizar el tiempo del estudiante integrando sus clases y tareas en un plan de estudio cohesivo.

    ### DATOS DE ENTRADA (Contexto del Estudiante)
    1. Horario de Clases Semanal: ${JSON.stringify(materias)}
    2. Compromisos/Tareas Pendientes: ${JSON.stringify(tareas)}

    ### TAREAS DEL ASISTENTE
    1. **Sincronización:** Identifica los "huecos" o bloques libres entre las clases y después de la jornada académica.
    2. **Priorización Inteligente:** Ubica las tareas de mayor dificultad o prioridad en los momentos de mayor frescura mental (bloques de 60-90 min).
    3. **Enfoque Profesional:** Para cada tarea, actúa como un experto en esa materia específica (ej. Desarrollador Senior para Programación, Matemático para Cálculo). En la "actividad", no solo digas "estudiar", da una guía estratégica de resolución (ej. "Implementar patrón Repository en el Proyecto Android").

    ### REGLAS DE FORMATO
    - Responde ÚNICAMENTE con un JSON válido.
    - No incluyas explicaciones de texto fuera del JSON.
    - Usa formato de 24 horas (HH:mm).

    ### ESTRUCTURA DE SALIDA (JSON)
    {
      "dias": [
        {
          "dia": "Lunes",
          "sesiones": [
            {
              "hora": "HH:mm",
              "materia": "Nombre de la materia",
              "actividad": "Guía profesional concisa para resolver la tarea o reforzar el tema visto en clase",
              "duracionMin": 60,
              "esEstudioIndependiente": true
            }
          ]
        }
      ]
    }
    `.trim();

    console.log("¡Petición recibida! Intentando con Gemini Flash-8b...");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        const text = response.data.candidates[0].content.parts[0].text;
        const cleanJson = JSON.parse(text.replace(/```json|```/g, '').trim());

        console.log("✅ Plan generado con éxito");
        res.json(cleanJson);

    } catch (err) {
        console.error('[plan] Error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Error en plan', message: err.message });
    }
});

module.exports = router;