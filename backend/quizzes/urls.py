from django.urls import path
from .views import QuizListView, QuizDetailView, QuizCreateView, QuizReviewView, QuizLeaderboardView
from . import views

urlpatterns = [
    path('', views.QuizListView.as_view(), name='quiz-list'),
    path('create/', views.QuizCreateView.as_view(), name='quiz-create'),
    path('<int:pk>/', views.QuizDetailView.as_view(), name='quiz-detail'),
    path('<int:pk>/review/', views.QuizReviewView.as_view(), name='quiz-review'),
    path('<int:pk>/leaderboard/', views.QuizLeaderboardView.as_view(), name='quiz-leaderboard'),
    path('schedules/', views.QuizScheduleListCreateView.as_view(), name='schedule-list'),
    path('schedules/<int:pk>/', views.QuizScheduleDetailView.as_view(), name='schedule-detail'),
]
