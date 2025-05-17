// VideonaglyadLessons/scripts/chapter.js

// Переконайся, що бібліотека marked.js підключена в HTML перед цим скриптом!
// Приклад: <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    const chapterContentElement = document.getElementById('markdown-content');
    const quizContainer = document.getElementById('quiz-container');
    const submitQuizButton = document.getElementById('submit-quiz-btn'); 
    const quizResultsElement = document.getElementById('quiz-results');
    const chapterTitleElement = document.getElementById('chapter-title');

    // Навігаційні елементи
    const prevChapterLink = document.getElementById('prev-chapter-link');
    const nextChapterLink = document.getElementById('next-chapter-link');
    const currentChapterNumberSpan = document.getElementById('current-chapter-number');
    const totalChaptersCountSpan = document.getElementById('total-chapters-count');
    const totalChapters = 18; // Загальна кількість розділів (можна зробити динамічним)

    if (totalChaptersCountSpan) {
        totalChaptersCountSpan.textContent = totalChapters;
    }

    const pathParts = window.location.pathname.split('/');
    const currentChapterFileName = pathParts.pop() || pathParts.pop(); // e.g., "chapter1.html"
    const chapterNumberMatch = currentChapterFileName.match(/chapter(\d+)\.html/);

    if (!chapterNumberMatch || chapterNumberMatch.length < 2) {
        const errorMessage = 'Не вдалося визначити номер розділу для завантаження контенту з URL.';
        if (chapterContentElement) chapterContentElement.innerHTML = `<p class="error-message-js">${errorMessage}</p>`;
        if (chapterTitleElement) chapterTitleElement.textContent = 'Помилка завантаження';
        console.error("Could not determine chapter number from URL:", currentChapterFileName);
        return;
    }
    const chapterNumber = parseInt(chapterNumberMatch[1]);

    if (chapterTitleElement) {
        chapterTitleElement.textContent = `Розділ ${chapterNumber}: Завантаження...`; // Початковий заголовок
    }
    if (currentChapterNumberSpan) {
        currentChapterNumberSpan.textContent = chapterNumber;
    }

    // Оновлення навігаційних посилань
    if (prevChapterLink) {
        if (chapterNumber <= 1) {
            prevChapterLink.classList.add('disabled');
            prevChapterLink.removeAttribute('href');
        } else {
            prevChapterLink.classList.remove('disabled');
            prevChapterLink.href = `chapter${chapterNumber - 1}.html`;
        }
    }
    if (nextChapterLink) {
        if (chapterNumber >= totalChapters) {
            nextChapterLink.classList.add('disabled');
            nextChapterLink.removeAttribute('href');
        } else {
            nextChapterLink.classList.remove('disabled');
            nextChapterLink.href = `chapter${chapterNumber + 1}.html`;
        }
    }
    
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
        else if (document.body) document.body.insertAdjacentHTML('afterbegin', `<div class="error-message-js">${errorMsg}</div>`);
        console.error("marked.js library is not loaded.");
    }

    // Передаємо ім'я файлу поточного розділу для пошуку назви
    loadAllContent(chapterNumber, currentChapterFileName); 
});

async function fetchChapterTitleFromIndex(currentChapterFileName) {
    try {
        const response = await fetch('index.html'); // Завантажуємо index.html
        if (!response.ok) {
            console.error(`Помилка завантаження index.html: ${response.status}`);
            return null;
        }
        const indexHtmlText = await response.text();
        const parser = new DOMParser();
        const indexDoc = parser.parseFromString(indexHtmlText, 'text/html');
        
        const chapterLinks = indexDoc.querySelectorAll('a.chapter-card');
        for (const link of chapterLinks) {
            const linkHref = link.getAttribute('href');
            if (linkHref && linkHref.endsWith(currentChapterFileName)) {
                const h3Title = link.querySelector('h3');
                if (h3Title && h3Title.textContent) {
                    return h3Title.textContent.trim(); // Повертаємо текст з <h3>
                }
            }
        }
        console.warn(`Назва для ${currentChapterFileName} не знайдена в index.html`);
        return null;
    } catch (error) {
        console.error('Помилка при отриманні назви розділу з index.html:', error);
        return null;
    }
}


async function loadAllContent(chapterNumber, currentChapterFileName) {
    const chapterTitleElement = document.getElementById('chapter-title');
    
    // Отримуємо назву розділу з index.html
    const fetchedTitle = await fetchChapterTitleFromIndex(currentChapterFileName);

    if (chapterTitleElement) {
        if (fetchedTitle) {
            // Використовуємо назву з index.html, якщо вона є
            chapterTitleElement.textContent = fetchedTitle;
        } else {
            // Залишаємо базову назву, якщо з index.html не вдалося отримати
            chapterTitleElement.textContent = `Розділ ${chapterNumber}`; 
        }
    }

    try {
        await Promise.all([
            // Передаємо chapterNumber та fetchedTitle (або null) в loadMarkdownContent
            loadMarkdownContent(chapterNumber, fetchedTitle), 
            initAudioPlayer(chapterNumber),
            loadQuiz(chapterNumber, document.getElementById('quiz-container'), document.getElementById('submit-quiz-btn'), document.getElementById('quiz-results'))
        ]);
    } catch (error) {
        console.error('Помилка під час Promise.all в loadAllContent:', error);
    }
}

// Змінюємо loadMarkdownContent, щоб вона могла використовувати передану назву
async function loadMarkdownContent(chapterNumber, chapterTitleFromIndex) {
    const contentElement = document.getElementById('markdown-content');
    if (!contentElement) {
        console.warn("Елемент #markdown-content не знайдено на сторінці.");
        return;
    }
    if (typeof marked === 'undefined') return; 

    try {
        const markdownFilePath = `book/chapter${chapterNumber}.md`;
        const response = await fetch(markdownFilePath);
        if (!response.ok) {
            contentElement.innerHTML = `<p class="error-message-js">Помилка завантаження текстового матеріалу (<code>${markdownFilePath}</code>): ${response.status}.</p>`;
            console.error(`HTTP error! status: ${response.status} when fetching ${markdownFilePath}`);
            return;
        }
        const markdownText = await response.text();
        contentElement.innerHTML = marked.parse(markdownText);

        // Оновлення заголовка сторінки:
        // 1. Якщо назва була успішно передана з index.html, використовуємо її.
        // 2. Інакше, пробуємо взяти з першого H1 файлу Markdown.
        // 3. Якщо і там немає, ставимо базову назву.
        const chapterTitleElement = document.getElementById('chapter-title');
        if (chapterTitleElement) {
            if (chapterTitleFromIndex) {
                // Якщо назва з index.html існує, використовуємо її.
                // chapterTitleElement.textContent = chapterTitleFromIndex; // Це вже встановлено в loadAllContent
            } else {
                // Якщо назви з index.html немає, шукаємо H1 в MD
                const firstH1 = contentElement.querySelector('h1');
                if (firstH1 && firstH1.textContent) {
                    chapterTitleElement.textContent = `Розділ ${chapterNumber}: ${firstH1.textContent.trim()}`;
                    firstH1.remove(); 
                } else {
                    // Якщо H1 не знайдено в MD, і з index.html теж нічого, ставимо базовий
                    // chapterTitleElement.textContent = `Розділ ${chapterNumber}`; // Це вже встановлено в loadAllContent як fallback
                }
            }
        }


    } catch (error) {
        console.error('Помилка завантаження або парсингу Markdown:', error);
        if (contentElement.innerHTML.includes('Завантаження')) { 
             contentElement.innerHTML = `<p class="error-message-js">Не вдалося завантажити контент розділу. Деталі в консолі.</p>`;
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
        const audioSrc = `audio/${chapterNumber}.wav`; 
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

        // Тут audio.js має підхопити плеєр і додати свої контроли
        // Якщо audio.js не справляється, можна додати базові атрибути:
        // audioPlayer.setAttribute('controls', '');


    } catch (error) {
        console.error('Помилка ініціалізації аудіо:', error);
        if (audioSectionContainer) {
            audioSectionContainer.innerHTML = `<p class="error-message-js">Аудіо контент тимчасово недоступний.</p>`;
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
                quizContainer.innerHTML = `<p class="error-message-js">Помилка завантаження тесту: ${response.status}</p>`;
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
             quizContainer.innerHTML = `<p class="error-message-js">Некоректний формат питань тесту (відсутнє поле "correct").</p>`;
             if (quizSection) quizSection.style.display = 'block';
             return;
        }


        displayQuiz(quizData.questions, quizContainer, submitQuizButton, quizResultsElement);
        if (quizSection) quizSection.style.display = 'block'; 

    } catch (error) {
        console.error('Помилка завантаження або обробки тесту:', error);
        quizContainer.innerHTML = `<p class="error-message-js">Не вдалося завантажити тест. Деталі в консолі.</p>`;
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
                <label class="quiz-option">
                    <input type="radio" name="question${index}" value="${i}">
                    <span class="option-text">${option}</span>
                </label>`;
        });
        quizHTML += `</div></div>`;
    });
    quizContainer.innerHTML = quizHTML;

    submitQuizButton.style.display = 'block';
    quizResultsElement.innerHTML = '';
    quizResultsElement.style.display = 'none';

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

        if (questionElement) { 
             questionElement.classList.remove('correct', 'incorrect', 'unanswered'); 
        }
        
        if (selectedOptionInput) {
            const answerIndex = parseInt(selectedOptionInput.value);
            if (answerIndex === q.correct) { 
                score++;
                resultsHTML += `<div class="question-feedback correct">`;
                resultsHTML += `<p><strong>Питання ${index + 1}:</strong> Вірно! (${q.options[answerIndex]})</p><p><em> Пояснення: </em> "${q.explanation}"</p></div>`;
                if(questionElement) questionElement.classList.add('correct');
            } else {
                resultsHTML += `<div class="question-feedback incorrect">`;
                resultsHTML += `<p><strong>Питання ${index + 1}:</strong> Невірно. Ви обрали: "${q.options[answerIndex]}".</p><p><em>Правильна відповідь:</em> "${q.options[q.correct]}"</p><p><em> Пояснення: </em> "${q.explanation}"</p></div>`; 
                 if(questionElement) questionElement.classList.add('incorrect');
            }
        } else {
            allAnswered = false;
            resultsHTML += `<div class="question-feedback unanswered">`;
            resultsHTML += `<p><strong>Питання ${index + 1}:</strong> Немає відповіді.</p><p><em>Правильна відповідь:</em> "${q.options[q.correct]}"</p></div>`; 
            if(questionElement) questionElement.classList.add('unanswered');
        }
    });
    
    if (!allAnswered && questions.length > 0) { 
        quizResultsElement.innerHTML = `<p class="error-message-js">Будь ласка, дайте відповідь на всі питання.</p>`;
        quizResultsElement.style.display = 'block';
        return;
    }
    
    if (questions.length === 0) { 
        quizResultsElement.innerHTML = `<p>Тест не містить питань.</p>`;
        quizResultsElement.style.display = 'block';
        return;
    }

    resultsHTML += `</div>`; 
    const percentage = questions.length > 0 ? (score / questions.length) * 100 : 0;
    resultsHTML += `
        <div class="quiz-results-summary ${percentage >= 70 ? 'passed' : 'failed'}" style="margin-top: 1.5rem;">
            <p style="font-size: 1.1rem;"><strong>Ваш результат: ${score} з ${questions.length} (${percentage.toFixed(1)}%)</strong></p>
            ${percentage >= 70 ? '<p>Вітаємо, тест пройдено!</p>' : '<p>Спробуйте ще раз після повторення матеріалу.</p>'}
        </div>`;
    quizResultsElement.innerHTML = resultsHTML;
    quizResultsElement.style.display = 'block';
}

