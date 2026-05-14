require('dotenv').config();
const express = require('express');
const cors = require('cors');

const planRouter = require('./routes/plan');
const analizarRouter = require('./routes/analizar');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Middleware de Log: Crucial para ver qué envía el celular en tiempo real
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST') {
        console.log('Cuerpo de la petición:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Definición de Rutas
app.use('/api/plan', planRouter);
app.use('/api/analizar', analizarRouter);
app.use('/api/auth', authRouter);

// Endpoint de salud
app.get('/api/ping', (req, res) => {
    res.json({ 
        status: 'ok', 
        mensaje: 'PrimeTime Backend activo',
        env: process.env.NODE_ENV || 'development'
    });
});

// Manejo de errores global (Captura fallos en la lógica de IA o Auth)
app.use((err, req, res, next) => {
    console.error('❌ [ERROR GLOBAL]:', err.stack);
    res.status(500).json({ 
        error: 'Error interno del servidor', 
        message: err.message 
    });
});

// Lógica de ejecución: Vercel no usa .listen(), usa el export del módulo
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Servidor local activo en: http://localhost:${PORT}`);
        const keyOk = process.env.GEMINI_API_KEY ? 'SÍ' : 'NO ⚠️';
        console.log(`   Gemini API Key cargada: ${keyOk}`);
        console.log(`-------------------------------------------`);
    });
}

// EXPORTACIÓN PARA VERCEL
module.exports = app;