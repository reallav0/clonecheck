import os

DATABASE_URL = os.getenv("DATABASE_URL")
PORT = 8000

print(f"Running with {DATABASE_URL} on port {PORT}")
