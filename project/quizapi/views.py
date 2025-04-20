from django.shortcuts import render
from django.http import JsonResponse
from .utils import gen_quiz_question
from django.views.decorators.csrf import csrf_exempt


def home(request):
    """Home page view"""
    return render(request, 'index.html')


def about(request):
    return render(request, 'about.html')


def quiz_view(request):
    """Quiz page view"""
    return render(request, 'quiz.html')


def end_view(request):
    # Get the final score from session or API
    final_data = {
        "score": "100%",
        "message":
            "You scored 100% because being willing to try makes you a coder"
    }
    return render(request, 'end.html', {'final_data': final_data})


@csrf_exempt
def get_quiz_questions(request):
    # Initialize session if needed
    if 'quiz_questions' not in request.session:
        request.session['quiz_questions'] = []
        request.session['question_count'] = 0
        request.session.modified = True

    # Check if quiz is complete
    if request.session['question_count'] >= 5:
        request.session.flush()
        return JsonResponse({
            "complete": True,
            "score": "100%",
            "message":
            "You scored 100% because being willing to try makes you a coder",
        })

    # For GET requests, return current question or first question if none
    if request.method == 'GET':
        if request.session['question_count'] > 0:
            # Return the current/last question
            current_question = request.session['quiz_questions'][-1]
            return JsonResponse({
                "complete": False,
                "question": current_question['question'],
                "answers": current_question['answers'],
                "current": request.session['question_count'],
                "total": 5,
            })
        else:
            # Generate and return first question
            used_questions = [q["question"] for q in request.session['quiz_questions']]
            question = gen_quiz_question(used_questions)
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

    # For POST requests, generate and return next question
    used_questions = [q["question"] for q in request.session['quiz_questions']]
    question = gen_quiz_question(used_questions)
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

