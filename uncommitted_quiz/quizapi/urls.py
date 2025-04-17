from django.contrib import admin
from django.urls import path
from quizapi.views import get_quiz_questions

urlpatterns = [
    path('quiz/', get_quiz_questions, name='get_quiz_questions'),
]