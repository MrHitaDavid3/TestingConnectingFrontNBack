# here we collected the data from the library, this was the key important feature in ensuring our code was able to run properly
import time
import os
import mysql.connector
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime, timedelta

CHROMEDRIVER_PATH = '/Users/abraham/Downloads/chromedriver-mac-x64/chromedriver'

# We setup our DB connection here
mydb = mysql.connector.connect(
    host=os.getenv('DB_HOST', 'localhost'),
    user=os.getenv('DB_USER', 'root'),
    password=os.getenv('DB_PASSWORD', 'adminpass'),
    database='library_database',
    auth_plugin='mysql_native_password'
)
cursor = mydb.cursor()

# Here we got all rooms with URLs
cursor.execute("SELECT room_number, room_url FROM room")
rooms = cursor.fetchall()

# Prepare dates (today + 5 days)
today = datetime.now()
target_dates = [(today + timedelta(days=i)).strftime("%B %-d, %Y") for i in range(6)]

# We setup Selenium to aid in our code
options = Options()
options.add_argument('--headless')
service = Service(CHROMEDRIVER_PATH)
driver = webdriver.Chrome(service=service, options=options)

# here is a try function which would help us figure out which rooms are available
try:
    for room_number, room_url in rooms:
        print(f"\nChecking room {room_number} at {room_url}")
        driver.get(room_url)
        wait = WebDriverWait(driver, 10)

        # Click Week View
        try:
            week_button = wait.until(EC.element_to_be_clickable((By.CLASS_NAME, 'fc-resourceTimeGridWeek-button')))
            week_button.click()
            time.sleep(2)
        except:
            print("Week View button not found, continuing...")

        # Checked all dates
        for target_date in target_dates:
            max_arrow_clicks = 1
            arrow_clicked = 0

            # If date not visible → click right arrow once
            while target_date not in driver.page_source and arrow_clicked < max_arrow_clicks:
                try:
                    right_arrow = wait.until(EC.element_to_be_clickable((By.CLASS_NAME, 'fa-chevron-right')))
                    right_arrow.click()
                    arrow_clicked += 1
                    time.sleep(2)
                except:
                    print("Next week button not found, continuing...")
                    break

            # Get time slots for each room
            try:
                slots = wait.until(EC.presence_of_all_elements_located((By.CLASS_NAME, 'fc-timegrid-event')))
            except:
                print(f"No time slots found for {target_date}")
                continue

            found_slot = False
            for slot in slots:
                title = slot.get_attribute('title')
                classes = slot.get_attribute('class').split()
                if target_date in title and str(room_number) in title:
                    is_available = 's-lc-eq-avail' in classes
                    status = 'AVAILABLE' if is_available else 'UNAVAILABLE'
                    print(f"{title} → {status}")
                    found_slot = True

                    # Extract time from title (ex: 8:00am)
                    try:
                        parts = title.split(' ')
                        time_part = parts[0]  # '1:00pm'
                        am_pm = parts[0][-2:]  # 'pm'
                        time_clean = parts[0][:-2] + ' ' + am_pm  # '1:00 pm'
                        date_part = ' '.join(parts[1:5])  # 'Sunday, May 4, 2025'
                        full_time = f"{time_clean} {date_part}"
                        start_time = datetime.strptime(full_time, "%I:%M %p %A, %B %d, %Y")
                    except Exception as e:
                        print(f"Failed to parse time from '{title}': {e}")
                        continue


    # Updated the DB
                    try:
                        cursor.execute("""
                            UPDATE room_timeslots 
                            SET booked = %s
                            WHERE room_number = %s AND start_time = %s
                        """, (not is_available, room_number, start_time))
                        mydb.commit()
                    except Exception as e:
                        print(f"Failed to update DB for {title}: {e}")

            if not found_slot:
                print(f"No slots found for {target_date}.")

finally:
    driver.quit()
    cursor.close()
    mydb.close()
