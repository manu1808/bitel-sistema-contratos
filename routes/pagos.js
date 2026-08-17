const express = require('express');

module.exports = function createPagosRouter({ pool }) {
    const router = express.Router();

    // =====================================================
    // OBTENER PAGOS DE UN CONTRATO
    // =====================================================

    router.get('/contratos/:id/pagos', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT *
                FROM pagos
                WHERE contrato_id = $1
                ORDER BY fecha_programada DESC
            `, [req.params.id]);

            res.json(result.rows);

        } catch (error) {
            res.status(500).json({
                error: error.message
            });
        }
    });

    // =====================================================
    // CREAR PAGO
    // =====================================================

    router.post('/contratos/:id/pagos', async (req, res) => {
        const {
            fecha_programada,
            fecha_pago,
            monto,
            estado,
            observacion
        } = req.body;

        try {
            const result = await pool.query(`
                INSERT INTO pagos
                (
                    contrato_id,
                    fecha_programada,
                    fecha_pago,
                    monto,
                    estado,
                    observacion
                )
                VALUES ($1,$2,$3,$4,$5,$6)
                RETURNING *
            `, [
                req.params.id,
                fecha_programada,
                fecha_pago || null,
                monto,
                estado || 'PENDIENTE',
                observacion || null
            ]);

            res.json(result.rows[0]);

        } catch (error) {
            res.status(500).json({
                error: error.message
            });
        }
    });

    // =====================================================
    // EDITAR PAGO
    // =====================================================

    router.put('/pagos/:id', async (req, res) => {
        const {
            fecha_programada,
            fecha_pago,
            monto,
            estado,
            observacion
        } = req.body;

        try {
            const result = await pool.query(`
                UPDATE pagos
                SET
                    fecha_programada = $1,
                    fecha_pago = $2,
                    monto = $3,
                    estado = $4,
                    observacion = $5,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $6
                RETURNING *
            `, [
                fecha_programada,
                fecha_pago || null,
                monto,
                estado,
                observacion || null,
                req.params.id
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Pago no encontrado'
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
