from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Quiz, Question
from .serializers import QuizSerializer, QuizCreateSerializer, QuestionSerializer
from ai_service.gemini import generate_quiz_questions


class QuizListView(generics.ListAPIView):
    """Lists all quizzes belonging to the logged-in user."""
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Quiz.objects.filter(user=self.request.user)


class QuizDetailView(generics.RetrieveAPIView):
    """Retrieves a single quiz (with questions, answers hidden)."""
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Quiz.objects.filter(user=self.request.user)


class QuizCreateView(APIView):
    """Generates a new AI-powered quiz and saves it to the database."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = QuizCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        topic = serializer.validated_data['topic']
        difficulty = serializer.validated_data['difficulty']
        num_questions = serializer.validated_data['num_questions']

        try:
            raw_questions = generate_quiz_questions(topic, difficulty, num_questions)
        except RuntimeError as e:
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Save quiz and questions to DB
        quiz = Quiz.objects.create(
            user=request.user,
            topic=topic,
            difficulty=difficulty,
            num_questions=num_questions,
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
            quiz = Quiz.objects.filter(user=request.user).get(pk=pk)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)

        questions = QuestionSerializer(quiz.questions.all(), many=True).data
        return Response({'id': quiz.id, 'topic': quiz.topic, 'difficulty': quiz.difficulty, 'questions': questions})
