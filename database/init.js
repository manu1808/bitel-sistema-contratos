const { pool } = require('../config/database');

async function initializeDatabase() {
    try {
        // =====================================================
        // TABLA CONTRATOS
        // =====================================================

        await pool.query(`
            CREATE TABLE IF NOT EXISTS contratos (
                id SERIAL PRIMARY KEY,
                codigo VARCHAR(50) NOT NULL,
                propietario VARCHAR(255) NOT NULL,
                ubicacion VARCHAR(255),
                fecha_inicio DATE,
                fecha_vencimiento DATE,
                renta NUMERIC(12,2),
                periodicidad VARCHAR(50),
                drive_folder_id TEXT,
                drive_folder_link TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // =====================================================
        // TABLA PAGOS
        // =====================================================

        await pool.query(`
            CREATE TABLE IF NOT EXISTS pagos (
                id SERIAL PRIMARY KEY,
                contrato_id INTEGER NOT NULL
                    REFERENCES contratos(id)
                    ON DELETE CASCADE,

                fecha_programada DATE NOT NULL,
                fecha_pago DATE,
                monto NUMERIC(12,2),
                estado VARCHAR(30) DEFAULT 'PENDIENTE',
                observacion TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // =====================================================
        // TABLA DOCUMENTOS
        // =====================================================

        await pool.query(`
            CREATE TABLE IF NOT EXISTS documentos (
                id SERIAL PRIMARY KEY,
                contrato_id INTEGER NOT NULL
                    REFERENCES contratos(id)
                    ON DELETE CASCADE,

                tipo VARCHAR(100) NOT NULL,
                nombre VARCHAR(255) NOT NULL,
                drive_file_id TEXT,
                drive_link TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // =====================================================
        // ÍNDICES
        // =====================================================

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_pagos_contrato
            ON pagos(contrato_id)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_documentos_contrato
            ON documentos(contrato_id)
        `);

        console.log('Base de datos PostgreSQL conectada y lista.');

    } catch (error) {
        console.error(
            'Error inicializando la base de datos:',
            error.message
        );

        throw error;
    }
}

module.exports = {
    initializeDatabase
};
