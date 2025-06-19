-- Add parent_id column to categories table
ALTER TABLE categories
ADD COLUMN parent_id VARCHAR(36) NULL,
ADD CONSTRAINT fk_category_parent 
FOREIGN KEY (parent_id) REFERENCES categories(id)
ON DELETE CASCADE;

-- Add index for faster parent-child lookups
CREATE INDEX idx_categories_parent ON categories(parent_id);
