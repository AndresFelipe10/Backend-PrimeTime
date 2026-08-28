const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.NODE_ENV = 'production';

const dbPath = path.join(os.tmpdir(), 'usuarios.json');

const authRouter = require('../routes/auth');

const app = express();

app.use(express.json());
app.use('/auth', authRouter);

beforeEach(() => {
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }
});

afterAll(() => {
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }
});

describe('POST /auth/login', () => {
    test('debe permitir iniciar sesión con credenciales correctas', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'mauricio@test.com',
                password: '1234'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.email).toBe('mauricio@test.com');
        expect(response.body.role).toBe('admin');
    });

    test('debe rechazar credenciales incorrectas', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'mauricio@test.com',
                password: 'incorrecta'
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.success).toBe(false);
    });

    test('debe rechazar login sin email o contraseña', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'mauricio@test.com'
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
    });
});

describe('POST /auth/register', () => {
    test('debe registrar un nuevo usuario', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Usuario Test',
                email: 'test@example.com',
                password: 'password123'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('no debe permitir registrar un correo existente', async () => {
        await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Usuario Test',
                email: 'mauricio@test.com',
                password: 'password123'
            });

        const response = await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Otro Usuario',
                email: 'mauricio@test.com',
                password: 'otra123'
            });

        expect(response.statusCode).toBe(409);
        expect(response.body.success).toBe(false);
    });
});

describe('GET /auth/users', () => {
    test('no debe devolver las contraseñas de los usuarios', async () => {
        const response = await request(app)
            .get('/auth/users');

        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);

        response.body.forEach(usuario => {
            expect(usuario).not.toHaveProperty('password');
        });
    });
});