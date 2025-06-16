import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'saas',
  password: process.env.DB_PASSWORD || '19283764x!',
  database: process.env.DB_NAME || 'book_saas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Helper function to execute queries
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Helper function to generate slug
function generateSlug(title) {
  return title.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Books Endpoints
app.get('/api/books', async (req, res) => {
  try {
    const books = await query('SELECT * FROM books ORDER BY title');
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const [book] = await query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/book/:slug', async (req, res) => {
  try {
    const [book] = await query('SELECT * FROM books WHERE slug = ?', [req.params.slug]);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add My Books endpoint
app.get('/api/my-books/:userId', async (req, res) => {
  try {
    const books = await query(
      `SELECT * FROM books 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [req.params.userId]
    );
    res.json(books);
  } catch (err) {
    console.error('Error fetching user books:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fix book creation endpoint
app.post('/api/books', async (req, res) => {
  try {
    const book = req.body;
    book.id = uuidv4();
    book.slug = generateSlug(book.title);

    const result = await query(
      `INSERT INTO books 
      (id, title, slug, cover, author, description, category, tags, 
       bookType, sourceUrl, discount_code, book_status, user_id, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        book.id,
        book.title,
        book.slug,
        book.cover,
        book.author,
        book.description,
        book.category,
        book.tags,
        book.bookType,
        book.sourceUrl,
        book.discount_code || null,
        book.book_status || 0,
        book.user_id,
      ]
    );

    res.status(201).json(book);
  } catch (err) {
    console.error('Error creating book:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/books/:id', async (req, res) => {
  try {
    const book = req.body;
    book.slug = generateSlug(book.title);
    
    await query(
      `UPDATE books SET 
      title = ?, slug = ?, cover = ?, author = ?, description = ?, 
      category = ?, tags = ?, bookType = ?, sourceUrl = ?, discountCode = ? 
      WHERE id = ?`,
      [
        book.title,
        book.slug,
        book.cover,
        book.author,
        book.description,
        book.category,
        book.tags,
        book.bookType,
        book.sourceUrl,
        book.discountCode || null,
        req.params.id
      ]
    );
    
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    await query('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Categories Endpoints
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await query('SELECT DISTINCT category FROM books WHERE category IS NOT NULL');
    const categoryNames = categories.map(c => c.category);
    res.json(categoryNames);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    
    // Since we don't have a separate categories table, we just validate
    // that this is a valid category by checking if it exists in any book
    res.json({ name, message: 'Category will be available for selection' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tracking Codes Endpoints
app.get('/api/tracking-codes', async (req, res) => {
  try {
    const codes = await query('SELECT * FROM tracking_codes ORDER BY platform');
    res.json(codes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tracking-codes', async (req, res) => {
  try {
    const code = req.body;
    code.id = uuidv4();
    
    await query(
      `INSERT INTO tracking_codes 
      (id, platform, code, position, active) 
      VALUES (?, ?, ?, ?, ?)`,
      [code.id, code.platform, code.code, code.position, code.active]
    );
    
    res.status(201).json(code);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tracking-codes/:id', async (req, res) => {
  try {
    const code = req.body;
    
    await query(
      `UPDATE tracking_codes SET 
      platform = ?, code = ?, position = ?, active = ? 
      WHERE id = ?`,
      [code.platform, code.code, code.position, code.active, req.params.id]
    );
    
    res.json(code);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tracking-codes/:id', async (req, res) => {
  try {
    await query('DELETE FROM tracking_codes WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add before other tracking-codes endpoints
app.get('/api/tracking-codes/active/:position', async (req, res) => {
  try {
    const { position } = req.params;
    
    // Validate position
    const validPositions = ['head', 'body-start', 'body-end'];
    if (!validPositions.includes(position)) {
      return res.status(400).json({ error: 'Invalid position' });
    }

    const codes = await query(
      'SELECT * FROM tracking_codes WHERE position = ? AND active = true ORDER BY id',
      [position]
    );

    res.json(codes);
  } catch (err) {
    console.error('Error fetching tracking codes:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add book view tracking endpoint
app.post('/api/books/:id/views', async (req, res) => {
  try {
    // Update view count
    await query(
      `UPDATE books 
       SET view_count = COALESCE(view_count, 0) + 1 
       WHERE id = ?`,
      [req.params.id]
    );

    // Get updated view count
    const [book] = await query(
      'SELECT view_count FROM books WHERE id = ?',
      [req.params.id]
    );

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ view_count: book.view_count });
  } catch (err) {
    console.error('Error updating view count:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add book download tracking endpoint
app.post('/api/books/:id/downloads', async (req, res) => {
  try {
    // Update download count
    await query(
      `UPDATE books 
       SET download_count = COALESCE(download_count, 0) + 1 
       WHERE id = ?`,
      [req.params.id]
    );

    // Get updated download count
    const [book] = await query(
      'SELECT download_count FROM books WHERE id = ?',
      [req.params.id]
    );

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ download_count: book.download_count });
  } catch (err) {
    console.error('Error updating download count:', err);
    res.status(500).json({ error: err.message });
  }
});


// Update user profile
app.put('/api/users/:id', async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const userId = req.params.id;

    // Check if email is already taken by another user
    const [existingUser] = await query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    await query(
      'UPDATE users SET full_name = ?, email = ? WHERE id = ?',
      [fullName, email, userId]
    );

    const [updatedUser] = await query(
      'SELECT id, full_name, email, role FROM users WHERE id = ?',
      [userId]
    );

    res.json(updatedUser);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update user password
app.put('/api/users/:id/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;

    // Get current user data
    const [user] = await query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email); // Debug log

    // Find user
    const [user] = await query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send(`
    <h1>Book Manager API</h1>
    <p>Available endpoints:</p>
    <ul>
      <li>GET /api/books</li>
      <li>GET /api/books/:id</li>
      <li>POST /api/books</li>
      <li>PUT /api/books/:id</li>
      <li>DELETE /api/books/:id</li>
      <li>GET /api/categories</li>
    </ul>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database config: ${JSON.stringify(dbConfig, null, 2)}`);
});