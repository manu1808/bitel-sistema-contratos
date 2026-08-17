const express = require('express');
const fs = require('fs');
const { subirArchivoDrive } = require('../services/driveService');

module.exports = function createDocumentosRouter({ pool, upload, drive }) {
    const router = express.Router();

    // =====================================================
    // OBTENER DOCUMENTOS DE UN CONTRATO
    // =====================================================

    router.get('/contratos/:id/documentos', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT *
                FROM documentos
                WHERE contrato_id = $1
                ORDER BY created_at DESC
            `, [req.params.id]);

            res.json(result.rows);

        } catch (error) {
            res.status(500).json({
                error: error.message
            });
        }
    });

    // =====================================================
    // SUBIR DOCUMENTO
    // =====================================================

    router.post(
        '/contratos/:id/documentos',
        upload.single('documento'),
        async (req, res) => {

            if (!req.file) {
                return res.status(400).json({
                    error: 'No se recibió ningún archivo'
                });
            }

            const { tipo } = req.body;

            try {
                const contratoResult = await pool.query(`
                    SELECT *
                    FROM contratos
                    WHERE id = $1
                `, [req.params.id]);

                if (contratoResult.rows.length === 0) {
                    return res.status(404).json({
                        error: 'Contrato no encontrado'
                    });
                }

                const contrato = contratoResult.rows[0];

                if (!contrato.drive_folder_id) {
                    return res.status(400).json({
                        error: 'El contrato no tiene una carpeta de Google Drive asociada'
                    });
                }

                const archivo = await subirArchivoDrive(
                    drive,
                    req.file.path,
                    req.file.originalname,
                    contrato.drive_folder_id
                );

                const result = await pool.query(`
                    INSERT INTO documentos
                    (
                        contrato_id,
                        tipo,
                        nombre,
                        drive_file_id,
                        drive_link
                    )
                    VALUES ($1,$2,$3,$4,$5)
                    RETURNING *
                `, [
                    req.params.id,
                    tipo || 'Otros',
                    req.file.originalname,
                    archivo.id,
                    archivo.webViewLink
                ]);

                fs.unlinkSync(req.file.path);

                res.json(result.rows[0]);

            } catch (error) {
                console.error(error);

                if (
                    req.file &&
                    fs.existsSync(req.file.path)
                ) {
                    fs.unlinkSync(req.file.path);
                }

                res.status(500).json({
                    error: error.message
                });
            }
        }
    );

    return router;
};
