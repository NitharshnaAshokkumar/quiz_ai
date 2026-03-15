from django.contrib import admin
from .models import Quiz, Question


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    fields = ('order', 'question_text', 'correct_option', 'option_a', 'option_b', 'option_c', 'option_d')


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('id', 'topic', 'difficulty', 'num_questions', 'user', 'created_at')
    list_filter = ('difficulty', 'created_at')
    search_fields = ('topic', 'user__username')
    ordering = ('-created_at',)
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'quiz', 'order', 'question_text', 'correct_option')
    list_filter = ('quiz__difficulty',)
    search_fields = ('question_text', 'quiz__topic')
    ordering = ('quiz', 'order')
