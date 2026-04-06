Student Mental Stress Detector

Description

This project is a full-stack web application designed to help detect and monitor student stress levels using machine learning. It takes inputs such as academic pressure, sleep duration, financial stress, and study satisfaction, and processes them through a trained model to generate a stress score ranging from 0 to 100. Based on this score, the system categorizes the stress level and provides simple, practical suggestions to help manage it.

The goal of this project is to create an easy-to-use tool that helps students become more aware of their mental well-being and take small steps toward improving it.

⸻

Features

	•	Machine learning-based stress prediction
	•	Stress score calculation with risk classification
	•	Personalized suggestions based on user inputs
	•	History tracking to monitor stress over time
	•	Basic trend visualization for better insights
	•	Clean and simple user interface

⸻


Tech Stack

	•	Frontend: React (Vite)
	•	Backend: Flask (Python)
	•	Machine Learning: Scikit-learn
	•	Database: MySQL / SQLite
⸻

How to run
- Clone the repository

- Create a virtual environment:
  python3 -m venv venv
  source venv/bin/activate

- Install dependencies:
  pip install -r requirements.txt

- Train the model:
  python scripts/train_model.py

- Run the backend:
  python app/app.py

- Start the frontend:
  npm install
  npm run dev

- Open in browser:
  http://localhost:3000
