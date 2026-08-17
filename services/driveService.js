const fs = require('fs');
const { CARPETA_DRIVE_ID } = require('../config/googleDrive');

async function crearCarpetaDrive(drive, nombre) {
    const response = await drive.files.create({
        resource: {
            name: nombre,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [CARPETA_DRIVE_ID]
        },
        fields: 'id, webViewLink'
    });

    // IMPORTANTE:
    // No se crea permiso "anyone". Los documentos quedan sujetos
    // a los permisos de Google Drive de la organización.

    return {
        id: response.data.id,
        link: response.data.webViewLink
    };
}

async function subirArchivoDrive(drive, filePath, fileName, folderId) {
    const response = await drive.files.create({
        resource: {
            name: fileName,
            parents: [folderId]
        },
        media: {
            mimeType: 'application/pdf',
            body: fs.createReadStream(filePath)
        },
        fields: 'id, webViewLink'
    });

    // No hacemos público el archivo.
    // El acceso dependerá de los permisos de la carpeta de Drive.

    return response.data;
}

module.exports = {
    crearCarpetaDrive,
    subirArchivoDrive
};
