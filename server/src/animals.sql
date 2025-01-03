CREATE TABLE IF NOT EXISTS animals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  funFact TEXT,
  diet TEXT NOT NULL,
  category TEXT NOT NULL,
  habitat TEXT NOT NULL,
  lifespan INTEGER,
  image_url TEXT
);

-- Insert initial animals only if they don't exist
INSERT OR IGNORE INTO animals (name, species, category, funFact, diet, habitat, lifespan) 
VALUES 
    ('African Lion', 'Panthera leo', 'mammals', 'Male lions can sleep up to 20 hours a day!', 'Carnivore', 'Savanna', 15),
    ('Emperor Penguin', 'Aptenodytes forsteri', 'birds', 'Can dive up to 500 meters deep in search of food', 'Piscivore', 'Antarctic', 20),
    ('Giant Pacific Octopus', 'Enteroctopus dofleini', 'marine', 'Has three hearts and blue blood', 'Carnivore', 'Marine', 5),
    ('Red-Eyed Tree Frog', 'Agalychnis callidryas', 'amphibians', 'Their eyes are red to camouflage during the day', 'Insectivore', 'Tropical', 5),
    ('Monarch Butterfly', 'Danaus plexippus', 'insects', 'Can travel up to 3000 miles during migration', 'Herbivore', 'Temperate', 1);