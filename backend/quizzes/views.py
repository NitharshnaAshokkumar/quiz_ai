from django.db import models
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Quiz, Question, QuizSchedule
from .serializers import (
    QuizSerializer,
    QuizCreateSerializer,
    QuestionSerializer,
    QuizScheduleSerializer,
)
from ai_service.gemini import generate_quiz_questions
from attempts.models import Attempt
from attempts.serializers import AttemptSerializer


class QuizListView(generics.ListAPIView):
    """Lists all quizzes belonging to the logged-in user."""

    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Quiz.objects.filter(user=self.request.user).order_by('-created_at')


class QuizDetailView(generics.RetrieveAPIView):
    """Retrieves a single quiz (with questions, answers hidden). Allows public access if is_public=True."""

    serializer_class = QuizSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Quiz.objects.filter(
                models.Q(user=self.request.user) | models.Q(is_public=True)
            ).distinct()
        return Quiz.objects.filter(is_public=True)


class QuizCreateView(APIView):
    """Generates a new AI-powered quiz and saves it to the database."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = QuizCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        topic = serializer.validated_data['topic']
        difficulty = serializer.validated_data['difficulty']
        num_questions = serializer.validated_data['num_questions']
        is_public = serializer.validated_data.get('is_public', False)

        try:
            raw_questions = generate_quiz_questions(topic, difficulty, num_questions)
        except RuntimeError as e:
            return Response(
                {'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Save quiz and questions to DB
        quiz = Quiz.objects.create(
            user=request.user,
            topic=topic,
            difficulty=difficulty,
            num_questions=num_questions,
            is_public=is_public,
        )
        for i, q in enumerate(raw_questions):
            Question.objects.create(
                quiz=quiz,
                question_text=q.get('question_text', ''),
                option_a=q.get('option_a', ''),
                option_b=q.get('option_b', ''),
                option_c=q.get('option_c', ''),
                option_d=q.get('option_d', ''),
                correct_option=q.get('correct_option', 'A').upper(),
                explanation=q.get('explanation', ''),
                order=i + 1,
            )

        return Response(QuizSerializer(quiz).data, status=status.HTTP_201_CREATED)


class QuizReviewView(generics.RetrieveAPIView):
    """Retrieves a quiz WITH correct answers (for post-attempt review)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            # Only allow looking up answers if they created the quiz or if they have a completed attempt for this public quiz
            quiz = Quiz.objects.filter(
                models.Q(user=request.user) | models.Q(is_public=True)
            ).get(pk=pk)
        except Quiz.DoesNotExist:
            return Response(
                {'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND
            )

        questions = QuestionSerializer(quiz.questions.all(), many=True).data
        return Response(
            {
                'id': quiz.id,
                'topic': quiz.topic,
                'difficulty': quiz.difficulty,
                'questions': questions,
            }
        )


class QuizLeaderboardView(generics.ListAPIView):
    """Retrieves the top 10 attempts for a specific quiz ID."""

    serializer_class = AttemptSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        quiz_id = self.kwargs['pk']
        # Return top 10 attempts for this quiz, ordered by highest percentage, then lowest time taken
        return Attempt.objects.filter(
            quiz_id=quiz_id,
            is_completed=True,
        ).order_by('-percentage', 'time_taken')[:10]


class QuizScheduleListCreateView(generics.ListCreateAPIView):
    """List existing schedules for the user or create a new one."""

    serializer_class = QuizScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return QuizSchedule.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class QuizScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a single schedule."""

    serializer_class = QuizScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return QuizSchedule.objects.filter(user=self.request.user)
