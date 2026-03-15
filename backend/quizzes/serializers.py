from rest_framework import serializers
from .models import Quiz, Question, QuizSchedule


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = (
            'id',
            'question_text',
            'option_a',
            'option_b',
            'option_c',
            'option_d',
            'correct_option',
            'explanation',
            'order',
        )


class QuestionForAttemptSerializer(serializers.ModelSerializer):
    """Hides the correct answer and explanation during quiz-taking."""

    class Meta:
        model = Question
        fields = (
            'id',
            'question_text',
            'option_a',
            'option_b',
            'option_c',
            'option_d',
            'order',
        )


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionForAttemptSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()
    teacher_name = serializers.CharField(
        source='user.first_name', default='Teacher', read_only=True
    )

    class Meta:
        model = Quiz
        fields = (
            'id',
            'topic',
            'difficulty',
            'num_questions',
            'is_public',
            'created_at',
            'questions',
            'question_count',
            'teacher_name',
        )
        read_only_fields = ('created_at',)

    def get_question_count(self, obj):
        return obj.questions.count()


class QuizCreateSerializer(serializers.Serializer):
    topic = serializers.CharField(max_length=255)
    difficulty = serializers.ChoiceField(
        choices=['easy', 'medium', 'hard'], default='medium'
    )
    num_questions = serializers.IntegerField(
        min_value=3, max_value=20, default=5
    )
    is_public = serializers.BooleanField(default=False)


class QuizScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizSchedule
        fields = (
            'id',
            'topic',
            'difficulty',
            'frequency',
            'created_at',
            'is_active',
            'last_sent_at',
        )
        read_only_fields = ('created_at', 'last_sent_at')
