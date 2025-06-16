-- Drop foreign key from books table first
ALTER TABLE books
DROP FOREIGN KEY books_ibfk_1;

-- Now modify users table
ALTER TABLE users
DROP PRIMARY KEY;

ALTER TABLE users 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;

-- Finally re-add the foreign key to books table
ALTER TABLE books
MODIFY COLUMN user_id INT,
ADD CONSTRAINT books_user_fk
FOREIGN KEY (user_id) REFERENCES users(id);
