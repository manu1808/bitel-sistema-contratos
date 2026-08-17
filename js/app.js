// ======================================================
// INICIO DE LA APLICACIÓN
// La aplicación principal solo se carga después de que
// el backend confirme que existe una sesión válida.
// ======================================================

const componentes = [
    ['navbar', '/components/navbar.html'],
    ['dashboard', '/components/dashboard.html'],
    ['nuevoContrato', '/components/nuevo-contrato.html'],
    ['tablaContratosContainer', '/components/tabla-contratos.html'],
    ['modalEditarContainer', '/components/modal-editar.html'],
    ['modalPagosContainer', '/components/modal-pagos.html'],
    ['modalDocumentosContainer', '/components/modal-documentos.html']
];

const scripts = [
    '/js/config.js',
    '/js/utils.js',
    '/js/dashboard.js',
    '/js/contratos.js',
    '/js/pagos.js',
    '/js/documentos.js',
    '/js/nuevo-contrato.js'
];

async function cargarSesion() {
    const response = await fetch('/api/auth/me', {
        credentials: 'same-origin'
    });

    if (response.status === 401) {
        window.location.href = '/login';
        return null;
    }

    if (!response.ok) {
        throw new Error('No se pudo comprobar la sesión');
    }

    const data = await response.json();
    return data.usuario;
}

async function cargarComponente(id, url) {
    const contenedor = document.getElementById(id);

    if (!contenedor) {
        throw new Error(`No existe el contenedor #${id}`);
    }

    const response = await fetch(url, {
        credentials: 'same-origin'
    });

    if (response.status === 401) {
        window.location.href = '/login';
        return;
    }

    if (!response.ok) {
        throw new Error(`No se pudo cargar ${url}: HTTP ${response.status}`);
    }

    contenedor.innerHTML = await response.text();
}

function cargarScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`No se pudo cargar ${url}`));
        document.body.appendChild(script);
    });
}

async function cerrarSesion() {
    const boton = document.getElementById('btnCerrarSesion');

    if (boton) {
        boton.disabled = true;
        boton.textContent = 'Cerrando...';
    }

    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'same-origin'
        });
    } finally {
        window.location.href = '/login';
    }
}

async function iniciarAplicacion() {
    try {
        const usuario = await cargarSesion();

        if (!usuario) return;

        await Promise.all(
            componentes.map(([id, url]) => cargarComponente(id, url))
        );

        const usuarioActual = document.getElementById('usuarioActual');
        if (usuarioActual) {
            usuarioActual.textContent =
                `${usuario.nombre || usuario.username} (${usuario.rol})`;
        }

        document
            .getElementById('btnCerrarSesion')
            ?.addEventListener('click', cerrarSesion);

        for (const url of scripts) {
            await cargarScript(url);
        }

        await cargarDashboard();
        await cargarContratos();

    } catch (error) {
        console.error('Error iniciando la aplicación BITEL:', error);
    }
}

iniciarAplicacion();
