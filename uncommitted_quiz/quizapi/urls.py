from django.contrib import admin
from django.urls import path
from quizapi.views import get_quiz_questions, index
from django.conf import settings

urlpatterns = [
    path('', index, name='index'),
    path('api/quiz/', get_quiz_questions, name='index'),
]