// ======================================================
// DOCUMENTOS
// ======================================================

async function abrirDocumentos(id) {

    $('#documento_contrato_id').val(id);


    const response =
        await fetch(
            `${API_URL}/${id}`
        );


    const data =
        await response.json();


    let html = '';


    data.documentos.forEach(d => {

        html += `

            <div class="documento-item">

                <strong>
                    📄 ${escapeHtml(d.tipo)}
                </strong>

                <br>

                <small class="text-muted">
                    ${escapeHtml(d.nombre)}
                </small>

                <br>

                <a
                    href="${d.drive_link}"
                    target="_blank"
                    class="btn btn-sm btn-outline-danger mt-2"
                >
                    Ver documento
                </a>

            </div>

        `;

    });


    if (!data.documentos.length) {

        html = `

            <div class="alert alert-light">
                Este contrato todavía no tiene documentación registrada.
            </div>

        `;

    }


    $('#listaDocumentos').html(html);


    modalDocumentos.show();

}


// ======================================================
// SUBIR DOCUMENTO
// ======================================================

$('#formDocumento').on('submit', async function(e) {

    e.preventDefault();


    const id =
        $('#documento_contrato_id').val();


    const archivo =
        document.getElementById(
            'documento'
        ).files[0];


    if (!archivo) {

        alert(
            'Selecciona un archivo.'
        );

        return;

    }


    const formData =
        new FormData();


    formData.append(
        'documento',
        archivo
    );


    formData.append(
        'tipo',
        $('#tipo_documento').val()
    );


    const response =
        await fetch(
            `${API_URL}/${id}/documentos`,
            {

                method: 'POST',

                body: formData

            }
        );


    if (response.ok) {

        this.reset();

        await abrirDocumentos(id);

        alert(
            'Documento subido correctamente a Google Drive.'
        );

    }

    else {

        const error =
            await response.json();

        alert(
            error.error ||
            'No se pudo subir el documento.'
        );

    }

});
