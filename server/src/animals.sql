CREATE TABLE IF NOT EXISTS animals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  funFact TEXT,
  diet TEXT CHECK(diet IN ('carnivore', 'herbivore', 'omnivore')),
  category TEXT CHECK(category IN ('mammals', 'birds', 'reptiles', 'marine', 'insects')),
  habitat TEXT CHECK(habitat IN ('terrestrial', 'aquatic', 'aerial')),
  lifespan INTEGER,
  imageQuery TEXT
);

INSERT INTO animals (name, species, funFact, diet, category, habitat, lifespan, imageQuery)
VALUES 
  ('African Lion', 'Panthera leo', 'Male lions can sleep up to 20 hours a day!', 'carnivore', 'mammals', 'terrestrial', 15, 'lion'),
  ('Emperor Penguin', 'Aptenodytes forsteri', 'Can dive up to 500 meters deep and hold their breath for 20 minutes!', 'carnivore', 'birds', 'aquatic', 20, 'penguin'),
  ('Giant Pacific Octopus', 'Enteroctopus dofleini', 'Has three hearts and can change color in less than a second!', 'carnivore', 'marine', 'aquatic', 5, 'octopus'),
  ('Red-Eyed Tree Frog', 'Agalychnis callidryas', 'They sleep during the day with their eyes closed, showing only white!', 'carnivore', 'reptiles', 'terrestrial', 5, 'treefrog'),
  ('Monarch Butterfly', 'Danaus plexippus', 'They can travel up to 3000 miles during migration!', 'herbivore', 'insects', 'aerial', 1, 'monarch');