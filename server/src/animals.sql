CREATE TABLE IF NOT EXISTS animals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  category TEXT NOT NULL,
  funFact TEXT,
  diet TEXT,
  habitat TEXT,
  lifespan INTEGER,
  image_url TEXT
);
