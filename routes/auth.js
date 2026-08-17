const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

module.exports = function createAuthRouter({ pool }) {
    const router = express.Router();

    const loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {
            error: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.'
        }
    });

    router.post('/login', loginLimiter, async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Usuario y contraseña son obligatorios'
            });
        }

        try {
            const result = await pool.query(`
                SELECT id, username, password_hash, nombre, rol, activo
                FROM usuarios
                WHERE username = $1
                LIMIT 1
            `, [username.trim()]);

            if (result.rows.length === 0) {
                return res.status(401).json({
                    error: 'Usuario o contraseña incorrectos'
                });
            }

            const usuario = result.rows[0];

            if (!usuario.activo) {
                return res.status(403).json({
                    error: 'Este usuario está desactivado'
                });
            }

            const passwordValida = await bcrypt.compare(
                password,
                usuario.password_hash
            );

            if (!passwordValida) {
                return res.status(401).json({
                    error: 'Usuario o contraseña incorrectos'
                });
            }

            req.session.regenerate(async (sessionError) => {
                if (sessionError) {
                    console.error('Error regenerando sesión:', sessionError);
                    return res.status(500).json({
                        error: 'No se pudo iniciar la sesión'
                    });
                }

                req.session.user = {
                    id: usuario.id,
                    username: usuario.username,
                    nombre: usuario.nombre,
                    rol: usuario.rol
                };

                try {
                    await pool.query(`
                        UPDATE usuarios
                        SET ultimo_login = CURRENT_TIMESTAMP
                        WHERE id = $1
                    `, [usuario.id]);
                } catch (error) {
                    console.error('No se pudo actualizar ultimo_login:', error.message);
                }

                req.session.save((saveError) => {
                    if (saveError) {
                        console.error('Error guardando sesión:', saveError);
                        return res.status(500).json({
                            error: 'No se pudo guardar la sesión'
                        });
                    }

                    res.json({
                        mensaje: 'Inicio de sesión correcto',
                        usuario: req.session.user
                    });
                });
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    });

    router.get('/me', (req, res) => {
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                autenticado: false
            });
        }

        res.json({
            autenticado: true,
            usuario: req.session.user
        });
    });

    router.post('/logout', (req, res) => {
        if (!req.session) {
            return res.json({ mensaje: 'Sesión cerrada' });
        }

        req.session.destroy((error) => {
            if (error) {
                console.error('Error cerrando sesión:', error);
                return res.status(500).json({
                    error: 'No se pudo cerrar la sesión'
                });
            }

            res.clearCookie('bitel.sid');
            res.json({ mensaje: 'Sesión cerrada correctamente' });
        });
    });

    router.put('/password', async (req, res) => {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const { passwordActual, passwordNueva } = req.body;

        if (!passwordActual || !passwordNueva) {
            return res.status(400).json({
                error: 'Debes indicar la contraseña actual y la nueva contraseña'
            });
        }

        if (passwordNueva.length < 10) {
            return res.status(400).json({
                error: 'La nueva contraseña debe tener al menos 10 caracteres'
            });
        }

        try {
            const result = await pool.query(`
                SELECT password_hash
                FROM usuarios
                WHERE id = $1
            `, [req.session.user.id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Usuario no encontrado'
                });
            }

            const valida = await bcrypt.compare(
                passwordActual,
                result.rows[0].password_hash
            );

            if (!valida) {
                return res.status(401).json({
                    error: 'La contraseña actual es incorrecta'
                });
            }

            const hash = await bcrypt.hash(passwordNueva, 12);

            await pool.query(`
                UPDATE usuarios
                SET password_hash = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [hash, req.session.user.id]);

            res.json({
                mensaje: 'Contraseña actualizada correctamente'
            });

        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            res.status(500).json({
                error: 'No se pudo cambiar la contraseña'
            });
        }
    });

    return router;
};
