from django.urls import path
from quizapi.views import get_quiz_questions, quiz_view, end_view

urlpatterns = [
    path('', quiz_view, name='quiz'),  # /quiz/
    path('api/', get_quiz_questions, name='quiz_api'),  # /quiz/api/
    path('end/', end_view, name='quiz_end'),  # /quiz/end/
]