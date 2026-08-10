const { google } = require('googleapis');
const readline = require('readline');

// REEMPLAZA ESTOS DATOS CON LOS QUE OBTUVISTE EN EL PASO 1
const CLIENT_ID = 'TU_CLIENT_ID';
const CLIENT_SECRET = 'TU_CLIENT_ID';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
});

console.log('1. Abre este enlace en tu navegador:\n', authUrl);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('\n2. Autoriza la app, copia el código que te da Google y pégalo aquí: ', async (code) => {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n--- TUS CREDENCIALES GENERADAS ---');
    console.log('REFRESH_TOKEN:', tokens.refresh_token);
    rl.close();
});