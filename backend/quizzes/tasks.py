from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from .models import QuizSchedule, Quiz, Question
from ai_service.gemini_service import generate_quiz
import json

@shared_task
def send_scheduled_quizzes():
    now = timezone.now()
    schedules = QuizSchedule.objects.filter(is_active=True)

    for schedule in schedules:
        is_due = False
        if not schedule.last_sent_at:
            is_due = True
        else:
            time_since_last = now - schedule.last_sent_at
            if schedule.frequency == 'daily' and time_since_last >= timedelta(days=1):
                is_due = True
            elif schedule.frequency == 'weekly' and time_since_last >= timedelta(weeks=1):
                is_due = True

        if is_due:
            # Generate quiz
            try:
                raw_response = generate_quiz(schedule.topic, schedule.difficulty, 5) # Default to 5 questions
                data = json.loads(raw_response)
                questions_data = data.get('questions', [])
                if not questions_data:
                    continue

                quiz = Quiz.objects.create(
                    topic=schedule.topic,
                    difficulty=schedule.difficulty,
                    num_questions=len(questions_data),
                    is_public=False  # Scheduled quizzes are private by default
                )

                for q_data in questions_data:
                    Question.objects.create(
                        quiz=quiz,
                        question_text=q_data['question_text'],
                        option_a=q_data['option_a'],
                        option_b=q_data['option_b'],
                        option_c=q_data['option_c'],
                        option_d=q_data['option_d'],
                        correct_option=q_data['correct_option'],
                        explanation=q_data.get('explanation', '')
                    )

                # Send email
                title = f"Your {schedule.frequency.capitalize()} Quiz on {schedule.topic} is Ready!"
                body = f"Hi {schedule.user.username},\n\nYour scheduled quiz on {schedule.topic} is ready.\n\nTake it now: http://localhost:3000/quiz/{quiz.id}\n\nHappy learning!\nAI Quiz App"
                
                send_mail(
                    title,
                    body,
                    settings.EMAIL_HOST_USER,
                    [schedule.user.email],
                    fail_silently=True,
                )

                # Update schedule
                schedule.last_sent_at = now
                schedule.save()
            except Exception as e:
                print(f"Error processing schedule {schedule.id}: {e}")
