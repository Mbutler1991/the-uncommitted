from openai import OpenAI
import json
import os
from dotenv import load_dotenv
import re

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

Prompt = """
Generate a unique coding-related multiple-choice question with the following requirements:
1. The question should be related to web development, with a focus on Python, Django, Javascript, HTML, and CSS.
2. The question should be beginner-friendly, and clear in its wording.
3. The question should have exactly 4 options (A, B, C, D), all of which are plausible.
4. Each answer should be correct, so it’s impossible to get it wrong.
5. The question and answers must be returned in a JSON format, like this:
{
  "question": "What does HTML stand for?",
  "answers": [
    "Hyper Text Markup Language",
    "Home Tool Markup Language",
    "Hyper Trainer Marking Language",
    "Hyper Text Markup Logic"
  ]
}
Make sure the answers are distinct and relevant to the question.
"""


client = OpenAI(api_key=OPENAI_API_KEY)


def gen_quiz_question():
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": Prompt},
        ],
        temperature=0.7,
    )
    content = response.choices[0].message.content

    content = re.sub(r"^```(?:json)?|```$", "", content.strip(), flags=re.MULTILINE).strip()

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {
            "question": "You're awesome and capable!",
            "answers": ["Keep it up!", "You're doing great!", "Believe in yourself!", "You're amazing!"]
        }
    