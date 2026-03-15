from django.core.mail import EmailMultiAlternatives
from django.conf import settings


def send_quiz_result_email(attempt):
    subject = f"Your Quiz.AI Results: {attempt.quiz.topic}"
    from_email = settings.DEFAULT_FROM_EMAIL or 'noreply@quizai.com'
    to_email = attempt.user.email
    
    if not to_email:
        return
        
    color = "#10b981" if attempt.percentage >= 70 else ("#f59e0b" if attempt.percentage >= 40 else "#ef4444")
        
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #8b5cf6; text-align: center;">Quiz.AI Results Review</h2>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;">
            <h3 style="margin-top: 0; color: #1e293b; font-size: 20px;">Topic: {attempt.quiz.topic}</h3>
            <p style="font-size: 28px; font-weight: bold; color: {color}; margin: 15px 0;">
                Score: {attempt.score} / {attempt.total_questions} ({attempt.percentage}%)
            </p>
            <p style="color: #64748b; margin: 0;">Time taken: {attempt.time_taken} seconds</p>
        </div>
        
        <h3 style="color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Detailed Review:</h3>
    """
    
    for idx, answer in enumerate(attempt.answers.all().order_by('question__order')):
        q = answer.question
        is_correct = answer.is_correct
        mark = "✅ Correct" if is_correct else "❌ Incorrect"
        color_mark = "#10b981" if is_correct else "#ef4444"
        bg_color = "#f0fdf4" if is_correct else "#fef2f2"
        
        html_content += f"""
        <div style="background-color: {bg_color}; border-left: 4px solid {color_mark}; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
            <p style="margin-top: 0;"><strong>Q{idx + 1}: {q.question_text}</strong></p>
            <p style="margin: 8px 0;">Your Answer: Option {answer.selected_option} - <span style="color: {color_mark}; font-weight: bold;">{mark}</span></p>
        """
        if not is_correct:
            correct_text = getattr(q, f"option_{q.correct_option.lower()}")
            html_content += f"""<p style="margin: 8px 0;">Correct Answer: <strong>Option {q.correct_option} ({correct_text})</strong></p>"""
            
        if q.explanation:
            html_content += f"""<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.05); font-size: 14px; color: #475569;">
                <i><strong>Explanation:</strong> {q.explanation}</i>
            </div>"""
            
        html_content += "</div>"
        
    html_content += """
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="text-align: center; color: #94a3b8; font-size: 12px;">This is an automated message from Quiz.AI.</p>
        <p style="text-align: center; margin-top: 20px;">
            <a href="http://localhost:3000/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">View Full History</a>
        </p>
      </body>
    </html>
    """
    
    text_lines = [
        f"Quiz.AI Results for {attempt.quiz.topic}",
        "",
        f"Score: {attempt.score}/{attempt.total_questions} ({attempt.percentage}%)",
        f"Time taken: {attempt.time_taken} seconds",
        "",
        "Detailed review:",
    ]
    for idx, answer in enumerate(attempt.answers.all().order_by('question__order')):
        q = answer.question
        correct_text = getattr(q, f"option_{q.correct_option.lower()}")
        text_lines.append(
            f"Q{idx + 1}: {q.question_text}\n"
            f"  Your answer: {answer.selected_option}\n"
            f"  Correct answer: {q.correct_option} ({correct_text})\n"
            f"  Result: {'Correct' if answer.is_correct else 'Incorrect'}\n"
        )
    text_content = "\n".join(text_lines)

    msg = EmailMultiAlternatives(subject, text_content, from_email, [to_email])
    msg.attach_alternative(html_content, "text/html")
    # Don't fail silently so SMTP problems show up during debugging
    msg.send(fail_silently=False)
