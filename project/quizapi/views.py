from django.shortcuts import render
from django.http import JsonResponse
from .utils import gen_quiz_question
from django.views.decorators.csrf import csrf_exempt
import json


def home(request):
    """Home page view"""
    return render(request, "index.html")


def about(request):
    return render(request, "about.html")


def quiz_view(request):
    """Quiz page view"""
    return render(request, "quiz.html")


def end_view(request):
    # Get the final score from session or API
    final_data = {
        "score": "100%",
        "message": "You scored 100% "
        "because being willing to try makes you a coder",
    }
    return render(request, "end.html", {"final_data": final_data})


@csrf_exempt
def get_quiz_questions(request):
    # Initialize session variables if they don't exist
    if "quiz_questions" not in request.session:
        request.session["quiz_questions"] = []
    if "current_position" not in request.session:
        request.session["current_position"] = -1  # Start before first question
    request.session.modified = True

    # Check if quiz is complete (5 questions answered)
    if (
        len(request.session["quiz_questions"]) >= 5
        and request.session["current_position"] >= 4
    ):
        request.session.flush()
        return JsonResponse(
            {
                "complete": True,
                "score": "100%",
                "message": (
                    "You scored 100% because being willing to try "
                    "makes you a coder"
                ),
            }
        )

    # Handle POST requests (next/back navigation)
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            action = data.get("action", "next")

            if action == "back":
                # Move back in the question history
                if request.session["current_position"] > 0:
                    request.session["current_position"] -= 1
                current_question = request.session["quiz_questions"][
                    request.session["current_position"]
                ]
                return JsonResponse(
                    {
                        "question": current_question["question"],
                        "answers": current_question["answers"],
                        "current": request.session["current_position"] + 1,
                        "total": 5,
                        "complete": False,
                    }
                )
            else:
                # Handle next action
                if (
                    request.session["current_position"]
                    < len(request.session["quiz_questions"]) - 1
                ):
                    # Reuse existing question
                    request.session["current_position"] += 1
                    current_question = request.session["quiz_questions"][
                        request.session["current_position"]
                    ]
                else:
                    # Don't generate new question if we've reached the limit
                    if len(request.session["quiz_questions"]) >= 5:
                        request.session.flush()
                        return JsonResponse(
                            {
                                "complete": True,
                                "score": "100%",
                                "message": "You scored 100% because being "
                                "willing to try makes you a coder",
                            }
                        )

                    # Generate new question
                    used_questions = [
                        q["question"]
                        for q in request.session["quiz_questions"]
                    ]
                    question = gen_quiz_question(used_questions)
                    request.session["quiz_questions"].append(question)
                    request.session["current_position"] = (
                        len(request.session["quiz_questions"]) - 1
                    )

                request.session.modified = True
                return JsonResponse(
                    {
                        "question": request.session["quiz_questions"][
                            request.session["current_position"]
                        ]["question"],
                        "answers": request.session["quiz_questions"][
                            request.session["current_position"]
                        ]["answers"],
                        "current": request.session["current_position"] + 1,
                        "total": 5,
                        "complete": False,
                    }
                )

        except Exception as e:
            print(f"Error handling POST request: {str(e)}")
            return JsonResponse({"error": str(e)}, status=400)

    # Handle GET request (initial load)
    if request.session["current_position"] >= 0:
        # Return current question
        current_question = request.session["quiz_questions"][
            request.session["current_position"]
        ]
        return JsonResponse(
            {
                "question": current_question["question"],
                "answers": current_question["answers"],
                "current": request.session["current_position"] + 1,
                "total": 5,
                "complete": False,
            }
        )
    else:
        # Generate first question
        question = gen_quiz_question([])
        request.session["quiz_questions"].append(question)
        request.session["current_position"] = 0
        request.session.modified = True
        return JsonResponse(
            {
                "question": question["question"],
                "answers": question["answers"],
                "current": 1,
                "total": 5,
                "complete": False,
            }
        )
