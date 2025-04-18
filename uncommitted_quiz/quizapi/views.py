from django.shortcuts import render
from django.http import JsonResponse
from .utils import gen_quiz_question

def get_quiz_questions(request):
    if request.method == 'GET':
        # Check quiz progress status for home page
        in_progress = request.session.get('question_count', 0) > 0
        return JsonResponse({
            'quiz_in_progress': in_progress,
            'total_questions': 5,
            'current_progress': request.session.get('question_count', 0)
        })

    # Handle quiz progression
    if 'quiz_questions' not in request.session:
        request.session['quiz_questions'] = []
        request.session['question_count'] = 0

    if request.session['question_count'] >= 5:
        request.session.flush()
        return JsonResponse({
            "complete": True,
            "score": "100%",
            "message": "You scored 100% because being willing to try makes you a coder",
        })

    question = gen_quiz_question()
    request.session['quiz_questions'].append(question)
    request.session['question_count'] += 1
    request.session.modified = True

    return JsonResponse({
        "complete": False,
        "question": question['question'],
        "answers": question['answers'],
        "current": request.session['question_count'],
        "total": 5,
    })

def index(request):
    return render(request, 'index.html')

def quiz(request):
    return render(request, 'quiz.html')
