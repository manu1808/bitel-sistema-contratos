const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Servir el frontend directamente

// =========================================================
// 1. CREDENCIALES DE GOOGLE DRIVE (OAUTH2)
// =========================================================
require('dotenv').config();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const CARPETA_DRIVE_ID = process.env.CARPETA_DRIVE_ID;
const PORT = process.env.PORT || 3000;

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

// =========================================================
// 2. BASE DE DATOS Y MANEJO DE ARCHIVOS TEMPORALES
// =========================================================
const upload = multer({ dest: 'temp_uploads/' });

const db = new sqlite3.Database('./contratos.db', (err) => {
    if (err) console.error('Error en BD:', err.message);
    else console.log(' Base de datos SQLite lista.');
});

db.run(`CREATE TABLE IF NOT EXISTS contratos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT, propietario TEXT, ubicacion TEXT,
    fecha_inicio TEXT, fecha_vencimiento TEXT,
    renta REAL, periodicidad TEXT, pdf_link TEXT
)`);

// =========================================================
// 3. RUTAS / ENDPOINTS
// =========================================================

// Obtener la lista de contratos guardados
app.get('/api/contratos', (req, res) => {
    db.all("SELECT * FROM contratos ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Guardar contrato y subir el PDF a Google Drive
app.post('/api/contratos', upload.single('documento_pdf'), async (req, res) => {
    const { codigo, propietario, ubicacion, fecha_inicio, fecha_vencimiento, renta, periodicidad } = req.body;
    let pdf_link = null;

    try {
        if (req.file) {
            // Subir archivo a Google Drive con tu cuenta
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

            // Cambiar permisos del archivo a público mediante enlace
            await drive.permissions.create({
                fileId: driveResponse.data.id,
                requestBody: { role: 'reader', type: 'anyone' }
            });

            // Eliminar el archivo borrador local de la PC
            fs.unlinkSync(req.file.path);
        }

        // Guardar la información estructurada en la Base de Datos SQLite
        const sql = `INSERT INTO contratos (codigo, propietario, ubicacion, fecha_inicio, fecha_vencimiento, renta, periodicidad, pdf_link) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        db.run(sql, [codigo, propietario, ubicacion, fecha_inicio, fecha_vencimiento, renta, periodicidad, pdf_link], function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, mensaje: "Guardado en BD y subido a Google Drive exitosamente", link: pdf_link });
        });

    } catch (error) {
        console.error('Error subiendo a Drive:', error);
        res.status(500).json({ error: "Error al comunicarse con Google Drive" });
    }
});

app.listen(3000, () => {
    console.log('====================================================');
    console.log(' Sistema BITEL en vivo en: http://localhost:3000');
    console.log('====================================================');
});