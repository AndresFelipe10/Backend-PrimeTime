const express = require('express');
const request = require('supertest');
const axios = require('axios');

jest.mock('axios');

const analizarRouter = require('../routes/analizar');

const app = express();

app.use(express.json());
app.use('/api/analizar', analizarRouter);

describe('POST /api/analizar', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GEMINI_API_KEY = 'test-api-key';
    });

    test('debe devolver el análisis cuando Gemini responde correctamente', async () => {
        axios.post.mockResolvedValue({
            data: {
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: JSON.stringify({
                                        nivelCarga: 'Media',
                                        porcentajeCarga: 60,
                                        advertencias: ['Tienes varias tareas pendientes'],
                                        recomendaciones: ['Organiza tus tareas por prioridad'],
                                        consejoDia: 'Estudia primero la materia más difícil'
                                    })
                                }
                            ]
                        }
                    }
                ]
            }
        });

        const response = await request(app)
            .post('/api/analizar')
            .send({
                materias: ['Programación'],
                tareas: ['Proyecto final'],
                userId: 1
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.nivelCarga).toBe('Media');
        expect(response.body.porcentajeCarga).toBe(60);

        expect(axios.post).toHaveBeenCalledTimes(1);
    });

    test('debe devolver 500 cuando Gemini devuelve JSON inválido', async () => {
        axios.post.mockResolvedValue({
            data: {
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: 'Esto no es JSON válido'
                                }
                            ]
                        }
                    }
                ]
            }
        });

        const response = await request(app)
            .post('/api/analizar')
            .send({
                materias: ['Programación'],
                tareas: [],
                userId: 1
            });

        expect(response.statusCode).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            'Formato de análisis no válido desde la IA.'
        );
    });

    test('debe devolver 500 cuando Gemini no devuelve candidatos', async () => {
        axios.post.mockResolvedValue({
            data: {
                candidates: []
            }
        });

        const response = await request(app)
            .post('/api/analizar')
            .send({
                materias: [],
                tareas: [],
                userId: 1
            });

        expect(response.statusCode).toBe(500);
        expect(response.body.success).toBe(false);
    });

    test('debe devolver 503 cuando Gemini está saturado', async () => {
        axios.post.mockRejectedValue({
            response: {
                status: 503
            }
        });

        const response = await request(app)
            .post('/api/analizar')
            .send({
                materias: ['Programación'],
                tareas: [],
                userId: 1
            });

        expect(response.statusCode).toBe(503);
        expect(response.body.success).toBe(false);
    });
});