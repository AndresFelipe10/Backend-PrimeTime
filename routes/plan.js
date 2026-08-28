const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        // 1. CAPTURAMOS EL USERID
        const { materias, tareas, userId } = req.body;

        console.log(`📩 Petición de IA recibida para el Usuario ID: ${userId || 'No proporcionado'}`);

        console.log(
            'Gemini API Key:',
            process.env.GEMINI_API_KEY ? 'CARGADA ✅' : 'NO ENCONTRADA ❌'
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

        // Usamos gemini-2.5
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
        };

        const requestConfig = {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        };

        let response;
        let intentos = 3;
        let espera = 1000; // 1 segundo inicial

        // Bucle de reintentos en caso de saturación (503 o 429)
        for (let i = 0; i < intentos; i++) {
            try {
                response = await axios.post(url, requestBody, requestConfig);
                break; // Si es exitoso, rompe el bucle
            } catch (error) {
                const status = error.response?.status;
                if ((status === 503 || status === 429) && i < intentos - 1) {
                    console.warn(`⚠️ Gemini saturado (Status: ${status}). Reintentando en ${espera}ms... (Intento ${i + 1}/${intentos})`);
                    await new Promise(res => setTimeout(res, espera));
                    espera *= 2; // Duplica el tiempo de espera (Backoff)
                } else {
                    throw error; // Lanza el error al catch principal
                }
            }
        }

        console.log('📨 Respuesta recibida desde Gemini');

        if (!response.data.candidates || response.data.candidates.length === 0) {
            throw new Error('Gemini no devolvió candidatos');
        }

        const text = response.data.candidates[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('Gemini devolvió texto vacío');
        }

        let resultado;
        try {
            resultado = JSON.parse(text);
        } catch {
            console.error('❌ JSON inválido recibido:', text);
            return res.status(500).json({
                success: false,
                message: 'La Inteligencia Artificial devolvió un formato que no se pudo procesar.',
                rawResponse: text
            });
        }

        console.log(`✅ Plan generado correctamente para el usuario ${userId}`);
        res.json(resultado);

    } catch (err) {
        console.error('❌ ERROR GEMINI:', err.response?.data || err.message);

        const status = err.response?.status;

        // Si el error es 503 después de todos los reintentos
        if (status === 503 || (err.message && err.message.includes('503'))) {
            return res.status(503).json({
                success: false,
                message: 'Los servidores de IA están experimentando una demanda altísima en este momento. Por favor, intenta generar tu plan en un par de minutos.'
            });
        }

        // Para cualquier otro tipo de error
        res.status(500).json({
            success: false,
            message: 'Ocurrió un error inesperado al conectar con el motor de Inteligencia Artificial.',
            details: err.response?.data || err.message
        });
    }
});

module.exports = router;