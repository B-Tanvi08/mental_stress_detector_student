This project is a full-stack web application that focuses on understanding and monitoring student mental stress. It takes inputs like academic pressure, sleep habits, and financial stress, and uses a trained machine learning model to calculate a stress score.
Based on this score, the system classifies stress levels and gives useful suggestions to help manage it. It also stores previous records, allowing users to track how their stress changes over time and see trends.
The application includes a simple and interactive dashboard, along with basic support features like coping suggestions and guidance for seeking help when needed.

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

How to Run:

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
      
  
  
