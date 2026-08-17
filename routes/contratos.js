const express = require('express');
const { crearCarpetaDrive, subirArchivoDrive } = require('../services/driveService');
const { eliminarArchivoTemporal } = require('../services/fileService');

module.exports = function createContratosRouter({ pool, upload, drive }) {
    const router = express.Router();

    // =====================================================
    // OBTENER TODOS LOS CONTRATOS
    // =====================================================

    router.get('/', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT
                    c.*,

                    (
                        SELECT MAX(p.fecha_pago)
                        FROM pagos p
                        WHERE p.contrato_id = c.id
                          AND p.estado = 'PAGADO'
                    ) AS ultimo_pago,

                    (
                        SELECT p.fecha_programada
                        FROM pagos p
                        WHERE p.contrato_id = c.id
                          AND p.estado = 'PENDIENTE'
                        ORDER BY p.fecha_programada ASC
                        LIMIT 1
                    ) AS proximo_pago

                FROM contratos c
                ORDER BY c.fecha_vencimiento ASC NULLS LAST
            `);

            const hoy = new Date();

            const contratos = result.rows.map(c => {
                let estado_contrato = 'VIGENTE';
                let dias_vencimiento = null;

                if (c.fecha_vencimiento) {
                    const vencimiento = new Date(c.fecha_vencimiento);

                    dias_vencimiento = Math.ceil(
                        (vencimiento - hoy) /
                        (1000 * 60 * 60 * 24)
                    );

                    if (dias_vencimiento < 0) {
                        estado_contrato = 'VENCIDO';
                    } else if (dias_vencimiento <= 90) {
                        estado_contrato = 'POR_VENCER';
                    }
                }

                return {
                    ...c,
                    estado_contrato,
                    dias_vencimiento
                };
            });

            res.json(contratos);

        } catch (error) {
            console.error(error);

            res.status(500).json({
                error: error.message
            });
        }
    });

    // =====================================================
    // OBTENER UN CONTRATO
    // =====================================================

    router.get('/:id', async (req, res) => {
        try {
            const contrato = await pool.query(
                `SELECT * FROM contratos WHERE id = $1`,
                [req.params.id]
            );

            if (contrato.rows.length === 0) {
                return res.status(404).json({
                    error: 'Contrato no encontrado'
                });
            }

            const pagos = await pool.query(`
                SELECT *
                FROM pagos
                WHERE contrato_id = $1
                ORDER BY fecha_programada DESC
            `, [req.params.id]);

            const documentos = await pool.query(`
                SELECT *
                FROM documentos
                WHERE contrato_id = $1
                ORDER BY created_at DESC
            `, [req.params.id]);

            res.json({
                contrato: contrato.rows[0],
                pagos: pagos.rows,
                documentos: documentos.rows
            });

        } catch (error) {
            res.status(500).json({
                error: error.message
            });
        }
    });

    // =====================================================
    // CREAR CONTRATO
    // =====================================================

    router.post('/', upload.single('documento_pdf'), async (req, res) => {
        const {
            codigo,
            propietario,
            ubicacion,
            fecha_inicio,
            fecha_vencimiento,
            renta,
            periodicidad
        } = req.body;

        let tempFile = null;

        try {
            const contratoResult = await pool.query(`
                INSERT INTO contratos
                (
                    codigo,
                    propietario,
                    ubicacion,
                    fecha_inicio,
                    fecha_vencimiento,
                    renta,
                    periodicidad
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7)
                RETURNING *
            `, [
                codigo,
                propietario,
                ubicacion,
                fecha_inicio,
                fecha_vencimiento,
                renta,
                periodicidad
            ]);

            const contrato = contratoResult.rows[0];

            const carpeta = await crearCarpetaDrive(
                drive,
                `${codigo} - ${propietario}`
            );

            await pool.query(`
                UPDATE contratos
                SET
                    drive_folder_id = $1,
                    drive_folder_link = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
            `, [
                carpeta.id,
                carpeta.link,
                contrato.id
            ]);

            if (fecha_inicio && renta) {
                await pool.query(`
                    INSERT INTO pagos
                    (
                        contrato_id,
                        fecha_programada,
                        monto,
                        estado
                    )
                    VALUES ($1,$2,$3,'PENDIENTE')
                `, [
                    contrato.id,
                    fecha_inicio,
                    renta
                ]);
            }

            if (req.file) {
                tempFile = req.file.path;

                const archivo = await subirArchivoDrive(
                    drive,
                    req.file.path,
                    `${codigo}_Contrato.pdf`,
                    carpeta.id
                );

                await pool.query(`
                    INSERT INTO documentos
                    (
                        contrato_id,
                        tipo,
                        nombre,
                        drive_file_id,
                        drive_link
                    )
                    VALUES ($1,$2,$3,$4,$5)
                `, [
                    contrato.id,
                    'Contrato Primigenio',
                    `${codigo}_Contrato.pdf`,
                    archivo.id,
                    archivo.webViewLink
                ]);
            }

            eliminarArchivoTemporal(tempFile);

            res.json({
                mensaje: 'Contrato creado correctamente',
                contrato_id: contrato.id,
                drive_folder_link: carpeta.link
            });

        } catch (error) {
            console.error(
                'Error creando contrato:',
                error
            );

            eliminarArchivoTemporal(tempFile);

            res.status(500).json({
                error: error.message
            });
        }
    });

    // =====================================================
    // EDITAR CONTRATO
    // =====================================================

    router.put('/:id', async (req, res) => {
        const {
            codigo,
            propietario,
            ubicacion,
            fecha_inicio,
            fecha_vencimiento,
            renta,
            periodicidad
        } = req.body;

        try {
            const result = await pool.query(`
                UPDATE contratos
                SET
                    codigo = $1,
                    propietario = $2,
                    ubicacion = $3,
                    fecha_inicio = $4,
                    fecha_vencimiento = $5,
                    renta = $6,
                    periodicidad = $7,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $8
                RETURNING *
            `, [
                codigo,
                propietario,
                ubicacion,
                fecha_inicio,
                fecha_vencimiento,
                renta,
                periodicidad,
                req.params.id
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Contrato no encontrado'
                });
            }

            res.json(result.rows[0]);

        } catch (error) {
            res.status(500).json({
                error: error.message
            });
        }
    });

    return router;
};
