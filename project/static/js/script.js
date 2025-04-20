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