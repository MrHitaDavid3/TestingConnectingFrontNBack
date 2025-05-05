# Here we would check if the room would be booked or not
import requests
from bs4 import BeautifulSoup
import mysql.connector
import time
from datetime import datetime

# It is connected to MySQL
mydb = mysql.connector.connect(
    host='localhost',
    user='root',
    password='adminpass',
    database='library_database'
)
cursor = mydb.cursor()

# We get all our rooms with URLs from the DB
cursor.execute("SELECT room_number, room_url FROM room")
rooms = cursor.fetchall()

# Here is a for loop to check if a room has been booked or not
for room_number, room_url in rooms:
    print(f"\nChecking room {room_number} → {room_url}")

    try:
        response = requests.get(room_url)
        if response.status_code != 200:
            print(f"Failed to fetch {room_url}")
            continue

        soup = BeautifulSoup(response.text, 'html.parser')
        slots = soup.find_all('a', class_='fc-timegrid-event')

        for slot in slots:
            classes = slot.get('class', [])
            title = slot.get('title', '')
            is_available = 's-lc-eq-avail' in classes

            # Example title: "8:00am Monday, May 5, 2025 – 8:24 – Available"
            try:
                time_part = title.split('–')[0].strip()
                time_obj = datetime.strptime(time_part, "%I:%M%p %A, %B %d, %Y")
                start_time_str = time_obj.strftime("%Y-%m-%d %H:%M:%S")
            except Exception as e:
                print(f"⚠️ Could not parse date from '{title}': {e}")
                continue

            # Updatec room_timeslots table with the gathered data
            cursor.execute("""
                UPDATE room_timeslots
                SET booked = %s
                WHERE room_number = %s AND start_time = %s
            """, (not is_available, room_number, start_time_str))
            mydb.commit()
            print(f"Updated {room_number} at {start_time_str} → {'AVAILABLE' if is_available else 'BOOKED'}")

    except Exception as e:
        print(f"Error processing room {room_number}: {e}")

cursor.close()
mydb.close()
