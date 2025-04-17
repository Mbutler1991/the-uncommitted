import openai
import os
import json

Prompt = """
Generate a coding related question with the following requirements:
1. The question should be a multiple choice question with 4 options.
2. The question should be related to Python, Django, Javascript, HTML and CSS programming.
3. The question should be suitable for a beginner level audience.
4. The question should be clear and concise.
5. All answers should be correct so it is impossible to get it wrong
6. The question should be in English.
7. The question should be in a JSON  format like this:
{
"question": "...",
"answers": ["...", "...", "...", "..."]}
"""

openai.api_key = os.getenv("OPENAI_API_KEY")

def gen_quiz_question():
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": Prompt},
        temperature=0.7,
        ]
    )
    question = response.choices[0].message['content']
    try:
        return json.loads(question)
    except json.JSONDecodeError:
        return {
            "question": "You're awesome and capable!",
            "answers": ["Keep it up!", "You're doing great!", "Believe in yourself!", "You're amazing!"]
        }
    