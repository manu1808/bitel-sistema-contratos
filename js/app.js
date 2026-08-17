// ======================================================
// INICIO DE LA APLICACIÓN
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

async function cargarComponente(id, url) {
    const contenedor = document.getElementById(id);

    if (!contenedor) {
        throw new Error(`No existe el contenedor #${id}`);
    }

    const response = await fetch(url);

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

async function iniciarAplicacion() {
    try {
        // Cargar todos los HTML primero.
        await Promise.all(
            componentes.map(([id, url]) => cargarComponente(id, url))
        );

        // Después cargar los módulos JS, en orden.
        for (const url of scripts) {
            await cargarScript(url);
        }

        // Finalmente cargar los datos.
        await cargarDashboard();
        await cargarContratos();

    } catch (error) {
        console.error('Error iniciando la aplicación BITEL:', error);
    }
}

iniciarAplicacion();
