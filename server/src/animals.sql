-- Drop table if exists to ensure clean setup
DROP TABLE IF EXISTS animals;

-- Create animals table
CREATE TABLE animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Insert some initial animals
INSERT INTO animals (name) VALUES
    ('Rat'),
    ('Lion'),
    ('Tiger'),
    ('Pigeon');