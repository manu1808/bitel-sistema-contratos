// ======================================================
// CONTRATOS
// ======================================================

async function cargarContratos() {

    const response =
        await fetch(API_URL);

    const datos =
        await response.json();


    let html = '';


    datos.forEach(c => {


        let estado = '';

        let claseEstado = '';


        if (c.estado_contrato === 'VENCIDO') {

            estado = '🔴 VENCIDO';
            claseEstado = 'text-danger';

        }

        else if (c.estado_contrato === 'POR_VENCER') {

            estado =
                `🟡 ${c.dias_vencimiento} días`;

            claseEstado = 'text-warning';

        }

        else {

            estado = '🟢 VIGENTE';
            claseEstado = 'text-success';

        }


        html += `

            <tr>

                <td>
                    <strong>${escapeHtml(c.codigo)}</strong>
                </td>

                <td>
                    ${escapeHtml(c.propietario)}
                </td>

                <td>
                    S/. ${Number(c.renta || 0).toFixed(2)}
                </td>

                <td>
                    ${escapeHtml(c.periodicidad || '')}
                </td>

                <td>
                    ${formatearFecha(c.ultimo_pago)}
                </td>

                <td>
                    ${formatearFecha(c.proximo_pago)}
                </td>

                <td>
                    ${formatearFecha(c.fecha_vencimiento)}
                </td>

                <td class="estado ${claseEstado}">
                    ${estado}
                </td>

                <td>

                    <button
                        class="btn btn-sm btn-outline-primary"
                        onclick="abrirDocumentos(${c.id})"
                        title="Documentación"
                    >
                        📄
                    </button>


                    <button
                        class="btn btn-sm btn-outline-success"
                        onclick="abrirPagos(${c.id})"
                        title="Pagos"
                    >
                        💰
                    </button>


                    <button
                        class="btn btn-sm btn-outline-secondary"
                        onclick="abrirEditar(${c.id})"
                        title="Editar"
                    >
                        ✏️
                    </button>

                </td>

            </tr>

        `;

    });


    if (tabla) {

        tabla.destroy();

    }


    document.getElementById(
        'cuerpoTabla'
    ).innerHTML = html;


    tabla =
        $('#tablaContratos').DataTable({

            order: [[6, 'asc']],

            pageLength: 25,

            language: {

                search: 'Buscar:',

                lengthMenu:
                    'Mostrar _MENU_ contratos',

                info:
                    'Mostrando _START_ a _END_ de _TOTAL_ contratos',

                paginate: {

                    first: 'Primero',

                    last: 'Último',

                    next: 'Siguiente',

                    previous: 'Anterior'

                }

            }

        });

}


// ======================================================
// EDITAR
// ======================================================

async function abrirEditar(id) {

    const response =
        await fetch(`${API_URL}/${id}`);

    const data =
        await response.json();


    const c =
        data.contrato;


    $('#editar_id').val(c.id);

    $('#editar_codigo').val(c.codigo);

    $('#editar_propietario').val(c.propietario);

    $('#editar_ubicacion').val(c.ubicacion);

    $('#editar_fecha_inicio').val(
        formatearInputFecha(c.fecha_inicio)
    );

    $('#editar_fecha_vencimiento').val(
        formatearInputFecha(c.fecha_vencimiento)
    );

    $('#editar_renta').val(c.renta);

    $('#editar_periodicidad').val(
        c.periodicidad
    );


    modalEditar.show();

}


async function guardarEdicion() {

    const id =
        $('#editar_id').val();


    const datos = {

        codigo:
            $('#editar_codigo').val(),

        propietario:
            $('#editar_propietario').val(),

        ubicacion:
            $('#editar_ubicacion').val(),

        fecha_inicio:
            $('#editar_fecha_inicio').val(),

        fecha_vencimiento:
            $('#editar_fecha_vencimiento').val(),

        renta:
            $('#editar_renta').val(),

        periodicidad:
            $('#editar_periodicidad').val()

    };


    const response =
        await fetch(`${API_URL}/${id}`, {

            method: 'PUT',

            headers: {
                'Content-Type':
                    'application/json'
            },

            body:
                JSON.stringify(datos)

        });


    if (response.ok) {

        modalEditar.hide();

        await cargarContratos();

        await cargarDashboard();

        alert(
            'Contrato actualizado correctamente.'
        );

    }

    else {

        alert(
            'No se pudo actualizar el contrato.'
        );

    }

}
