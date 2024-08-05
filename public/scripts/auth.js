document.addEventListener('DOMContentLoaded', async () => {
        try {
            const response = await fetch('/login/session');
            if (response.status !== 200) {
                // Redirect to login if not authenticated
                window.location.href = '/index.html';
            }
        } catch (err) {
            console.error('Error checking session:', err);
            window.location.href = '/index.html';
        }
});