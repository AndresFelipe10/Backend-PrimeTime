process.env.VERCEL = '1';

const request = require('supertest');
const app = require('../index');

describe('GET /api/ping', () => {
    test('debe devolver que el backend está activo', async () => {
        const response = await request(app)
            .get('/api/ping');

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual(
            expect.objectContaining({
                status: 'ok',
                mensaje: 'PrimeTime Backend activo'
            })
        );
    });
});