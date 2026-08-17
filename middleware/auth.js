function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }

    const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');

    // Navegación normal al sistema: redirigir al login.
    if (req.path === '/' && acceptsHtml) {
        return res.redirect('/login');
    }

    // API y recursos internos: devolver 401, no una página HTML.
    return res.status(401).json({
        error: 'No autenticado'
    });
}

module.exports = { requireAuth };
