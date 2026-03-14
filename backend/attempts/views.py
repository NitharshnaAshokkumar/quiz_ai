from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import Attempt, UserAnswer
from .serializers import AttemptSerializer, AttemptDetailSerializer, UserAnswerSubmitSerializer
from quizzes.models import Quiz, Question


class AttemptStartView(APIView):
    """Creates a new attempt for a given quiz."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, quiz_id):
        try:
            quiz = Quiz.objects.filter(user=request.user).get(pk=quiz_id)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)

        attempt = Attempt.objects.create(
            user=request.user,
            quiz=quiz,
            total_questions=quiz.questions.count(),
        )
        return Response({'attempt_id': attempt.id, 'quiz_id': quiz.id}, status=status.HTTP_201_CREATED)


class AttemptSubmitView(APIView):
    """Submits answers for an attempt, scores it, and marks it complete."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, attempt_id):
        try:
            attempt = Attempt.objects.filter(user=request.user, is_completed=False).get(pk=attempt_id)
        except Attempt.DoesNotExist:
            return Response({'error': 'Attempt not found or already completed'}, status=status.HTTP_404_NOT_FOUND)

        answers_data = request.data.get('answers', [])
        time_taken = request.data.get('time_taken', 0)

        serializer = UserAnswerSubmitSerializer(data=answers_data, many=True)
        serializer.is_valid(raise_exception=True)

        score = 0
        for answer in serializer.validated_data:
            try:
                question = Question.objects.get(pk=answer['question_id'], quiz=attempt.quiz)
            except Question.DoesNotExist:
                continue
            is_correct = question.correct_option == answer['selected_option']
            if is_correct:
                score += 1
            UserAnswer.objects.create(
                attempt=attempt,
                question=question,
                selected_option=answer['selected_option'],
                is_correct=is_correct,
            )

        total = attempt.total_questions
        percentage = (score / total * 100) if total > 0 else 0.0

        attempt.score = score
        attempt.percentage = round(percentage, 2)
        attempt.time_taken = time_taken
        attempt.is_completed = True
        attempt.completed_at = timezone.now()
        attempt.save()

        return Response(AttemptSerializer(attempt).data, status=status.HTTP_200_OK)


class AttemptHistoryView(generics.ListAPIView):
    """Returns all completed attempts for the logged-in user."""
    serializer_class = AttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Attempt.objects.filter(user=self.request.user, is_completed=True)


class AttemptDetailView(generics.RetrieveAPIView):
    """Returns full detail of a completed attempt including all answers."""
    serializer_class = AttemptDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Attempt.objects.filter(user=self.request.user)
