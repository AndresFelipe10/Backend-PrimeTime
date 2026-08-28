const express = require('express');
const request = require('supertest');
const axios = require('axios');

jest.mock('axios');

const planRouter = require('../routes/plan');

const app = express();

app.use(express.json());
app.use('/api/plan', planRouter);

describe('POST /api/plan', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GEMINI_API_KEY = 'test-api-key';
    });

    test('debe devolver el plan cuando Gemini responde correctamente', async () => {
        axios.post.mockResolvedValue({
            data: {
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: JSON.stringify({
                                        dias: [
                                            {
                                                dia: 'Lunes',
                                                sesiones: [
                                                    {
                                                        hora: '16:00',
                                                        materia: 'Programación',
                                                        actividad: 'Estudiar',
                                                        duracionMin: 60,
                                                        esEstudioIndependiente: true
                                                    }
                                                ]
                                            }
                                        ]
                                    })
                                }
                            ]
                        }
                    }
                ]
            }
        });

        const response = await request(app)
            .post('/api/plan')
            .send({
                materias: ['Programación'],
                tareas: ['Proyecto final'],
                userId: 1
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.dias).toBeDefined();
        expect(response.body.dias[0].dia).toBe('Lunes');

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
                                    text: 'Respuesta inválida'
                                }
                            ]
                        }
                    }
                ]
            }
        });

        const response = await request(app)
            .post('/api/plan')
            .send({
                materias: [],
                tareas: [],
                userId: 1
            });

        expect(response.statusCode).toBe(500);
        expect(response.body.success).toBe(false);
    });

    test('debe devolver 500 cuando Gemini no devuelve candidatos', async () => {
        axios.post.mockResolvedValue({
            data: {
                candidates: []
            }
        });

        const response = await request(app)
            .post('/api/plan')
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
            .post('/api/plan')
            .send({
                materias: [],
                tareas: [],
                userId: 1
            });

        expect(response.statusCode).toBe(503);
        expect(response.body.success).toBe(false);
    });
});