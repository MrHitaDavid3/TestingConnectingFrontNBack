import time
import mysql.connector
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

CHROMEDRIVER_PATH = '/Users/abraham/Downloads/chromedriver-mac-x64/chromedriver'

# Step 1: Get 8th floor rooms from DB
db = mysql.connector.connect(
    host='localhost', user='root', password='adminpass', database='library_database'
)
cursor = db.cursor()
cursor.execute("SELECT room_number, room_url FROM room WHERE floor_number = 8")
rooms = cursor.fetchall()
cursor.close()
db.close()

# Step 2: Set up Selenium
options = Options()
# options.add_argument('--headless')  # Uncomment for headless mode
service = Service(CHROMEDRIVER_PATH)
driver = webdriver.Chrome(service=service, options=options)
wait = WebDriverWait(driver, 10)

# User login credentials
username = "21197910823979"
password = "2249"
target_date = "May 6, 2025"
target_time = "9:00am"

try:
    for room_number, room_url in rooms:
        print(f"Checking room {room_number}")
        driver.get(room_url)

        # Week View
        try:
            week_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(@class, 'fc-resourceTimeGridWeek-button')]")))
            week_button.click()
            time.sleep(2)
        except:
            print("Week View button not found, continuing...")

        # Move week if needed
        if target_date not in driver.page_source:
            try:
                right_arrow = wait.until(EC.element_to_be_clickable((By.XPATH, "//i[contains(@class, 'fa-chevron-right')]")))
                right_arrow.click()
                time.sleep(2)
            except:
                print("Next week button not found, continuing...")

        # Find available slot
        slots = driver.find_elements(By.CLASS_NAME, 'fc-timegrid-event')
        for slot in slots:
            title = slot.get_attribute('title')
            classes = slot.get_attribute('class').split()
            if target_date in title and target_time in title and 's-lc-eq-avail' in classes:
                print(f"Booking available slot: {title}")
                slot.click()
                time.sleep(2)

                # Sign in
                driver.find_element(By.ID, "username").send_keys(username)
                driver.find_element(By.ID, "password").send_keys(password)
                driver.find_element(By.XPATH, "//button[@type='submit']").click()
                time.sleep(5)

                # Confirm booking (button depends on site, adjust selector)
                confirm_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Submit')]")))
                confirm_button.click()
                time.sleep(3)

                print("Booking completed successfully!")
                break
        else:
            print(f"No available slot at {target_time} on {target_date} for room {room_number}")

finally:
    driver.quit()


