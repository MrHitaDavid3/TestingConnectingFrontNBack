#This would be how we allow SJSU students as well as public library users to login
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

CHROMEDRIVER_PATH = '/Users/abraham/Downloads/chromedriver-mac-x64/chromedriver'


#here we would check their library login
def check_library_login(card_number, pin_number):
    options = Options()
    options.add_argument("--headless")  # run in headless mode
    service = Service(CHROMEDRIVER_PATH)
    driver = webdriver.Chrome(service=service, options=options)

    try:
        wait = WebDriverWait(driver, 15)
        url = "https://booking.sjlibrary.org/reserve/king?m=t&gid=0&capacity=0&zone=0&date=2025-05-03&date-end=2025-05-03&start=21%3A00&end=21%3A30"
        driver.get(url)

        # Click first "Book Now" button
        book_buttons = wait.until(EC.presence_of_all_elements_located((By.CLASS_NAME, "btn-primary")))
        book_buttons[0].click()
        time.sleep(2)

        # Find login inputs
        card_input = wait.until(EC.presence_of_element_located((By.ID, "username")))
        pin_input = wait.until(EC.presence_of_element_located((By.ID, "password")))

        # Type slowly
        for char in card_number:
            card_input.send_keys(char)
            time.sleep(0.1)

        for char in pin_number:
            pin_input.send_keys(char)
            time.sleep(0.1)

        # Click login button
        login_button = driver.find_element(By.XPATH, "//button[@type='submit']")
        login_button.click()

        # Wait for response or page change
        time.sleep(5)

        # Check success: look for disappearance of the login form
        current_url = driver.current_url
        if "libauth" in current_url or "login" in current_url:
            print("Login failed — still on login page.")
            return False
        else:
            print("Login successful — redirected away from login page.")
            return True

    except Exception as e:
        print(f"An error occurred: {e}")
        return False

    finally:
        driver.quit()
