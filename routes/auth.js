const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const router = express.Router();

// Lógica para que funcione tanto en tu PC local como en Vercel (Serverless)
const dbPath = process.env.NODE_ENV === 'production' 
    ? path.join(os.tmpdir(), 'usuarios.json') 
    : path.join(__dirname, '..', 'usuarios.json');

// Función para leer la "Base de Datos"
function getUsuarios() {
    if (fs.existsSync(dbPath)) {
        return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
    // Usuarios por defecto si el archivo no existe
    const defaultUsers = [
        { id: 1, nombre: 'Mauricio Díaz', email: 'mauricio@test.com', password: '1234', role: 'admin' },
        { id: 2, nombre: 'Laura Gómez', email: 'laura@test.com', password: '1234', role: 'user' },
        { id: 3, nombre: 'Andrés Vargas', email: 'andres@test.com', password: '1234', role: 'user' }
    ];
    fs.writeFileSync(dbPath, JSON.stringify(defaultUsers, null, 2), 'utf8');
    return defaultUsers;
}

// Función para guardar cambios en la "Base de Datos"
function saveUsuarios(usuarios) {
    fs.writeFileSync(dbPath, JSON.stringify(usuarios, null, 2), 'utf8');
}

// ENDPOINT: LOGIN
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, mensaje: 'Email y contraseña son requeridos' });
    }

    const usuarios = getUsuarios();
    const usuario = usuarios.find(u => u.email === email && u.password === password);

    if (!usuario) {
        return res.status(401).json({ success: false, mensaje: 'Credenciales incorrectas' });
    }

    res.json({
        success: true,
        userId: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        role: usuario.role,
        mensaje: `Bienvenido, ${usuario.nombre}!`
    });
});

// ENDPOINT: REGISTRO
router.post('/register', (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ success: false, mensaje: 'Todos los campos son obligatorios' });
    }

    const usuarios = getUsuarios();
    
    // Verificar si el correo ya existe
    if (usuarios.some(u => u.email === email)) {
        return res.status(409).json({ success: false, mensaje: 'El correo ya está registrado' });
    }

    // Crear nuevo usuario (ID autoincremental)
    const nuevoId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1;
    const nuevoUsuario = {
        id: nuevoId,
        nombre,
        email,
        password,
        role: 'user' // Rol por defecto siempre será 'user' por seguridad
    };

    usuarios.push(nuevoUsuario);
    saveUsuarios(usuarios);

    res.json({ success: true, mensaje: 'Usuario registrado exitosamente' });
});

// ENDPOINT: GET USERS (Admin)
router.get('/users', (req, res) => {
    const usuarios = getUsuarios();
    const listaPublica = usuarios.map(({ password: _password, ...user }) => user);
    res.json(listaPublica);
});

// ENDPOINT: ACTUALIZAR USUARIO (Admin)
router.put('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const { nombre, email, role } = req.body;
    let usuarios = getUsuarios();
    
    const index = usuarios.findIndex(u => u.id === userId);
    if (index !== -1) {
        usuarios[index] = { ...usuarios[index], nombre, email, role };
        saveUsuarios(usuarios);
        res.json({ success: true, mensaje: 'Usuario actualizado' });
    } else {
        res.status(404).json({ success: false, mensaje: 'Usuario no encontrado' });
    }
});

// ENDPOINT: ELIMINAR USUARIO (Admin)
router.delete('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    let usuarios = getUsuarios();
    
    const index = usuarios.findIndex(u => u.id === userId);
    if (index !== -1) {
        usuarios.splice(index, 1);
        saveUsuarios(usuarios);
        res.json({ success: true, mensaje: 'Usuario eliminado' });
    } else {
        res.status(404).json({ success: false, mensaje: 'Usuario no encontrado' });
    }
});

module.exports = router;