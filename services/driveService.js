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

    await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
            role: 'reader',
            type: 'anyone'
        }
    });

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

    await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
            role: 'reader',
            type: 'anyone'
        }
    });

    return response.data;
}

module.exports = {
    crearCarpetaDrive,
    subirArchivoDrive
};
