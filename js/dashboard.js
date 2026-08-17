// ======================================================
// DASHBOARD
// ======================================================

async function cargarDashboard() {

    try {

        const response =
            await fetch('/api/dashboard');

        const data =
            await response.json();


        $('#totalContratos')
            .text(data.total_contratos);

        $('#contratosVigentes')
            .text(data.vigentes);

        $('#contratosPorVencer')
            .text(data.por_vencer);

        $('#contratosVencidos')
            .text(data.vencidos);

    } catch (error) {

        console.error(error);

    }

}
