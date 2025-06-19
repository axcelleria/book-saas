-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX idx_categories_slug ON categories(slug);

-- Update books table to use foreign key for category
ALTER TABLE books 
ADD CONSTRAINT fk_book_category 
FOREIGN KEY (category) REFERENCES categories(name) 
ON DELETE SET NULL 
ON UPDATE CASCADE;
