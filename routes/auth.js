const express = require('express');
const router = express.Router();

// Usuarios de prueba con ROLES incluidos
// TIP: Mauricio será nuestro Admin para las pruebas
const usuarios = [
    { id: 1, nombre: 'Mauricio Díaz', email: 'mauricio@test.com', password: '1234', role: 'admin' },
    { id: 2, nombre: 'Laura Gómez',   email: 'laura@test.com',    password: '1234', role: 'user' },
    { id: 3, nombre: 'Andrés Vargas', email: 'andres@test.com',   password: '1234', role: 'user' },
];

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            mensaje: 'Email y contraseña son requeridos'
        });
    }

    const usuario = usuarios.find(
        u => u.email === email && u.password === password
    );

    if (!usuario) {
        return res.status(401).json({
            success: false,
            mensaje: 'Credenciales incorrectas'
        });
    }

    // Respuesta completa para la App
    res.json({
        success: true,
        userId: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        role: usuario.role, // <-- CLAVE: Esto le dirá a Android a qué pantalla ir
        mensaje: `Bienvenido, ${usuario.nombre}!`
    });
});

// Endpoint nuevo para el Dashboard del Administrador
// En un entorno real, esto requeriría un Middleware de verificación de Token
router.get('/users', (req, res) => {
    // Retornamos todos los usuarios (excepto passwords por seguridad)
    const listaPublica = usuarios.map(({ password, ...user }) => user);
    res.json(listaPublica);
});

module.exports = router;