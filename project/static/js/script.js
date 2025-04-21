/* jshint esversion: 8 */

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');

// ===== Quiz State Management =====
const quizState = {
    isLoading: false
};

// ===== 3D Model Viewer Setup =====
function loadModelViewer() {
    return new Promise((resolve) => {
        if (typeof window.ModelViewerElement !== 'undefined') {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://unpkg.com/@google/model-viewer@^2.1.1/dist/model-viewer.min.js';
        script.onload = resolve;
        script.onerror = () => {
            console.error('Failed to load model-viewer from CDN');
            resolve();
        };
        document.head.appendChild(script);
    });
}

function setupModelViewer() {
    const modelViewer = document.querySelector('model-viewer');
    if (!modelViewer) return;

    modelViewer.addEventListener('error', (event) => {
        console.error('3D Model error:', event.detail);
        modelViewer.style.backgroundColor = '#ffebee';
    });

    modelViewer.addEventListener('load', () => {
        console.log('3D Model loaded successfully');
        modelViewer.style.backgroundColor = 'transparent';
    });
}

// ===== Quiz Logic =====
function initializeQuiz() {
    // Cache DOM elements
    const questionTextEl = document.getElementById('questionText');
    const currentEl = document.getElementById('current');
    const answersEl = document.getElementById('answers');
    const nextButton = document.getElementById('nextButton');
    const backButton = document.getElementById('backButton');
    const questionContainer = document.getElementById('question');

    // Validate required elements
    if (!questionTextEl || !currentEl || !answersEl || !nextButton || !backButton || !questionContainer) {
        console.error('Missing required quiz elements');
        return;
    }

    // Load question from API
    async function loadQuestion(action = 'next') {
        if (quizState.isLoading) return;
        
        quizState.isLoading = true;
        questionContainer.classList.add('loading');
        nextButton.disabled = true;

        try {
            const response = await fetch('/quiz/api/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({
                    action: action
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            if (data.error) throw new Error(data.error);
            if (data.complete) {
                window.location.href = '/quiz/end/';
                return;
            }

            // Additional check to prevent going beyond 5 questions
            if (data.current > 5) {
                window.location.href = '/quiz/end/';
                return;
            }

            updateQuestionUI(data);
        } catch (error) {
            console.error('Error:', error);
            questionTextEl.textContent = "Error loading question. Please refresh.";
        } finally {
            quizState.isLoading = false;
            questionContainer.classList.remove('loading');
        }
    }

    function updateQuestionUI(data) {
        currentEl.textContent = data.current;
        questionTextEl.textContent = data.question;
        renderAnswerButtons(data.answers);
    }

    function renderAnswerButtons(answers) {
        answersEl.innerHTML = '';
        answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.className = 'answer-choice';
            button.textContent = answer;
            button.onclick = () => selectAnswer(button, index);
            answersEl.appendChild(button);
        });
    }

    function selectAnswer(button, index) {
        document.querySelectorAll('.answer-choice').forEach(btn => {
            btn.classList.remove('selected');
        });
        button.classList.add('selected');
        nextButton.disabled = false;
    }

    // Event Listeners
    nextButton.addEventListener('click', () => {
        if (!quizState.isLoading) loadQuestion('next');
    });

    backButton.addEventListener('click', () => {
        if (!quizState.isLoading) loadQuestion('back');
    });

    // Initial load
    loadQuestion();
}


function setupEventListeners() {
    const startButton = document.getElementById('startQuiz');
    if (startButton) {
        startButton.addEventListener('click', () => {
            fetch('/quiz/api/', { method: 'GET', credentials: 'same-origin' })
                .then(() => window.location.href = '/quiz/');
        });
    }

    const continueButton = document.getElementById('continueButton');
    if (continueButton) {
        continueButton.addEventListener('click', () => {
            window.location.href = '/quiz/';
        });
    }

    // Hamburger menu
    const hamburger = document.getElementById('hamburger-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', function () {
            this.classList.toggle('open');
            mobileMenu.classList.toggle('open');
        });
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Only initialize quiz if on quiz page
    if (document.getElementById('question')) {
        loadModelViewer().then(() => {
            setupModelViewer();
            initializeQuiz();
        });
    }
    
    // Initialize other event listeners
    setupEventListeners();
    
    // Initialize scoreboard if on end page
    initializeScoreboard();
});

function initializeScoreboard() {
    const scoreList = document.getElementById('scoreList');
    if (!scoreList) return;

    const scores = JSON.parse(localStorage.getItem('quizScores')) || [];

    // Sort by newest first
    scores.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (scores.length === 0) {
        scoreList.innerHTML = '<p>No scores yet.</p>';
        return;
    }

    const extraScores = [];

    scores.forEach((entry, index) => {
        const btn = document.createElement('button');
        btn.className = 'score-btn';
        btn.textContent = `${entry.name} - ${entry.score}`;

        if (index >= 5) {
            btn.style.display = 'none';
            btn.classList.add('extra-score');
            extraScores.push(btn);
        }

        scoreList.appendChild(btn);
    });

    if (extraScores.length > 0) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'secondary-btn';
        toggleBtn.textContent = 'Show More';
        toggleBtn.style.marginTop = '10px';
        toggleBtn.style.display = 'block';

        toggleBtn.addEventListener('click', function () {
            const isHidden = extraScores[0].style.display === 'none';

            extraScores.forEach(btn => {
                btn.style.display = isHidden ? 'inline-block' : 'none';
            });

            toggleBtn.textContent = isHidden ? 'Show Less' : 'Show More';
        });

        scoreList.after(toggleBtn);
    }
}

// Score submission
document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit-score');
    const anonymousButton = document.getElementById('submit-anonymous');
    const userNameInput = document.getElementById('user-name');
    const submissionMessage = document.getElementById('submission-message');
    const finalScoreEl = document.getElementById('finalScore');

    if (!submitButton || !anonymousButton || !userNameInput || !submissionMessage || !finalScoreEl) return;

    const score = JSON.parse(finalScoreEl.textContent);

    // Submit with name
    submitButton.addEventListener('click', function() {
        const userName = userNameInput.value.trim();
        if (userName === '') {
            submissionMessage.textContent = 'Please enter a name';
            submissionMessage.style.color = '#dc3545';
            return;
        }
        saveScore(userName, score);
    });

    // Submit as anonymous
    anonymousButton.addEventListener('click', function() {
        saveScore('Anonymous', score);
    });

    function saveScore(name, score) {
        let scores = JSON.parse(localStorage.getItem('quizScores')) || [];
        
        scores.push({
            name: name,
            score: score,
            date: new Date().toISOString()
        });
        
        scores.sort((a, b) => b.score - a.score);
        localStorage.setItem('quizScores', JSON.stringify(scores));

        submissionMessage.textContent = 'Score saved successfully!';
        submissionMessage.style.color = '#28a745';
        submitButton.disabled = true;
        anonymousButton.disabled = true;
        userNameInput.disabled = true;
    }
});