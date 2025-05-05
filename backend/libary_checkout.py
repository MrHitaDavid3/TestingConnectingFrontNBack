# This is how we are going check out rooms to users
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# We gather the nessesary information to checkout users
def perform_library_checkout(url, lib_card, lib_pin):
    CHROMEDRIVER_PATH = '/Users/abraham/Downloads/chromedriver-mac-x64/chromedriver'
    options = Options()
    #options.add_argument('--headless')  # Run in headless mode on backend
    service = Service(CHROMEDRIVER_PATH)
    driver = webdriver.Chrome(service=service, options=options)

    try:
        wait = WebDriverWait(driver, 10)
        driver.get(url)

        # Users will click "Book Now" to attempt to checkout a room
        book_buttons = wait.until(EC.presence_of_all_elements_located((By.CLASS_NAME, "btn-primary")))
        book_buttons[0].click()
        time.sleep(2)

        # Enter credentials slowly
        card_input = driver.find_element(By.ID, "username")
        pin_input = driver.find_element(By.ID, "password")
        for char in lib_card:
            card_input.send_keys(char)
            time.sleep(0.1)
        for char in lib_pin:
            pin_input.send_keys(char)
            time.sleep(0.1)

        # Submit login
        login_button = driver.find_element(By.XPATH, "//button[@type='submit']")
        login_button.click()
        time.sleep(5)

        # Check for success
        if "error" in driver.page_source.lower():
            return False, "Login failed on library site"
        return True, "Library checkout successful"
    except Exception as e:
        return False, f"Error during Selenium checkout: {str(e)}"
    finally:
        driver.quit()
perform_library_checkout("https://booking.sjlibrary.org/reserve/spaces/king?m=t&gid=0&capacity=0&zone=0&date=2025-05-04&date-end=2025-05-03&start=22%3A30&end=23%3A00","21197910823979","2249")
