document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const toggle = document.getElementById('theme-toggle');
    
    if (toggle) {
        toggle.textContent = '☀️ Light Mode';
        toggle.addEventListener('click', () => {
            document.documentElement.setAttribute('data-theme', 
                document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
            );
        });
    }
});