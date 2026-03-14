from django.urls import path
from .views import QuizListView, QuizDetailView, QuizCreateView, QuizReviewView

urlpatterns = [
    path('', QuizListView.as_view(), name='quiz-list'),
    path('create/', QuizCreateView.as_view(), name='quiz-create'),
    path('<int:pk>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('<int:pk>/review/', QuizReviewView.as_view(), name='quiz-review'),
]
