from django .shortcuts import render
from django.http import JsonResponse
from .utils import gen_quiz_question

def get_quiz_questions(request):
    if 'quiz_questions' not in request.session:
        request.session['quiz_questions'] = []
        request.session['question_count'] = 0

    # Check if we have reached 5 questions
    if request.session['question_count'] >= 5:
        request.session.flush()  # Clear session and reset
        return JsonResponse({
            "complete": True,
            "score": "100%",
            "message": "Well done, you win! Keep up the great work!"
        })

    # Get a new question and add it to the session
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
