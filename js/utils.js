// ======================================================
// FUNCIONES AUXILIARES
// ======================================================

function formatearFecha(fecha) {

    if (!fecha) {
        return '-';
    }


    const partes =
        String(fecha)
            .substring(0, 10)
            .split('-');


    if (partes.length !== 3) {
        return fecha;
    }


    return `${partes[2]}/${partes[1]}/${partes[0]}`;

}


function formatearInputFecha(fecha) {

    if (!fecha) {
        return '';
    }


    return String(fecha)
        .substring(0, 10);

}


function escapeHtml(text) {

    if (text === null || text === undefined) {
        return '';
    }


    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}
