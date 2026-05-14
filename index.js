require('dotenv').config();

const express = require('express');
const cors = require('cors');

const planRouter = require('./routes/plan');
const analizarRouter = require('./routes/analizar');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3005;

// Middlewares principales
app.use(cors());
app.use(express.json());

// Middleware de logs
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);

    if (req.method === 'POST') {
        console.log(
            'Cuerpo de la petición:',
            JSON.stringify(req.body, null, 2)
        );
    }

    next();
});

// Definición de rutas
app.use('/api/plan', planRouter);
app.use('/api/analizar', analizarRouter);
app.use('/api/auth', authRouter);

// Endpoint de salud
app.get('/api/ping', (req, res) => {
    res.status(200).json({
        status: 'ok',
        mensaje: 'PrimeTime Backend activo',
        env: process.env.NODE_ENV || 'development',
        vercel: process.env.VERCEL ? true : false
    });
});

// Manejo global de errores
app.use((err, req, res, next) => {
    console.error('❌ [ERROR GLOBAL]:', err.stack);

    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message
    });
});

// Solo iniciar servidor local cuando NO esté en Vercel
if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Servidor local activo en: http://localhost:${PORT}`);

        const keyOk = process.env.GEMINI_API_KEY
            ? 'SÍ'
            : 'NO ⚠️';

        console.log(`🔑 Gemini API Key cargada: ${keyOk}`);
        console.log('-------------------------------------------');
    });
}

// Exportación para Vercel
module.exports = app;