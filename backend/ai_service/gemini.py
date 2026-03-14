import json
import logging
from groq import Groq
from django.conf import settings

logger = logging.getLogger(__name__)


def generate_quiz_questions(topic: str, difficulty: str, num_questions: int) -> list:
    """
    Calls the Groq API (Llama 3.3 70B) to generate MCQ quiz questions.
    Returns a list of question dicts.
    """
    client = Groq(api_key=settings.GROQ_API_KEY)

    difficulty_desc = {
        "easy": "simple recall and basic definitions",
        "medium": "conceptual understanding and application",
        "hard": "deep analysis, edge cases, and advanced reasoning",
    }.get(difficulty, "conceptual understanding")

    prompt = f"""Generate exactly {num_questions} multiple-choice quiz questions about "{topic}" at a {difficulty} difficulty level ({difficulty_desc}).

Return ONLY a valid JSON array with no extra text, no markdown, no code fences. Use this exact format:
[
  {{
    "question_text": "Your question here?",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option",
    "correct_option": "A",
    "explanation": "Brief explanation of why this is correct."
  }}
]

Rules:
- correct_option must be exactly one of: "A", "B", "C", "D"
- All 4 options must be plausible and well-written
- Questions should vary in style
- Return ONLY the JSON array, absolutely nothing else"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a quiz generator. You only output valid JSON arrays. Never include markdown, explanations, or any text outside the JSON array."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=4096,
        )

        text = response.choices[0].message.content.strip()

        # Strip markdown code fences if present
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1])

        questions = json.loads(text)
        if not isinstance(questions, list):
            raise ValueError("Response was not a JSON list")

        return questions

    except json.JSONDecodeError as e:
        logger.error(f"Groq JSON parse error: {e}\nRaw response: {text}")
        raise RuntimeError(f"AI returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        raise RuntimeError(f"AI question generation failed: {str(e)}")
