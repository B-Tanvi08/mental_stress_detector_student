import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# 1. Load Dataset
# Assume the dataset is in data/Student Depression Dataset.csv
DATA_PATH = "data/Student Depression Dataset.csv"
MODEL_PATH = "models/model.pkl"

def preprocess_data(df):
    """
    Handle missing values, encode categorical variables, and scale features.
    """
    # Handle missing values
    df = df.dropna()

    # Feature Engineering: Stress Score (0-100)
    # Using Sleep Duration, Academic Pressure, Study Satisfaction, and Financial Stress
    if 'Academic Pressure' in df.columns and 'Study Satisfaction' in df.columns:
        # Normalize columns to 0-1 range for score calculation
        # Academic Pressure (1-5), Study Satisfaction (1-5), Financial Stress (1-5)
        # Sleep Duration (typically 4-10)
        
        # High pressure increases stress
        # Low satisfaction increases stress
        # Low sleep increases stress
        # High financial stress increases stress
        
        df['Stress Score'] = (
            (df['Academic Pressure'] * 15) + 
            ((5 - df['Study Satisfaction']) * 15) + 
            (df['Financial Stress'] * 10) +
            (np.where(df['Sleep Duration'] < 6, 20, 0))
        ).clip(0, 100)

    # Encode Categorical Variables
    le = LabelEncoder()
    categorical_cols = df.select_dtypes(include=['object']).columns
    for col in categorical_cols:
        df[col] = le.fit_transform(df[col])

    return df

def train_and_evaluate():
    if not os.path.exists(DATA_PATH):
        print(f"Error: Dataset not found at {DATA_PATH}")
        return

    df = pd.read_csv(DATA_PATH)
    df = preprocess_data(df)

    # Target: Depression (Yes/No)
    # We drop Stress Score from features as it's derived
    X = df.drop(['Depression', 'Stress Score'], axis=1)
    y = df['Depression']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Models
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000),
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42)
    }

    best_model = None
    best_score = 0

    for name, model in models.items():
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        
        print(f"\n--- {name} Performance ---")
        print(f"Accuracy: {acc:.4f}")
        print(f"Precision: {prec:.4f}")
        print(f"Recall: {rec:.4f}")
        print(f"F1-Score: {f1:.4f}")

        if acc > best_score:
            best_score = acc
            best_model = {
                'model': model,
                'scaler': scaler,
                'name': name
            }

    # Save Best Model and Scaler
    if not os.path.exists('models'):
        os.makedirs('models')
    
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(best_model, f)
    
    print(f"\nBest model ({best_model['name']}) saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_and_evaluate()
