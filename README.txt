SMARTCAMPUS - AI STUDENT ASSISTANT

WHAT IS INCLUDED
- Responsive student dashboard
- College selection dropdown
- Chat interface connected to Google Gemini through a Flask backend
- Student services quick prompts
- Browser voice input (where supported)
- English, Kannada and Hindi language selection UI

IMPORTANT
- The Gemini API key belongs in the backend environment, never in JavaScript or HTML.
- The assistant does not have verified college records or live campus data. Check important
  information with an official college source.

RUN LOCALLY
1. Install Python 3.10 or newer.
2. From this folder, run: python -m venv .venv
3. Activate the environment and run: pip install -r requirements.txt
4. Set GEMINI_API_KEY in your terminal environment.
5. Run: python app.py
6. Open http://127.0.0.1:5000

RENDER DEPLOYMENT
1. Push this project to GitHub. The .gitignore file excludes the local virtual environment.
2. In Render, create a new Web Service and connect the GitHub repository.
3. Set the build command to: pip install -r requirements.txt
4. Set the start command to: gunicorn app:app
5. Add GEMINI_API_KEY in the Render service's Environment settings. Never commit the key.
6. Optionally set GEMINI_MODEL (defaults to gemini-2.5-flash), then deploy.
7. Open the Render service URL and test the chat.
