from django.contrib import admin
from django.urls import path
from quizapi.views import get_quiz_questions, index, quiz
from django.conf import settings

urlpatterns = [
    path('', index, name='index'),
    path('quiz/', quiz, name='quiz'),
    path('api/quiz/', get_quiz_questions, name='get_quiz_questions'),
]