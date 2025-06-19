-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    cover VARCHAR(255),
    author VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    tags TEXT,
    bookType VARCHAR(50),
    sourceUrl VARCHAR(255),
    discount_code VARCHAR(50),
    book_status TINYINT DEFAULT 0,
    view_count INT DEFAULT 0,
    download_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create tracking_codes table
CREATE TABLE IF NOT EXISTS tracking_codes (
    id VARCHAR(36) PRIMARY KEY,
    platform VARCHAR(100) NOT NULL,
    code TEXT NOT NULL,
    position VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_slug ON books(slug);
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_tracking_codes_position ON tracking_codes(position);
CREATE INDEX idx_tracking_codes_active ON tracking_codes(active);
