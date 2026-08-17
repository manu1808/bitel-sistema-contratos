const express = require('express');

module.exports = function createDashboardRouter({ pool }) {
    const router = express.Router();

    router.get('/dashboard', async (req, res) => {
        try {
            const contratos = await pool.query(`
                SELECT fecha_vencimiento
                FROM contratos
            `);

            const hoy = new Date();

            let vigentes = 0;
            let porVencer = 0;
            let vencidos = 0;

            contratos.rows.forEach(c => {
                if (!c.fecha_vencimiento) return;

                const fecha = new Date(c.fecha_vencimiento);

                const dias = Math.ceil(
                    (fecha - hoy) /
                    (1000 * 60 * 60 * 24)
                );

                if (dias < 0) {
                    vencidos++;
                } else if (dias <= 90) {
                    porVencer++;
                } else {
                    vigentes++;
                }
            });

            const pagos = await pool.query(`
                SELECT COUNT(*)::INTEGER AS total
                FROM pagos
                WHERE estado = 'PENDIENTE'
            `);

            res.json({
                total_contratos: contratos.rows.length,
                vigentes,
                por_vencer: porVencer,
                vencidos,
                pagos_pendientes: pagos.rows[0].total
            });

        } catch (error) {
            res.status(500).json({
                error: error.message
            });
        }
    });

    return router;
};
