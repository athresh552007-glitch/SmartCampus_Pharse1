import os
import time
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from google import genai
from google.genai import errors, types
from werkzeug.exceptions import HTTPException

BASE_DIR = Path(__file__).resolve().parent
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024


@app.errorhandler(HTTPException)
def handle_http_error(error):
    if request.path.startswith("/api/"):
        return jsonify(error=error.description), error.code
    return error


@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/css/<path:filename>")
def css_files(filename):
    return send_from_directory(BASE_DIR / "css", filename)


@app.get("/js/<path:filename>")
def javascript_files(filename):
    return send_from_directory(BASE_DIR / "js", filename)


@app.post("/api/chat")
def chat():
    if not request.is_json:
        return jsonify(error="Content-Type must be application/json."), 415

    payload = request.get_json()
    if not isinstance(payload, dict):
        return jsonify(error="Request body must be a JSON object."), 400

    question = payload.get("question")
    if not isinstance(question, str) or not question.strip():
        return jsonify(error="Enter a question to continue."), 400
    question = question.strip()
    if len(question) > 4000:
        return jsonify(error="Your question is too long. Please keep it under 4,000 characters."), 400

    college = payload.get("college", "")
    allowed_colleges = {"", "Sapthagiri NPS University", "Other college"}
    if not isinstance(college, str) or college not in allowed_colleges:
        return jsonify(error="Choose a college from the list."), 400

    language = payload.get("language", "en-IN")
    language_names = {
        "en-IN": "English",
        "kn-IN": "Kannada",
        "hi-IN": "Hindi",
    }
    if language not in language_names:
        return jsonify(error="Choose English, Kannada, or Hindi."), 400

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        app.logger.error("GEMINI_API_KEY is not configured.")
        return jsonify(error="The assistant is not configured yet. Please try again later."), 503

    college_context = f" The selected college is {college.strip()}." if college.strip() else ""
    system_prompt = (
        "You are SmartCampus, a helpful student assistant. "
        f"Reply in {language_names[language]}.{college_context} "
        "Do not claim access to live college records or present institution-specific policies, "
        "dates, or requirements as verified unless that information is supplied in the conversation. "
        "When you do not have verified information, say so and direct the student to an official "
        "college source. Keep the answer clear and concise."
    )

    try:
        for attempt in range(3):
            try:
                with genai.Client(api_key=api_key) as client:
                    response = client.models.generate_content(
                        model=os.environ.get("GEMINI_MODEL", "gemini-3.8-flash"),
                        contents=question,
                        config=types.GenerateContentConfig(
                            system_instruction=system_prompt,
                            max_output_tokens=500,
                        ),
                    )
                break
            except errors.APIError as error:
                if error.code != 503 or attempt == 2:
                    raise
                time.sleep(2**attempt)
    except errors.APIError:
        app.logger.exception("Gemini chat request failed.")
        return jsonify(error="The assistant could not respond right now. Please try again."), 502

    answer = response.text
    if not answer or not answer.strip():
        app.logger.error("Gemini returned an empty chat response.")
        return jsonify(error="The assistant returned an empty response. Please try again."), 502

    return jsonify(answer=answer.strip())


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")))
