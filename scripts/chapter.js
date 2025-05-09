// JavaScript для роботи з розділами
document.addEventListener('DOMContentLoaded', () => {
    const scriptElement = document.querySelector('script[data-chapter-number]');
    const chapterNumber = scriptElement?.dataset.chapterNumber;
    
    if (!chapterNumber) {
        console.error('Не вказано номер розділу');
        showError('Помилка конфігурації сторінки');
        return;
    }

    // Завантаження всього контенту
    loadAllContent(chapterNumber);
});

// Функція для відображення помилок
function showError(message, elementId = 'text-content') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="error">${message}</div>`;
    }
}

// Завантаження всього контенту
async function loadAllContent(chapterNumber) {
    try {
        await Promise.all([
            loadTextContent(chapterNumber),
            initAudioPlayer(chapterNumber),
            loadQuiz(chapterNumber)
        ]);
    } catch (error) {
        console.error('Помилка завантаження контенту:', error);
        showError('Виникла помилка при завантаженні контенту. Будь ласка, оновіть сторінку.');
    }
}

// Завантаження текстового контенту
async function loadTextContent(chapterNumber) {
    const textContent = document.getElementById('text-content');
    if (!textContent) {
        throw new Error('Не знайдено елемент для текстового контенту');
    }

    try {
        const response = await fetch(`book/chapter${chapterNumber}.txt`);
        if (!response.ok) {
            throw new Error(`HTTP помилка! статус: ${response.status}`);
        }
        const text = await response.text();
        
        // Форматуємо текст, зберігаючи структуру
        let formattedText = '';
        let inList = false;
        
        text.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) {
                if (inList) {
                    formattedText += '</ul>';
                    inList = false;
                }
                return;
            }

            if (trimmedLine.startsWith('-')) {
                if (!inList) {
                    formattedText += '<ul>';
                    inList = true;
                }
                formattedText += `<li>${trimmedLine.substring(1).trim()}</li>`;
            } else if (trimmedLine.match(/^\d+\./)) {
                if (inList) {
                    formattedText += '</ul>';
                    inList = false;
                }
                formattedText += `<h4>${trimmedLine}</h4>`;
            } else {
                if (inList) {
                    formattedText += '</ul>';
                    inList = false;
                }
                formattedText += `<p>${trimmedLine}</p>`;
            }
        });

        if (inList) {
            formattedText += '</ul>';
        }
        
        textContent.innerHTML = formattedText;
    } catch (error) {
        console.error('Помилка завантаження текстового контенту:', error);
        showError('Помилка завантаження текстового контенту. Спробуйте оновити сторінку.');
        throw error;
    }
}

// Ініціалізація аудіо плеєра
async function initAudioPlayer(chapterNumber) {
    const audioPlayer = document.getElementById('audio-player');
    const audioContainer = audioPlayer?.parentElement;
    
    if (!audioPlayer || !audioContainer) {
        throw new Error('Не знайдено аудіо плеєр');
    }

    try {
        audioPlayer.src = `audio/${chapterNumber}.wav`;
        
        // Перевіряємо чи файл існує
        const response = await fetch(audioPlayer.src, { method: 'HEAD' });
        if (!response.ok) {
            throw new Error('Аудіо файл недоступний');
        }

        audioPlayer.addEventListener('error', (e) => {
            console.error('Помилка відтворення аудіо:', e);
            showError('Помилка відтворення аудіо', audioContainer.id);
        });
    } catch (error) {
        console.error('Помилка ініціалізації аудіо:', error);
        audioContainer.innerHTML = '<p class="error">Аудіо контент тимчасово недоступний</p>';
        throw error;
    }
}

// Завантаження тесту
async function loadQuiz(chapterNumber) {
    const quizContainer = document.getElementById('quiz-container');
    const submitButton = document.getElementById('submit-quiz-btn');
    const results = document.getElementById('quiz-results');
    
    if (!quizContainer || !submitButton || !results) {
        throw new Error('Не знайдено елементи тесту');
    }

    try {
        const response = await fetch(`quizzes/chapter${chapterNumber}.json`);
        if (!response.ok) {
            throw new Error(`HTTP помилка! статус: ${response.status}`);
        }
        const quiz = await response.json();
        
        if (!quiz.questions || !Array.isArray(quiz.questions)) {
            throw new Error('Некоректний формат тесту');
        }
        
        // Створюємо HTML для тесту
        quizContainer.innerHTML = quiz.questions.map((question, index) => `
            <div class="quiz-question" data-question="${index}">
                <p class="question-text">${question.question}</p>
                <div class="quiz-options">
                    ${question.options.map((option, optIndex) => `
                        <label class="quiz-option">
                            <input type="radio" name="q${index}" value="${optIndex}">
                            <span class="option-text">${option}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('');

        submitButton.style.display = 'block';
        results.innerHTML = ''; // Очищаємо попередні результати
        
        // Видаляємо попередні обробники подій
        submitButton.replaceWith(submitButton.cloneNode(true));
        const newSubmitButton = document.getElementById('submit-quiz-btn');
        newSubmitButton.addEventListener('click', () => checkAnswers(quiz));
    } catch (error) {
        console.error('Помилка завантаження тесту:', error);
        showError('Помилка завантаження тесту. Спробуйте оновити сторінку.', 'quiz-container');
        submitButton.style.display = 'none';
        throw error;
    }
}

// Перевірка відповідей
function checkAnswers(quiz) {
    const results = document.getElementById('quiz-results');
    if (!results) {
        console.error('Не знайдено елемент для результатів');
        return;
    }

    let correctAnswers = 0;
    const feedback = [];
    let allAnswered = true;

    quiz.questions.forEach((question, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        const questionElement = document.querySelector(`[data-question="${index}"]`);
        
        if (selected) {
            const isCorrect = parseInt(selected.value) === question.correct;
            if (isCorrect) {
                correctAnswers++;
                questionElement.classList.add('correct');
            } else {
                questionElement.classList.add('incorrect');
            }
            feedback.push(`
                <div class="question-feedback ${isCorrect ? 'correct' : 'incorrect'}">
                    <p>Питання ${index + 1}: ${isCorrect ? 'Правильно' : 'Неправильно'}</p>
                    <p>Правильна відповідь: ${question.options[question.correct]}</p>
                </div>
            `);
        } else {
            allAnswered = false;
            questionElement.classList.add('unanswered');
            feedback.push(`
                <div class="question-feedback unanswered">
                    <p>Питання ${index + 1}: Не відповідено</p>
                </div>
            `);
        }
    });

    if (!allAnswered) {
        results.innerHTML = `
            <div class="error">
                Будь ласка, дайте відповідь на всі питання перед перевіркою.
            </div>
        `;
        return;
    }

    const percentage = (correctAnswers / quiz.questions.length) * 100;
    results.innerHTML = `
        <div class="quiz-results-summary ${percentage >= 70 ? 'passed' : 'failed'}">
            <h4>Результати тесту:</h4>
            <p>Правильних відповідей: ${correctAnswers} з ${quiz.questions.length} (${percentage.toFixed(1)}%)</p>
            <p class="result-message">${percentage >= 70 ? 'Вітаємо! Ви успішно пройшли тест!' : 'Спробуйте ще раз після повторення матеріалу.'}</p>
        </div>
        <div class="quiz-feedback-details">
            ${feedback.join('')}
        </div>
    `;
} 