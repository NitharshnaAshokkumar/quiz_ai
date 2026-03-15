from django.db import models
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
            quiz = Quiz.objects.filter(models.Q(user=request.user) | models.Q(is_public=True)).get(pk=quiz_id)
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

        # Try to send the quiz result email synchronously
        try:
            print("--- ATTEMPTING TO SEND EMAIL ---")
            from .emails import send_quiz_result_email
            send_quiz_result_email(attempt)
            print("--- EMAIL SUCCESSFULLY SENT ---")
        except Exception as e:
            import traceback
            print(f"--- FAILED TO SEND EMAIL: {e} ---")
            traceback.print_exc()

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


class AttemptStatsView(APIView):
    """Returns analytics data for the user's progress."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        attempts = Attempt.objects.filter(user=request.user, is_completed=True).order_by('completed_at')
        
        # Calculate stats
        total_quizzes = attempts.count()
        if total_quizzes == 0:
            return Response({
                'total_quizzes': 0,
                'average_score': 0,
                'history': [],
                'topics': {}
            })
            
        average_score = sum(a.percentage for a in attempts) / total_quizzes
        
        # Prepare charts data
        history_data = []
        topics_data = {}
        
        for a in attempts:
            history_data.append({
                'date': a.completed_at.strftime("%Y-%m-%d"),
                'percentage': a.percentage,
                'topic': a.quiz.topic
            })
            
            topic = a.quiz.topic
            if topic not in topics_data:
                topics_data[topic] = {'attempts': 0, 'total_percentage': 0}
            topics_data[topic]['attempts'] += 1
            topics_data[topic]['total_percentage'] += a.percentage
            
        # Format topic radar chart data
        radar_data = []
        for topic, data in topics_data.items():
            radar_data.append({
                'topic': topic,
                'average': round(data['total_percentage'] / data['attempts'], 2)
            })
            
        return Response({
            'total_quizzes': total_quizzes,
            'average_score': round(average_score, 2),
            'history': history_data[-20:], # Last 20 attempts for line chart
            'topics': radar_data
        })
