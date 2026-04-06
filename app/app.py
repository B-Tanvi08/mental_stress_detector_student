import os
import sqlite3
import pickle
import numpy as np
import nltk
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

# Download NLTK data
nltk.download('punkt')
nltk.download('wordnet')
nltk.download('omw-1.4')

app = Flask(__name__)
CORS(app)

# Paths
MODEL_PATH = os.path.join("models", "model.pkl")
DB_PATH = os.path.join("database", "stress_detector.db")

# Initialize Lemmatizer
lemmatizer = WordNetLemmatizer()

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def get_nltk_response(message):
    """
    Simplified NLP Chatbot using NLTK Tokenization and Lemmatization.
    """
    # 1. Tokenization
    tokens = word_tokenize(message.lower())
    
    # 2. Lemmatization (reducing words to their base form)
    lemmas = [lemmatizer.lemmatize(token) for token in tokens]
    
    # 3. Rule-based Response Logic
    slogans = [
        "Every cloud has a silver lining.",
        "This too shall pass.",
        "You are stronger than you think.",
        "Small steps still move you forward.",
        "It's okay to take a pause."
    ]
    import random
    slogan = random.choice(slogans)

    responses = {
        "sad": f"I'm sorry you're feeling this way. Remember: '{slogan}' To feel better, try: 1. Taking deep breaths, 2. Going for a short walk, 3. Eating a nourishing meal, or 4. Calling a close friend. If things feel too heavy, please reach out to a professional.",
        "unhappy": f"I'm sorry you're feeling this way. Remember: '{slogan}' To feel better, try: 1. Taking deep breaths, 2. Going for a short walk, 3. Eating a nourishing meal, or 4. Calling a close friend. If things feel too heavy, please reach out to a professional.",
        "depressed": f"I'm sorry you're feeling this way. Remember: '{slogan}' To feel better, try: 1. Taking deep breaths, 2. Going for a short walk, 3. Eating a nourishing meal, or 4. Calling a close friend. If things feel too heavy, please reach out to a professional.",
        "happy": "That's wonderful to hear! To keep this positive energy going: 1. Practice gratitude by writing down three things you're thankful for, 2. Share your joy with someone else, or 3. Treat yourself to something you love. Keep shining!",
        "good": "That's wonderful to hear! To keep this positive energy going: 1. Practice gratitude by writing down three things you're thankful for, 2. Share your joy with someone else, or 3. Treat yourself to something you love. Keep shining!",
        "stress": "It sounds like you're under a lot of pressure. 'One step at a time is enough.' Try: 1. Breaking your tasks into small pieces, 2. A 5-minute meditation, or 3. Stepping away from your screen for a bit. You've got this!",
        "pressure": "It sounds like you're under a lot of pressure. 'One step at a time is enough.' Try: 1. Breaking your tasks into small pieces, 2. A 5-minute meditation, or 3. Stepping away from your screen for a bit. You've got this!",
        "sleep": "Rest is crucial for your brain. Try to keep a consistent sleep schedule, avoid screens before bed, and maybe try some chamomile tea. Your body needs to recharge!",
        "help": "If you're in immediate distress, please call the emergency helpline at 1800-599-0019. You're not alone, and there are people who want to support you.",
        "hello": "Hello! I'm your mental wellness assistant. How are you feeling today?"
    }
    
    for key in responses:
        if key in lemmas:
            return responses[key]
            
    return "I'm here to listen. Could you tell me more about that?"

# Initialize Database
def init_db():
    if not os.path.exists("database"):
        os.makedirs("database")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                user_name TEXT,
                date TEXT,
                academic_pressure INTEGER,
                study_satisfaction INTEGER,
                sleep_duration INTEGER,
                dietary_habits TEXT,
                financial_stress INTEGER,
                family_history TEXT,
                stress_score REAL,
                prediction TEXT
            )
        ''')
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error initializing SQLite: {e}")

init_db()

# Load Model
def load_model():
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            return pickle.dump(f)
    return None

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    user_id = data.get('userId', 'default_user')
    user_name = data.get('userName', 'Guest')
    
    # Extract features
    academic_pressure = int(data.get('academicPressure', 3))
    study_satisfaction = int(data.get('studySatisfaction', 3))
    sleep_duration = int(data.get('sleepDuration', 7))
    dietary_habits = data.get('dietaryHabits', 'Moderate')
    financial_stress = int(data.get('financialStress', 3))
    family_history = data.get('familyHistory', 'No')

    # Heuristic Stress Score Calculation (0-100)
    stress_score = (academic_pressure * 15) + ((5 - study_satisfaction) * 15) + (financial_stress * 10)
    if sleep_duration < 6: stress_score += 20
    stress_score = min(max(stress_score, 0), 100)

    # Risk Level
    risk_level = "Low"
    if stress_score > 70: risk_level = "High"
    elif stress_score > 40: risk_level = "Medium"

    # Prediction (Simulated if model.pkl not found)
    prediction = "Yes" if stress_score > 65 else "No"

    # 3. Save to DB
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO attempts (
                user_id, user_name, date, academic_pressure, study_satisfaction, 
                sleep_duration, dietary_habits, financial_stress, family_history, 
                stress_score, prediction
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, user_name, datetime.now().isoformat(), academic_pressure, 
            study_satisfaction, sleep_duration, dietary_habits, financial_stress, 
            family_history, stress_score, prediction
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"DB Error: {e}")

    # Dynamic Wellness Plan
    wellness_plan = []
    if sleep_duration < 7:
        wellness_plan.append({"id": "sleep", "task": "Establish a 10 PM wind-down routine", "category": "Sleep"})
    if academic_pressure > 3:
        wellness_plan.append({"id": "study", "task": "Use Pomodoro technique for study sessions", "category": "Academic"})
    if stress_score > 50:
        wellness_plan.append({"id": "mind", "task": "Complete one 10-minute meditation daily", "category": "Mindfulness"})

    return jsonify({
        "prediction": prediction,
        "stressScore": stress_score,
        "riskLevel": risk_level,
        "wellnessPlan": wellness_plan
    })

@app.route('/predict-future', methods=['GET'])
def predict_future():
    user_id = request.args.get('userId', 'default_user')
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT stress_score, date FROM attempts WHERE user_id = ? ORDER BY date ASC', (user_id,))
        rows = cursor.fetchall()
        conn.close()
    except:
        return jsonify({"error": "DB connection failed", "futureData": []})

    if len(rows) < 3:
        return jsonify({"error": "Need more data", "futureData": []})

    # Linear Regression Logic
    y = [r[0] for r in rows]
    x = list(range(len(y)))
    
    slope, intercept = np.polyfit(x, y, 1)
    
    future_data = []
    for i in range(1, 4):
        pred = slope * (len(x) + i - 1) + intercept
        future_data.append({
            "score": round(min(max(pred, 0), 100)),
            "isPredicted": True
        })
        
    return jsonify({"futureData": future_data})

@app.route('/history', methods=['GET'])
def history():
    user_id = request.args.get('userId', 'default_user')
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT date, stress_score, prediction FROM attempts WHERE user_id = ? ORDER BY date DESC LIMIT 10', (user_id,))
        rows = cursor.fetchall()
        conn.close()
    except:
        return jsonify({"history": [], "trend": "Unknown", "insight": "DB connection failed"})

    history_data = [{"date": r[0], "score": r[1], "prediction": r[2]} for r in rows]
    
    # Trend Analysis
    trend = "Stable"
    insight = "Keep monitoring your well-being."
    if len(history_data) >= 2:
        latest = history_data[0]['score']
        previous = history_data[1]['score']
        if latest < previous - 5:
            trend = "Improving"
            insight = "You are improving over time. Great job on taking care of yourself!"
        elif latest > previous + 5:
            trend = "Worsening"
            insight = "Stress levels are increasing. Consider taking some time for self-care or talking to someone."

    return jsonify({
        "history": history_data,
        "trend": trend,
        "insight": insight
    })

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    response = get_nltk_response(message)
    return jsonify({"response": response})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
