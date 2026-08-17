require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { pool } = require('./config/database');
const { uploadDir, upload } = require('./config/upload');
const { initializeDatabase } = require('./database/init');
const { drive } = require('./config/googleDrive');

const contratosRouter = require('./routes/contratos');
const pagosRouter = require('./routes/pagos');
const documentosRouter = require('./routes/documentos');
const dashboardRouter = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

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
