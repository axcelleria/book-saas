CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'author') DEFAULT 'author',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add user_id to books table for ownership
ALTER TABLE books
ADD COLUMN user_id VARCHAR(36),
ADD FOREIGN KEY (user_id) REFERENCES users(id),
ADD INDEX idx_user_id (user_id);

-- Add indexes for common queries
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_role ON users(role);
