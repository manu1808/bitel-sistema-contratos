require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// =========================================================
// 1. CONEXIÓN A BASE DE DATOS POSTGRESQL (PERMANENTE)
// =========================================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Crear tabla automática si no existe
pool.query(`
    CREATE TABLE IF NOT EXISTS contratos (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50),
        propietario VARCHAR(255),
        ubicacion VARCHAR(255),
        fecha_inicio VARCHAR(50),
        fecha_vencimiento VARCHAR(50),
        renta NUMERIC,
        periodicidad VARCHAR(50),
        pdf_link TEXT
    )
`).then(() => console.log(' Base de datos PostgreSQL conectada y lista.'))
  .catch(err => console.error('Error al conectar con la BD:', err.message));

// =========================================================
// 2. CREDENCIALES DE GOOGLE DRIVE
// =========================================================
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const CARPETA_DRIVE_ID = process.env.CARPETA_DRIVE_ID;

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

const upload = multer({ dest: 'temp_uploads/' });

// =========================================================
// 3. RUTAS DE LA API
// =========================================================

// Obtener la lista de contratos
app.get('/api/contratos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contratos ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Guardar nuevo contrato
app.post('/api/contratos', upload.single('documento_pdf'), async (req, res) => {
    const { codigo, propietario, ubicacion, fecha_inicio, fecha_vencimiento, renta, periodicidad } = req.body;
    let pdf_link = null;

    try {
        if (req.file) {
            const fileMetadata = {
                name: `${codigo}_Adenda.pdf`,
                parents: [CARPETA_DRIVE_ID]
            };
            const media = {
                mimeType: 'application/pdf',
                body: fs.createReadStream(req.file.path)
            };

            const driveResponse = await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, webViewLink'
            });

            pdf_link = driveResponse.data.webViewLink;

            await drive.permissions.create({
                fileId: driveResponse.data.id,
                requestBody: { role: 'reader', type: 'anyone' }
            });

            fs.unlinkSync(req.file.path);
        }

        const sql = `INSERT INTO contratos (codigo, propietario, ubicacion, fecha_inicio, fecha_vencimiento, renta, periodicidad, pdf_link) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`;
        
        const values = [codigo, propietario, ubicacion, fecha_inicio, fecha_vencimiento, renta, periodicidad, pdf_link];
        const result = await pool.query(sql, values);

        res.json({ id: result.rows[0].id, mensaje: "Guardado permanentemente", link: pdf_link });

    } catch (error) {
        console.error('Error guardando contrato:', error);
        res.status(500).json({ error: "Error al procesar la solicitud" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor BITEL ejecutándose en el puerto ${PORT}`);
});