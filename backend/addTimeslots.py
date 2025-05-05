import mysql.connector
from mysql.connector import Error
import time
import os
from datetime import datetime, timedelta

# Connect to DB
mydb = mysql.connector.connect(
    host=os.getenv('DB_HOST', 'localhost'),
    user=os.getenv('DB_USER', 'root'),
    password=os.getenv('DB_PASSWORD', 'adminpass'),
    database='library_database',
    auth_plugin='mysql_native_password'
)

cursor = mydb.cursor()

# Get all room numbers
cursor.execute("SELECT room_number FROM room")
rooms = cursor.fetchall()  # list of tuples

# Define time range: today
start_date = datetime.now().date()
end_date = start_date + timedelta(days=180)  # 6 months

# Hours Libary is open
# Monday=0, Sunday=6
open_hours = {
    0: (8, 20),  # Monday
    1: (8, 20),  # Tuesday
    2: (8, 20),  # Wednesday
    3: (8, 20),  # Thursday
    4: (8, 18),  # Friday
    5: (8, 18),  # Saturday
    6: (13, 18)  # Sunday
}

timeslot_data = []

for room in rooms:
    room_number = room[0]
    current_date = start_date
    while current_date <= end_date:
        weekday = current_date.weekday()
        if weekday in open_hours:
            start_hour, end_hour = open_hours[weekday]
            slot_time = datetime.combine(current_date, datetime.min.time()).replace(hour=start_hour)
            end_of_day = datetime.combine(current_date, datetime.min.time()).replace(hour=end_hour)

            while slot_time < end_of_day:
                start_time = slot_time
                end_time = start_time + timedelta(minutes=30)
                timeslot_data.append((room_number, start_time, end_time, False))
                slot_time = end_time

        current_date += timedelta(days=1)

# Insert timeslots in batches
try:
    cursor.executemany("""
        INSERT INTO room_timeslots (room_number, start_time, end_time, booked)
        VALUES (%s, %s, %s, %s)
    """, timeslot_data)
    mydb.commit()
    print(f"Inserted {cursor.rowcount} timeslots successfully.")
except Error as e:
    print("Error inserting timeslots:", e)

cursor.close()
mydb.close()
