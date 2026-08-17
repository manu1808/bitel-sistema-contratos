const fs = require('fs');

function eliminarArchivoTemporal(filePath) {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

module.exports = {
    eliminarArchivoTemporal
};
