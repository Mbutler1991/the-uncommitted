from django.shortcuts import render
from django.http import JsonResponse
from .utils import gen_quiz_question

def get_quiz_questions(request):
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

    return JsonResponse({
        "complete": False,
        "question": question['question'],
        "answers": question['answers'], 
        "current": request.session['question_count'],
        "total": 5,
    })

def index(request):
    return render(request, 'index.html')