require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');

const { pool } = require('./config/database');
const { uploadDir, upload } = require('./config/upload');
const { initializeDatabase } = require('./database/init');
const { drive } = require('./config/googleDrive');
const { sessionMiddleware } = require('./config/session');
const { requireAuth } = require('./middleware/auth');

const authRouter = require('./routes/auth');
const contratosRouter = require('./routes/contratos');
const pagosRouter = require('./routes/pagos');
const documentosRouter = require('./routes/documentos');
const dashboardRouter = require('./routes/dashboard');

const app = express();
app.set('trust proxy', 1);

if (!process.env.SESSION_SECRET) {
    throw new Error('Falta SESSION_SECRET en el archivo .env');
}

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

// =========================================================
// AUTENTICACIÓN PÚBLICA
// =========================================================

app.use('/api/auth', authRouter({ pool }));

app.get('/login', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/');
    }

    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login.html', (req, res) => {
    res.redirect('/login');
});

app.use('/login-assets', express.static(
    path.join(__dirname, 'public')
));

// =========================================================
// TODO LO DEMÁS REQUIERE AUTENTICACIÓN
// =========================================================

app.use(requireAuth);

app.use(express.static(__dirname, {
    index: false
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use('/api/contratos', contratosRouter({ pool, upload, drive }));
app.use('/api', pagosRouter({ pool }));
app.use('/api', documentosRouter({ pool, upload, drive }));
app.use('/api', dashboardRouter({ pool }));

const PORT = process.env.PORT || 3000;

initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor BITEL ejecutándose en el puerto ${PORT}`);
            console.log(`Archivos temporales: ${uploadDir}`);
        });
    })
    .catch((error) => {
        console.error('No se pudo iniciar el servidor:', error);
        process.exit(1);
    });
