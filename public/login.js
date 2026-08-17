const form = document.getElementById('loginForm');
const username = document.getElementById('username');
const password = document.getElementById('password');
const button = document.getElementById('btnLogin');
const errorBox = document.getElementById('loginError');

function mostrarError(mensaje) {
    errorBox.textContent = mensaje;
    errorBox.classList.remove('d-none');
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    errorBox.classList.add('d-none');
    button.disabled = true;
    button.textContent = 'Verificando...';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                username: username.value,
                password: password.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            mostrarError(data.error || 'No se pudo iniciar sesión');
            return;
        }

        window.location.href = '/';

    } catch (error) {
        console.error(error);
        mostrarError('No se pudo conectar con el servidor.');
    } finally {
        button.disabled = false;
        button.textContent = 'Iniciar sesión';
    }
});
