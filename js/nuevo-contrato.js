// ======================================================
// NUEVO CONTRATO
// ======================================================

$('#formContrato').on('submit', async function(e) {

    e.preventDefault();

    const formulario = this;

    // Obtener automáticamente el botón que envió el formulario
    const boton = formulario.querySelector(
        'button[type="submit"]'
    );


    // ==================================================
    // CREAR INDICADOR DE CARGA
    // ==================================================

    let estadoCarga =
        document.getElementById('estadoCargaContrato');


    // Si todavía no existe, lo creamos automáticamente
    if (!estadoCarga) {

        estadoCarga = document.createElement('div');

        estadoCarga.id =
            'estadoCargaContrato';

        estadoCarga.className =
            'mt-3';

        estadoCarga.innerHTML = `

            <div class="d-flex justify-content-between align-items-center mb-1">

                <span
                    id="textoCargaContrato"
                    class="fw-semibold">
                    Procesando...
                </span>

                <span
                    id="porcentajeCargaContrato">
                    0%
                </span>

            </div>

            <div
                class="progress"
                style="height: 22px;">

                <div
                    id="barraCargaContrato"
                    class="progress-bar progress-bar-striped progress-bar-animated"
                    role="progressbar"
                    style="width: 0%;">

                </div>

            </div>
        `;


        // Insertarlo después del formulario
        formulario.parentNode.insertBefore(
            estadoCarga,
            formulario.nextSibling
        );

    }


    const barra =
        document.getElementById(
            'barraCargaContrato'
        );

    const textoCarga =
        document.getElementById(
            'textoCargaContrato'
        );

    const porcentaje =
        document.getElementById(
            'porcentajeCargaContrato'
        );


    // ==================================================
    // FUNCIÓN PARA ACTUALIZAR LA BARRA
    // ==================================================

    function actualizarCarga(
        valor,
        texto
    ) {

        barra.style.width =
            `${valor}%`;

        barra.setAttribute(
            'aria-valuenow',
            valor
        );

        porcentaje.textContent =
            `${valor}%`;

        textoCarga.textContent =
            texto;
    }


    // ==================================================
    // BLOQUEAR FORMULARIO
    // ==================================================

    boton.disabled = true;

    boton.innerHTML =
        '⏳ Guardando...';


    formulario
        .querySelectorAll(
            'input, select, button'
        )
        .forEach(elemento => {

            elemento.disabled = true;

        });


    // Mostrar indicador
    estadoCarga.style.display =
        'block';


    try {

        // ==============================================
        // 1. PREPARANDO INFORMACIÓN
        // ==============================================

        actualizarCarga(
            10,
            'Preparando información...'
        );


        const formData =
            new FormData();


        formData.append(
            'codigo',
            $('#codigo').val()
        );


        formData.append(
            'propietario',
            $('#propietario').val()
        );


        formData.append(
            'ubicacion',
            $('#ubicacion').val()
        );


        formData.append(
            'fecha_inicio',
            $('#fecha_inicio').val()
        );


        formData.append(
            'fecha_vencimiento',
            $('#fecha_vencimiento').val()
        );


        formData.append(
            'renta',
            $('#renta').val()
        );


        formData.append(
            'periodicidad',
            $('#periodicidad').val()
        );


        // ==============================================
        // PDF
        // ==============================================

        const archivo =
            document.getElementById(
                'pdf'
            ).files[0];


        if (archivo) {

            formData.append(
                'documento_pdf',
                archivo
            );

        }


        // ==============================================
        // 2. ENVIAR AL BACKEND
        // ==============================================

        actualizarCarga(
            25,
            'Creando contrato...'
        );


        const response =
            await fetch(
                API_URL,
                {
                    method: 'POST',
                    body: formData
                }
            );


        // ==============================================
        // LEER RESPUESTA
        // ==============================================

        const resultado =
            await response.json();


        if (!response.ok) {

            throw new Error(
                resultado.error ||
                'Hubo un error al guardar el contrato.'
            );

        }


        // ==============================================
        // 3. PROCESAMIENTO TERMINADO
        // ==============================================

        actualizarCarga(
            80,
            'Finalizando y guardando información...'
        );


        // Pequeña pausa para que visualmente
        // se aprecie el cambio de estado

        await new Promise(
            resolve =>
                setTimeout(resolve, 400)
        );


        actualizarCarga(
            100,
            '✓ Contrato guardado correctamente'
        );


        // ==============================================
        // CAMBIAR BARRA A VERDE
        // ==============================================

        barra.classList.remove(
            'progress-bar-animated'
        );

        barra.classList.add(
            'bg-success'
        );


        boton.innerHTML =
            '✓ Guardado';


        // ==============================================
        // ACTUALIZAR TABLA Y DASHBOARD
        // ==============================================

        await cargarContratos();

        await cargarDashboard();


        // ==============================================
        // MOSTRAR ÉXITO
        // ==============================================

        alert(
            'Contrato guardado correctamente.'
        );


        // ==============================================
        // LIMPIAR FORMULARIO
        // ==============================================

        formulario.reset();


        // Esperar un momento antes de ocultar
        // el indicador

        setTimeout(() => {

            estadoCarga.style.display =
                'none';


            barra.style.width =
                '0%';


            barra.classList.remove(
                'bg-success'
            );

            barra.classList.add(
                'progress-bar-animated'
            );


            porcentaje.textContent =
                '0%';


            textoCarga.textContent =
                'Procesando...';


            boton.disabled = false;

            boton.innerHTML =
                'Guardar';


            formulario
                .querySelectorAll(
                    'input, select, button'
                )
                .forEach(elemento => {

                    elemento.disabled = false;

                });

        }, 1500);


    } catch (error) {

        console.error(
            'Error creando contrato:',
            error
        );


        // ==============================================
        // MOSTRAR ERROR
        // ==============================================

        actualizarCarga(
            100,
            '❌ No se pudo guardar el contrato'
        );


        barra.classList.remove(
            'progress-bar-animated',
            'bg-success'
        );

        barra.classList.add(
            'bg-danger'
        );


        boton.disabled = false;

        boton.innerHTML =
            '↻ Intentar nuevamente';


        formulario
            .querySelectorAll(
                'input, select, button'
            )
            .forEach(elemento => {

                elemento.disabled = false;

            });


        alert(
            'No se pudo guardar el contrato.\n\n' +
            error.message
        );

    }

});
