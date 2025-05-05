# this is our database using mysql which containts all the important features
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def get_db():
    return mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', 'adminpass'),#change password here
        database=os.getenv('DB_NAME','library_database'),
        auth_plugin='mysql_native_password'
)
