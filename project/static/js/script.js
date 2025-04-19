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

// === Quiz logic ===
document.addEventListener('DOMContentLoaded', function () {
    let currentQuestion = 1;
    let selectedAnswer = null;

    // Load question from API
    function loadQuestion() {
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
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.complete) {
                    window.location.href = '/quiz/end/';
                    return;
                }

                document.getElementById('current').textContent = data.current;
                document.getElementById('questionText').textContent = data.question;

                const answersDiv = document.getElementById('answers');
                answersDiv.innerHTML = '';

                data.answers.forEach((answer, index) => {
                    const button = document.createElement('button');
                    button.className = 'answer-choice';
                    button.textContent = answer;
                    button.onclick = function () {
                        document.querySelectorAll('.answer-choice').forEach(btn => {
                            btn.classList.remove('selected');
                        });
                        this.classList.add('selected');
                        selectedAnswer = index;
                        document.getElementById('nextButton').disabled = false;
                    };
                    answersDiv.appendChild(button);
                });

                document.getElementById('nextButton').disabled = true;
                selectedAnswer = null;
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('questionText').textContent = "Error loading question. Please refresh.";
            });
    }

    // Load current quiz progress if any
    fetch('/quiz/api/')
        .then(response => response.json())
        .then(data => {
            if (data.quiz_in_progress) {
                const continueQuiz = document.getElementById('continueQuiz');
                if (continueQuiz) {
                    continueQuiz.style.display = 'block';
                }
            }
        });

    // Event listeners
    const startButton = document.getElementById('startQuiz');
    if (startButton) {
        startButton.addEventListener('click', () => {
            fetch('/quiz/api/', {
                method: 'GET',
                credentials: 'same-origin'
            }).then(() => {
                window.location.href = '/quiz/';
            });
        });
    }

    const continueButton = document.getElementById('continueButton');
    if (continueButton) {
        continueButton.addEventListener('click', () => {
            window.location.href = '/quiz/';
        });
    }

    const nextButton = document.getElementById('nextButton');
    if (nextButton) {
        nextButton.addEventListener('click', function () {
            if (selectedAnswer !== null) {

                currentQuestion++;
                loadQuestion();
            }
        });
    }

    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', function () {
            window.location.href = '/quiz/';
        });
    }

    if (document.getElementById('questionText')) {
        loadQuestion();
    }
});

// Hamburger menu functionality
document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.getElementById('hamburger-menu');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', function () {
            this.classList.toggle('open');
            mobileMenu.classList.toggle('open');
        });
    }
});
