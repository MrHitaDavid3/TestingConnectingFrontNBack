# This would be how we are able to access our app, we would login, find a room, and check it out
from flask import Flask, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from backend.db import get_db
from backend.library_checkUsername import check_library_login
from library_checkout import perform_library_checkout
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY') or 'dev_secret'

# ---------- Helper functions ----------

# We get the User's email adderess
def get_user_by_email(email):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM user_info WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()
    db.close()
    return user

# We get the user's ID number
def get_user_by_id(user_id):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM user_info WHERE user_id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()
    db.close()
    return user

# ---------- Routes ----------

# This is how we are going to allow users to sign up
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    card, pin = data.get('sjsuID_libCard'), data.get('sjsuPW_LibPin')
    email, password = data.get('email'), data.get('accountPassword')

    if not all([card, pin, email, password]):
        return jsonify({'error': 'Missing required fields'}), 400

    if not check_library_login(card, pin):
        return jsonify({'error': 'Invalid library login'}), 400

    if get_user_by_email(email):
        return jsonify({'error': 'Email already registered'}), 400

    db = get_db()
    cursor = db.cursor()
    hashed_pw = generate_password_hash(password)
    cursor.execute("""
        INSERT INTO user_info (sjsuID_libCard, sjsuPW_LibPin, email, accountPassword)
        VALUES (%s, %s, %s, %s)
    """, (card, pin, email, hashed_pw))
    db.commit()
    cursor.close()
    db.close()

    return jsonify({'message': 'Account created successfully'})

# This would be how we allow users to login
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email, password = data.get('email'), data.get('accountPassword')

    if not all([email, password]):
        return jsonify({'error': 'Missing email or password'}), 400

    user = get_user_by_email(email)
    if user and check_password_hash(user['accountPassword'], password):
        session['user_id'] = user['user_id']
        return jsonify({'message': 'Logged in successfully'})

    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/checkout', methods=['POST'])
def checkout():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    timeslot_id = data.get('timeslot_id')
    if not timeslot_id:
        return jsonify({'error': 'Missing timeslot_id'}), 400

    user = get_user_by_id(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT r.room_url, t.start_time, t.booked
        FROM room_timeslots t
        JOIN room r ON r.room_number = t.room_number
        WHERE t.timeslot_id = %s
    """, (timeslot_id,))
    slot = cursor.fetchone()

    if not slot:
        cursor.close()
        db.close()
        return jsonify({'error': 'Timeslot not found'}), 404

    if slot['booked']:
        cursor.close()
        db.close()
        return jsonify({'error': 'Timeslot already booked'}), 400

    # Perform external Selenium checkout
    success, message = perform_library_checkout(slot['room_url'], user['sjsuID_libCard'], user['sjsuPW_LibPin'])
    if not success:
        cursor.close()
        db.close()
        return jsonify({'error': message}), 500

    # Mark slot as booked
    cursor.execute("""
        UPDATE room_timeslots
        SET booked = TRUE, booked_by_user_id = %s
        WHERE timeslot_id = %s
    """, (user['user_id'], timeslot_id))
    db.commit()
    cursor.close()
    db.close()

    return jsonify({'message': 'Room successfully booked!'})

# ---------- Run app ----------

if __name__ == '__main__':
    app.run(debug=True)
