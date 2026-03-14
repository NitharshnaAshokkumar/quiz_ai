from django.db import models
from django.conf import settings
from quizzes.models import Quiz, Question


class Attempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    score = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    percentage = models.FloatField(default=0.0)
    time_taken = models.IntegerField(default=0, help_text="Time in seconds")
    completed_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    is_completed = models.BooleanField(default=False)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user.email} - {self.quiz.topic} - {self.percentage:.1f}%"


class UserAnswer(models.Model):
    attempt = models.ForeignKey(Attempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='user_answers')
    selected_option = models.CharField(max_length=1, choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')])
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"Q{self.question.order}: {self.selected_option} ({'✓' if self.is_correct else '✗'})"
