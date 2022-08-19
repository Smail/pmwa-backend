CREATE TABLE IF NOT EXISTS users (
  uuid TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- constraint lowercase username