from django.contrib import admin
from .models import Attempt, UserAnswer


class UserAnswerInline(admin.TabularInline):
    model = UserAnswer
    extra = 0
    fields = ('question', 'selected_option', 'is_correct')
    readonly_fields = ('is_correct',)


@admin.register(Attempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'quiz', 'score', 'total_questions', 'percentage', 'time_taken', 'is_completed', 'started_at')
    list_filter = ('is_completed', 'started_at')
    search_fields = ('user__username', 'quiz__topic')
    ordering = ('-started_at',)
    inlines = [UserAnswerInline]


@admin.register(UserAnswer)
class UserAnswerAdmin(admin.ModelAdmin):
    list_display = ('id', 'attempt', 'question', 'selected_option', 'is_correct')
    list_filter = ('is_correct',)
