// VideonaglyadLessons/scripts/main.js

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const audioElement = document.getElementById('audio-player'); // Припускаємо, що плеєр є на сторінці
    const playPauseButton = document.getElementById('play-pause');
    const stopButton = document.getElementById('stop');
    const volumeControl = document.getElementById('volume');
    const progressBar = document.getElementById('progress-bar'); // Для прогрес-бару аудіо

    // --- Логіка теми ---
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? 'Світла тема ☀️' : 'Темна тема 🌙';
        }
        localStorage.setItem('theme', theme);
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    };

    const loadInitialTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            applyTheme(savedTheme);
        } else if (prefersDark) {
            applyTheme('dark');
        } else {
            applyTheme('light'); // За замовчуванням світла тема
        }
    };

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    loadInitialTheme(); // Завантажуємо тему при старті

    // --- Логіка аудіоплеєра (якщо є на сторінці) ---
    if (audioElement && playPauseButton && stopButton && volumeControl && progressBar) {
        playPauseButton.addEventListener('click', () => {
            if (audioElement.paused || audioElement.ended) {
                audioElement.play();
                playPauseButton.textContent = 'Пауза ⏸️';
            } else {
                audioElement.pause();
                playPauseButton.textContent = 'Грати ▶️';
            }
        });

        stopButton.addEventListener('click', () => {
            audioElement.pause();
            audioElement.currentTime = 0;
            playPauseButton.textContent = 'Грати ▶️';
            progressBar.value = 0;
        });

        volumeControl.addEventListener('input', () => {
            audioElement.volume = volumeControl.value;
        });

        audioElement.addEventListener('timeupdate', () => {
            if (audioElement.duration) {
                progressBar.value = (audioElement.currentTime / audioElement.duration) * 100;
            }
        });

        progressBar.addEventListener('input', () => {
            if (audioElement.duration) {
                audioElement.currentTime = (progressBar.value / 100) * audioElement.duration;
            }
        });

        audioElement.addEventListener('ended', () => {
            playPauseButton.textContent = 'Грати ▶️';
            progressBar.value = 0; // Скидання прогрес-бару
        });

        // Ініціалізація стану кнопки та гучності
        playPauseButton.textContent = 'Грати ▶️';
        volumeControl.value = audioElement.volume;
        progressBar.value = 0;

    } else {
        // console.log('Елементи аудіоплеєра не знайдені на цій сторінці.');
    }


    // --- Плавний скрол для якірних посилань (якщо є) ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const hrefAttribute = this.getAttribute('href');
            // Перевіряємо, чи це не просто "#" (часто використовується для заглушок)
            if (hrefAttribute.length > 1) {
                const targetElement = document.querySelector(hrefAttribute);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // --- Навігація: підсвічування активного розділу ---
    // Це базовий приклад, можливо, знадобиться адаптація під твою структуру
    const navLinks = document.querySelectorAll('header nav ul li a');
    const currentPath = window.location.pathname.split('/').pop(); // Отримуємо ім'я файлу

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop();
        if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

});
