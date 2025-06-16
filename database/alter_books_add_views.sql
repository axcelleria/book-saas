# add view_count column
ALTER TABLE books
ADD COLUMN view_count INT DEFAULT 0;

# add book_status column
ALTER TABLE books
ADD COLUMN book_status INT DEFAULT 0;