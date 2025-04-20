/* jshint esversion: 6 */

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
document.addEventListener('DOMContentLoaded', function () {
    loadModelViewer().then(() => {
        setupModelViewer();
        initializeQuiz();
    });
});

function initializeQuiz() {
    let currentQuestion = 1;
    let selectedAnswer = null;

    // Load question from API
    function loadQuestion() {
        selectedAnswer = null;
        const nextButton = document.getElementById('nextButton');
        if (nextButton) nextButton.disabled = true;

        console.log("Loading question", currentQuestion);
        const method = currentQuestion > 1 ? 'POST' : 'GET';

        fetch('/quiz/api/', {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            credentials: 'same-origin'
        })
        .then(handleResponse)
        .then(updateQuestionUI)
        .catch(handleQuestionError);
    }

    function handleResponse(response) {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    }

    function updateQuestionUI(data) {
        if (data.complete) {
            window.location.href = '/quiz/end/';
            return;
        }

        document.getElementById('current').textContent = data.current;
        document.getElementById('questionText').textContent = data.question;
        renderAnswerButtons(data.answers);
    }

    function renderAnswerButtons(answers) {
        const answersDiv = document.getElementById('answers');
        answersDiv.innerHTML = '';

        answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.className = 'answer-choice';
            button.textContent = answer;
            button.onclick = () => selectAnswer(button, index);
            answersDiv.appendChild(button);
        });
    }

    function selectAnswer(button, index) {
        document.querySelectorAll('.answer-choice').forEach(btn => {
            btn.classList.remove('selected');
        });
        button.classList.add('selected');
        selectedAnswer = index;
        document.getElementById('nextButton').disabled = false;
    }

    function handleQuestionError(error) {
        console.error('Error:', error);
        document.getElementById('questionText').textContent = "Error loading question. Please refresh.";
    }

    // Quiz control event listeners
    const nextButton = document.getElementById('nextButton');
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            if (selectedAnswer !== null) {
                currentQuestion++;
                loadQuestion();
            }
        });
    }

    // Load current quiz progress if any
    fetch('/quiz/api/')
        .then(response => response.json())
        .then(data => {
            if (data.quiz_in_progress && document.getElementById('continueQuiz')) {
                document.getElementById('continueQuiz').style.display = 'block';
            }
        });

    // Initial load
    if (document.getElementById('questionText')) {
        loadQuestion();
    }
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

    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', () => {
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

// Initialize non-quiz specific listeners
document.addEventListener('DOMContentLoaded', setupEventListeners);

// This section handles the score submission to local storage
document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit-score');
    const anonymousButton = document.getElementById('submit-anonymous');
    const userNameInput = document.getElementById('user-name');
    const submissionMessage = document.getElementById('submission-message');
    const score = JSON.parse(document.getElementById('finalScore').textContent);

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

// This section handles the scoreboard display
document.addEventListener('DOMContentLoaded', function () {
    const scoreList = document.getElementById('scoreList');
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

    console.log("Extra scores count:", extraScores.length);

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
        console.log("Toggle button added");
    }
});