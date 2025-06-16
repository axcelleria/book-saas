-- Update users table to support admin role
ALTER TABLE users
MODIFY COLUMN role ENUM('user', 'author', 'admin') DEFAULT 'author';

-- Create super admin user (password: admin123)
INSERT INTO users (
    full_name,
    email,
    password,
    role
) VALUES (
    'Super Admin',
    'admin@example.com',
    '$2b$10$YourHashedPasswordHere',  -- You'll need to generate this with bcrypt
    'admin'
);
