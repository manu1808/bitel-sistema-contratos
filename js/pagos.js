// ======================================================
// PAGOS
// ======================================================

async function abrirPagos(id) {

    $('#pago_contrato_id').val(id);

    $('#tablaPagos').html(
        '<tr><td colspan="6">Cargando...</td></tr>'
    );


    const response =
        await fetch(
            `${API_URL}/${id}`
        );


    const data =
        await response.json();


    const c =
        data.contrato;


    $('#infoContratoPago').html(`

        <div class="alert alert-light border">

            <strong>
                ${escapeHtml(c.codigo)}
            </strong>

            -
            ${escapeHtml(c.propietario)}

            <br>

            Renta:
            <strong>
                S/. ${Number(c.renta || 0).toFixed(2)}
            </strong>

            -
            ${escapeHtml(c.periodicidad)}

        </div>

    `);


    let html = '';


    data.pagos.forEach(p => {

        const clase =
            p.estado === 'PAGADO'
                ? 'text-success'
                : 'text-danger';


        html += `

            <tr>

                <td>
                    ${formatearFecha(p.fecha_programada)}
                </td>

                <td>
                    ${formatearFecha(p.fecha_pago)}
                </td>

                <td>
                    S/. ${Number(p.monto || 0).toFixed(2)}
                </td>

                <td class="${clase}">
                    <strong>
                        ${p.estado}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(p.observacion || '')}
                </td>

                <td></td>

            </tr>

        `;

    });


    if (!data.pagos.length) {

        html = `
            <tr>
                <td colspan="6" class="text-center">
                    No hay registros de seguimiento.
                </td>
            </tr>
        `;

    }


    $('#tablaPagos').html(html);


    modalPagos.show();

}


// ======================================================
// REGISTRAR PAGO
// ======================================================

$('#formPago').on('submit', async function(e) {

    e.preventDefault();


    const id =
        $('#pago_contrato_id').val();


    const datos = {

        fecha_programada:
            $('#fecha_programada').val(),

        fecha_pago:
            $('#fecha_pago').val() || null,

        monto:
            $('#monto_pago').val(),

        estado:
            $('#estado_pago').val(),

        observacion:
            $('#observacion_pago').val()

    };


    const response =
        await fetch(
            `${API_URL}/${id}/pagos`,
            {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify(datos)

            }
        );


    if (response.ok) {

        this.reset();

        await abrirPagos(id);

        await cargarContratos();

        alert(
            'Seguimiento registrado.'
        );

    }

    else {

        alert(
            'No se pudo registrar el seguimiento.'
        );

    }

});
