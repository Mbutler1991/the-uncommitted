fetch('/api/quiz/', { method: 'POST' })
    .then(response => response.json())
    .then(data => {
        document.getElementById('scoreMessage').textContent = data.message;
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('scoreMessage').textContent = 'An error occurred. Please try again.';
    });

// Check if a quiz is in progress
fetch('/api/quiz/')
    .then(response => response.json())
    .then(data => {
        if (data.quiz_in_progress) {
            document.getElementById('continueQuiz').style.display = 'block';
        }
    });

// Start new quiz
document.getElementById('startQuiz').addEventListener('click', () => {
    fetch('/api/quiz/', { method: 'GET' })
        .then(() => window.location.href = '/quiz/');
});


fetch('/api/quiz/')
    .then(response => response.json())
    .then(data => {
        if (data.quiz_in_progress) {
            document.getElementById('continueQuiz').style.display = 'block';
        }
    });

// Continue existing quiz
document.getElementById('continueButton').addEventListener('click', () => {
    window.location.href = '/quiz/';
});

let currentQuestion = 1;
let selectedAnswer = null;

// Load question from API
function loadQuestion() {
    fetch('/api/quiz/')
        .then(response => response.json())
        .then(data => {

            // Update question number
            document.getElementById('current').textContent = data.current;

            // Update question text
            document.getElementById('questionText').textContent = data.question;

            // Clear previous answers
            const answersDiv = document.getElementById('answers');
            answersDiv.innerHTML = '';

            // Create new answer buttons
            data.answers.forEach((answer, index) => {
                const button = document.createElement('button');
                button.className = 'answer-choice';
                button.textContent = answer;
                button.onclick = () => handleAnswerSelect(button, index);
                answersDiv.appendChild(button);
            });

            // Reset next button
            document.getElementById('nextButton').disabled = true;

        });
}

function handleAnswerSelect(button, index) {
    // Remove selection from all buttons
    document.querySelectorAll('.answer-choice').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Add selection to clicked button
    button.classList.add('selected');
    document.getElementById('nextButton').disabled = false;
}

// Navigation handlers
document.getElementById('backButton').addEventListener('click', () => {
    if (currentQuestion > 1) {
        currentQuestion--;
        loadQuestion();
    }
});

document.getElementById('nextButton').addEventListener('click', () => {
    currentQuestion++;
    loadQuestion();
});

// Initial load
loadQuestion();