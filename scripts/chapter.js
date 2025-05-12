// VideonaglyadLessons/scripts/chapter.js

// Переконайся, що бібліотека marked.js підключена в HTML перед цим скриптом!
// Приклад: <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    const chapterContentElement = document.getElementById('markdown-content');
    const quizContainer = document.getElementById('quiz-container');
    const submitQuizButton = document.getElementById('submit-quiz-btn'); // Змінено на ID з твого HTML
    const quizResultsElement = document.getElementById('quiz-results');
    const chapterTitleElement = document.getElementById('chapter-title');

    // Визначаємо номер поточного розділу з URL (наприклад, chapter1.html -> 1)
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

    // Встановлюємо заголовок (можна розширити для завантаження з JSON/MD)
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
        // Можна зупинити подальше завантаження, якщо Markdown критично важливий
        // return;
    }

    loadAllContent(chapterNumber);
});

async function loadAllContent(chapterNumber) {
    // Оновлюємо заголовок після того, як номер розділу визначено
    const chapterTitleElement = document.getElementById('chapter-title');
    if (chapterTitleElement) {
         // Тут можна додати логіку для отримання фактичної назви розділу, якщо вона є
        chapterTitleElement.textContent = `Розділ ${chapterNumber}`; // Поки що просто номер
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
        if (contentElement.innerHTML.includes('Завантаження')) { // Якщо ще не було помилки
             contentElement.innerHTML = `<p class="error">Не вдалося завантажити контент розділу. Деталі в консолі.</p>`;
        }
    }
}

async function initAudioPlayer(chapterNumber) {
    const audioPlayer = document.getElementById('audio-player');
    const audioSectionContainer = document.getElementById('audio-content-section'); // ID секції з твого HTML

    if (!audioPlayer) {
        console.warn('Елемент аудіоплеєра #audio-player не знайдено.');
        if (audioSectionContainer) audioSectionContainer.style.display = 'none';
        return;
    }
    if (!audioSectionContainer) {
        console.warn('Секція аудіоплеєра #audio-content-section не знайдена.');
    }

    try {
        const audioSrc = `audio/${chapterNumber}.wav`; // Або .mp3, залежно від твоїх файлів
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
        if (audioSectionContainer) audioSectionContainer.style.display = 'block'; // Показуємо секцію

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
    const quizSection = document.getElementById('quiz-section'); // Батьківська секція для тесту

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
                if (quizSection) quizSection.style.display = 'block'; // Показати помилку
            }
            return; // Не кидати помилку, щоб Promise.all продовжив
        }

        const quizData = await response.json();

        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            console.log(`Файл тесту ${quizFilePath} порожній або не містить питань. Тест не буде завантажено.`);
            if (quizSection) quizSection.style.display = 'none';
            return;
        }
        
        // Перевірка наявності поля 'answer' (або 'correct' як ти використовував раніше)
        // У моєму попередньому прикладі було q.answer, у твоєму HTML було q.correct
        // Будемо очікувати 'answer' як індекс правильної відповіді
        if (quizData.questions.some(q => typeof q.answer === 'undefined')) {
             console.error('Формат питань тесту не містить поля "answer" для індексу правильної відповіді.');
             quizContainer.innerHTML = `<p class="error">Некоректний формат питань тесту (відсутнє поле "answer").</p>`;
             if (quizSection) quizSection.style.display = 'block';
             return;
        }


        displayQuiz(quizData.questions, quizContainer, submitQuizButton, quizResultsElement);
        if (quizSection) quizSection.style.display = 'block'; // Показати секцію, якщо все ок

    } catch (error) {
        console.error('Помилка завантаження або обробки тесту:', error);
        quizContainer.innerHTML = `<p class="error">Не вдалося завантажити тест. Деталі в консолі.</p>`;
        if (quizSection) quizSection.style.display = 'block';
    }
}

function displayQuiz(questions, quizContainer, submitQuizButton, quizResultsElement) {
    let quizHTML = '';
    questions.forEach((q, index) => {
        quizHTML += `<div class="quiz-question" data-question-index="${index}">`; // data-question-index для уникнення конфліктів
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

    questions.forEach((q, index) => {
        const selectedOptionInput = document.querySelector(`input[name="question${index}"]:checked`);
        const questionElement = document.querySelector(`[data-question-index="${index}"]`);

        if (questionElement) { // Очищення попередніх стилів
             questionElement.style.border = 'none';
             questionElement.style.padding = '0';
        }
        
        if (selectedOptionInput) {
            const answerIndex = parseInt(selectedOptionInput.value);
            if (answerIndex === q.answer) { // Очікуємо q.answer
                score++;
                resultsHTML += `<div class="question-feedback correct" style="padding: 0.75rem; margin-bottom: 0.5rem; border-radius: var(--md-sys-shape-corner-medium); background-color: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container);">`;
                resultsHTML += `<p><strong>Питання ${index + 1}:</strong> Вірно! (${q.options[answerIndex]})</p></div>`;
                if(questionElement) questionElement.style.borderLeft = '4px solid var(--md-sys-color-tertiary)';
            } else {
                resultsHTML += `<div class="question-feedback incorrect" style="padding: 0.75rem; margin-bottom: 0.5rem; border-radius: var(--md-sys-shape-corner-medium); background-color: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container);">`;
                resultsHTML += `<p><strong>Питання ${index + 1}:</strong> Невірно. Ви обрали: "${q.options[answerIndex]}".</p><p><em>Правильна відповідь:</em> "${q.options[q.answer]}"</p></div>`;
                 if(questionElement) questionElement.style.borderLeft = '4px solid var(--md-sys-color-error)';
            }
        } else {
            allAnswered = false;
            resultsHTML += `<div class="question-feedback unanswered" style="padding: 0.75rem; margin-bottom: 0.5rem; border-radius: var(--md-sys-shape-corner-medium); background-color: var(--md-sys-color-surface-variant); color: var(--md-sys-color-on-surface-variant);">`;
            resultsHTML += `<p><strong>Питання ${index + 1}:</strong> Немає відповіді.</p><p><em>Правильна відповідь:</em> "${q.options[q.answer]}"</p></div>`;
            if(questionElement) questionElement.style.borderLeft = '4px solid var(--md-sys-color-outline)';
        }
    });
    
    if (!allAnswered && questions.length > 0) { // Перевірка, чи є питання взагалі
        quizResultsElement.innerHTML = `<p class="error" style="padding:1rem; background:var(--md-sys-color-error-container); color:var(--md-sys-color-on-error-container); border-radius:var(--md-sys-shape-corner-medium);">Будь ласка, дайте відповідь на всі питання.</p>`;
        quizResultsElement.style.display = 'block';
        return;
    }
    
    if (questions.length === 0) { // Якщо питань немає, але функцію викликали
        quizResultsElement.innerHTML = `<p>Тест не містить питань.</p>`;
        quizResultsElement.style.display = 'block';
        return;
    }

    resultsHTML += `</div><p style="margin-top: 1.5rem; font-size: 1.1rem;"><strong>Ваш результат: ${score} з ${questions.length} (${((score / questions.length) * 100).toFixed(1)}%)</strong></p>`;
    quizResultsElement.innerHTML = resultsHTML;
    quizResultsElement.style.display = 'block';
}

