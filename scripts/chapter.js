// VideonaglyadLessons/scripts/chapter.js

// Переконайся, що бібліотека marked.js підключена в HTML перед цим скриптом!
// Приклад: <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    const chapterContentElement = document.getElementById('markdown-content');
    const quizContainer = document.getElementById('quiz-container');
    const submitQuizButton = document.getElementById('submit-quiz-btn'); // ID з твого HTML
    const quizResultsElement = document.getElementById('quiz-results');
    const chapterTitleElement = document.getElementById('chapter-title');

    // Визначаємо номер поточного розділу з URL
    const pathParts = window.location.pathname.split('/');
    const fileName = pathParts.pop() || pathParts.pop(); // Handle trailing slash
    const chapterNumberMatch = fileName.match(/chapter(\d+)\.html/);

    if (!chapterNumberMatch || chapterNumberMatch.length < 2) {
        const errorMessage = 'Не вдалося визначити номер розділу для завантаження контенту з URL.';
        if (chapterContentElement) chapterContentElement.innerHTML = `<p class="error">${errorMessage}</p>`;
        if (chapterTitleElement) chapterTitleElement.textContent = 'Помилка завантаження';
        console.error("Could not determine chapter number from URL:", fileName);
        return;
    }
    const chapterNumber = chapterNumberMatch[1];

    // Встановлюємо заголовок
    if (chapterTitleElement) {
        chapterTitleElement.textContent = `Розділ ${chapterNumber}: Завантаження...`;
    } else {
        console.warn("Елемент #chapter-title не знайдено.");
    }

    // Перевірка, чи завантажена бібліотека marked.js
    if (typeof marked === 'undefined') {
        const errorMsg = `
            <p style="color: var(--md-sys-color-error);">
                Помилка: бібліотека marked.js не завантажена. Будь ласка, додайте її до HTML-файлу.
            </p>
            <p>
                Приклад підключення через CDN (додайте в &lt;head&gt;):<br>
                <code>&lt;script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"&gt;&lt;/script&gt;</code>
            </p>`;
        if (chapterContentElement) chapterContentElement.innerHTML = errorMsg;
        else if (document.body) document.body.insertAdjacentHTML('afterbegin', `<div class="error" style="padding:1rem; background:var(--md-sys-color-error-container); color:var(--md-sys-color-on-error-container);">${errorMsg}</div>`);
        console.error("marked.js library is not loaded.");
    }

    loadAllContent(chapterNumber);
});

async function loadAllContent(chapterNumber) {
    const chapterTitleElement = document.getElementById('chapter-title');
    if (chapterTitleElement) {
        // TODO: Отримати фактичну назву розділу (з JSON або іншого джерела)
        // Поки що просто встановлюємо номер розділу
        try {
            const response = await fetch(`quizzes/chapter${chapterNumber}.json`); // Завантажуємо тест для назви
            if (response.ok) {
                const quizData = await response.json();
                if (quizData.title) {
                     chapterTitleElement.textContent = quizData.title; // Використовуємо назву з JSON
                } else {
                     chapterTitleElement.textContent = `Розділ ${chapterNumber}`;
                }
            } else {
                 chapterTitleElement.textContent = `Розділ ${chapterNumber}`;
            }
        } catch (e) {
             chapterTitleElement.textContent = `Розділ ${chapterNumber}`;
             console.warn("Could not fetch quiz title, using default.");
        }
    }

    try {
        await Promise.all([
            loadMarkdownContent(chapterNumber),
            initAudioPlayer(chapterNumber),
            loadQuiz(chapterNumber, document.getElementById('quiz-container'), document.getElementById('submit-quiz-btn'), document.getElementById('quiz-results'))
        ]);
    } catch (error) {
        console.error('Помилка під час Promise.all в loadAllContent:', error);
    }
}

async function loadMarkdownContent(chapterNumber) {
    const contentElement = document.getElementById('markdown-content');
    if (!contentElement) {
        console.warn("Елемент #markdown-content не знайдено на сторінці.");
        return;
    }
    if (typeof marked === 'undefined') return; // Помилка вже показана

    try {
        const markdownFilePath = `book/chapter${chapterNumber}.md`;
        const response = await fetch(markdownFilePath);
        if (!response.ok) {
            contentElement.innerHTML = `<p class="error">Помилка завантаження текстового матеріалу (chapter${chapterNumber}.md): ${response.status}. Перевірте консоль.</p>`;
            throw new Error(`HTTP error! status: ${response.status} when fetching ${markdownFilePath}`);
        }
        const markdownText = await response.text();
        contentElement.innerHTML = marked.parse(markdownText);
    } catch (error) {
        console.error('Помилка завантаження або парсингу Markdown:', error);
        if (contentElement.innerHTML.includes('Завантаження')) {
             contentElement.innerHTML = `<p class="error">Не вдалося завантажити контент розділу. Деталі в консолі.</p>`;
        }
    }
}

async function initAudioPlayer(chapterNumber) {
    const audioPlayer = document.getElementById('audio-player');
    const audioSectionContainer = document.getElementById('audio-content-section');

    if (!audioPlayer) {
        console.warn('Елемент аудіоплеєра #audio-player не знайдено.');
        if (audioSectionContainer) audioSectionContainer.style.display = 'none';
        return;
    }
    if (!audioSectionContainer) {
        console.warn('Секція аудіоплеєра #audio-content-section не знайдена.');
    }

    try {
        const audioSrc = `audio/${chapterNumber}.wav`; // Або .mp3
        const response = await fetch(audioSrc, { method: 'HEAD' });

        if (!response.ok) {
            if (response.status === 404) {
                console.log(`Аудіо файл ${audioSrc} не знайдено.`);
                if (audioSectionContainer) audioSectionContainer.style.display = 'none';
            } else {
                throw new Error(`Помилка перевірки аудіо файлу (${audioSrc}): ${response.status}`);
            }
            return;
        }

        audioPlayer.src = audioSrc;
        if (audioSectionContainer) audioSectionContainer.style.display = 'block';

        audioPlayer.addEventListener('error', (e) => {
            console.error('Помилка відтворення аудіо:', e);
            if (audioSectionContainer) {
                audioSectionContainer.innerHTML = `<p class="error" style="padding: 1rem; background-color: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); border-radius: var(--md-sys-shape-corner-medium);">Помилка відтворення аудіо.</p>`;
                audioSectionContainer.style.display = 'block';
            }
        });

    } catch (error) {
        console.error('Помилка ініціалізації аудіо:', error);
        if (audioSectionContainer) {
            audioSectionContainer.innerHTML = `<p class="error" style="padding: 1rem; background-color: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); border-radius: var(--md-sys-shape-corner-medium);">Аудіо контент тимчасово недоступний.</p>`;
            audioSectionContainer.style.display = 'block';
        }
    }
}

async function loadQuiz(chapterNumber, quizContainer, submitQuizButton, quizResultsElement) {
    const quizSection = document.getElementById('quiz-section');

    if (!quizContainer || !submitQuizButton || !quizResultsElement) {
        console.warn('Елементи для тесту (quizContainer, submitQuizButton, or quizResultsElement) не знайдені. Тест не буде завантажено.');
        if (quizSection) quizSection.style.display = 'none';
        return;
    }

    try {
        const quizFilePath = `quizzes/chapter${chapterNumber}.json`;
        const response = await fetch(quizFilePath);

        if (!response.ok) {
            if (response.status === 404) {
                console.log(`Файл тесту ${quizFilePath} не знайдено. Тест не буде завантажено.`);
                if (quizSection) quizSection.style.display = 'none';
            } else {
                quizContainer.innerHTML = `<p class="error">Помилка завантаження тесту: ${response.status}</p>`;
                if (quizSection) quizSection.style.display = 'block';
            }
            return;
        }

        const quizData = await response.json();

        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            console.log(`Файл тесту ${quizFilePath} порожній або не містить питань. Тест не буде завантажено.`);
            if (quizSection) quizSection.style.display = 'none';
            return;
        }

        if (quizData.questions.some(q => typeof q.correct === 'undefined')) {
             console.error('Формат питань тесту не містить поля "correct" для індексу правильної відповіді.');
             quizContainer.innerHTML = `<p class="error">Некоректний формат питань тесту (відсутнє поле "correct").</p>`;
             if (quizSection) quizSection.style.display = 'block';
             return;
        }

        displayQuiz(quizData.questions, quizContainer, submitQuizButton, quizResultsElement);
        if (quizSection) quizSection.style.display = 'block';

    } catch (error) {
        console.error('Помилка завантаження або обробки тесту:', error);
        quizContainer.innerHTML = `<p class="error">Не вдалося завантажити тест. Деталі в консолі.</p>`;
        if (quizSection) quizSection.style.display = 'block';
    }
}

function displayQuiz(questions, quizContainer, submitQuizButton, quizResultsElement) {
    let quizHTML = '';
    questions.forEach((q, index) => {
        quizHTML += `<div class="quiz-question" data-question-index="${index}">`;
        quizHTML += `<p class="question-text">${index + 1}. ${q.question}</p>`;
        quizHTML += `<div class="quiz-options">`;
        q.options.forEach((option, i) => {
            quizHTML += `
                <label class="quiz-option" style="display: block; margin-bottom: 0.5rem; padding: 0.75rem; background-color: var(--md-sys-color-surface-variant); border-radius: var(--md-sys-shape-corner-medium); cursor: pointer;">
                    <input type="radio" name="question${index}" value="${i}" style="margin-right: 0.5rem; accent-color: var(--md-sys-color-primary);">
                    ${option}
                </label>`;
        });
        quizHTML += `</div></div>`;
    });
    quizContainer.innerHTML = quizHTML;

    submitQuizButton.style.display = 'block';
    quizResultsElement.innerHTML = '';
    quizResultsElement.style.display = 'none';

    // Видаляємо попередні обробники подій, клонуючи кнопку
    const newSubmitButton = submitQuizButton.cloneNode(true);
    submitQuizButton.parentNode.replaceChild(newSubmitButton, submitQuizButton);
    newSubmitButton.addEventListener('click', () => evaluateQuiz(questions, quizResultsElement));
}

function evaluateQuiz(questions, quizResultsElement) {
    let score = 0;
    let resultsHTML = `<h4 style="color: var(--md-sys-color-primary); margin-bottom: 1rem;">Результати тесту:</h4><div class="feedback-list">`;
    let allAnswered = true;

    // Спочатку очищаємо повідомлення про помилку, якщо воно було
    quizResultsElement.innerHTML = '';
    quizResultsElement.style.display = 'none';

    questions.forEach((q, index) => {
        const selectedOptionInput = document.querySelector(`input[name="question${index}"]:checked`);
        const questionElement = document.querySelector(`[data-question-index="${index}"]`);

        if (questionElement) { // Очищення попередніх стилів
             questionElement.style.borderLeft = 'none'; // Прибираємо рамку
             // Можна додати інші стилі для скидання, якщо потрібно
        }

        if (selectedOptionInput) {
            const answerIndex = parseInt(selectedOptionInput.value);
            if (answerIndex === q.correct) {
                score++;
                resultsHTML += `<div class="question-feedback correct" style="padding: 0.75rem; margin-bottom: 0.5rem; border-radius: var(--md-sys-shape-corner-medium); background-color: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container);">`;
                resultsHTML += `<p><strong>Питання ${index + 1}:</strong> Вірно! (${q.options[answerIndex]})</p></div>`;
                if(questionElement) questionElement.style.borderLeft = '4px solid var(--md-sys-color-tertiary)';
            } else {
                resultsHTML += `<div class="question-feedback incorrect" style="padding: 0.75rem; margin-bottom: 0.5rem; border-radius: var(--md-sys-shape-corner-medium); background-color: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container);">`;
                resultsHTML += `<p><strong>Питання ${index + 1}:</strong> Невірно. Ви обрали: "${q.options[answerIndex]}".</p><p><em>Правильна відповідь:</em> "${q.options[q.correct]}"</p></div>`;
                 if(questionElement) questionElement.style.borderLeft = '4px solid var(--md-sys-color-error)';
            }
        } else {
            allAnswered = false; // Якщо хоч одне питання без відповіді
            resultsHTML += `<div class="question-feedback unanswered" style="padding: 0.75rem; margin-bottom: 0.5rem; border-radius: var(--md-sys-shape-corner-medium); background-color: var(--md-sys-color-surface-variant); color: var(--md-sys-color-on-surface-variant);">`;
            resultsHTML += `<p><strong>Питання ${index + 1}:</strong> Немає відповіді.</p><p><em>Правильна відповідь:</em> "${q.options[q.correct]}"</p></div>`;
            if(questionElement) questionElement.style.borderLeft = '4px solid var(--md-sys-color-outline)';
        }
    });

    // --- ВИПРАВЛЕННЯ ТУТ ---
    if (!allAnswered && questions.length > 0) {
        // Показуємо повідомлення про помилку, АЛЕ НЕ ВИХОДИМО З ФУНКЦІЇ
        quizResultsElement.innerHTML = `<p class="error" style="padding:1rem; background:var(--md-sys-color-error-container); color:var(--md-sys-color-on-error-container); border-radius:var(--md-sys-shape-corner-medium);">Будь ласка, дайте відповідь на всі питання.</p>`;
        quizResultsElement.style.display = 'block';
        // Прибираємо return; - кнопка залишиться активною для наступного кліку
    } else if (questions.length > 0) {
        // Якщо всі відповіді є, показуємо результати
        resultsHTML += `</div><p style="margin-top: 1.5rem; font-size: 1.1rem;"><strong>Ваш результат: ${score} з ${questions.length} (${((score / questions.length) * 100).toFixed(1)}%)</strong></p>`;
        quizResultsElement.innerHTML = resultsHTML;
        quizResultsElement.style.display = 'block';
    } else {
        // Якщо питань немає
        quizResultsElement.innerHTML = `<p>Тест не містить питань.</p>`;
        quizResultsElement.style.display = 'block';
    }
    // --- КІНЕЦЬ ВИПРАВЛЕННЯ ---
}
