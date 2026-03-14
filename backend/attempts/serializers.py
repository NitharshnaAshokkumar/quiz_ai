from rest_framework import serializers
from .models import Attempt, UserAnswer
from quizzes.serializers import QuizSerializer


class UserAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAnswer
        fields = ('id', 'question', 'selected_option', 'is_correct')


class UserAnswerSubmitSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_option = serializers.ChoiceField(choices=['A', 'B', 'C', 'D'])


class AttemptSerializer(serializers.ModelSerializer):
    quiz_topic = serializers.CharField(source='quiz.topic', read_only=True)
    quiz_difficulty = serializers.CharField(source='quiz.difficulty', read_only=True)

    class Meta:
        model = Attempt
        fields = (
            'id', 'quiz', 'quiz_topic', 'quiz_difficulty',
            'score', 'total_questions', 'percentage',
            'time_taken', 'started_at', 'completed_at', 'is_completed'
        )


class AttemptDetailSerializer(serializers.ModelSerializer):
    answers = UserAnswerSerializer(many=True, read_only=True)
    quiz_topic = serializers.CharField(source='quiz.topic', read_only=True)

    class Meta:
        model = Attempt
        fields = (
            'id', 'quiz', 'quiz_topic',
            'score', 'total_questions', 'percentage',
            'time_taken', 'started_at', 'completed_at', 'is_completed',
            'answers'
        )
