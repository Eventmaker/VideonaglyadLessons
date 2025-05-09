// Основний JavaScript файл
document.addEventListener('DOMContentLoaded', () => {
    // Ініціалізація темної теми
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    // Підсвічування поточного розділу в навігації
    highlightCurrentChapter();
});

// Функція для перемикання темної теми
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Функція для підсвічування поточного розділу
function highlightCurrentChapter() {
    const currentPath = window.location.pathname;
    const currentChapter = currentPath.split('/').pop();
    
    const navLinks = document.querySelectorAll('.toc-nav a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentChapter) {
            link.classList.add('active');
        }
    });
}

// Функція для завантаження контенту
async function loadContent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Помилка завантаження контенту');
        return await response.text();
    } catch (error) {
        console.error('Помилка:', error);
        return 'Помилка завантаження контенту';
    }
} 