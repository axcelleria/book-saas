import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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
    book.slug = generateSlug(book.title);    const result = await query(
      `INSERT INTO books 
      (id, title, slug, cover, author, description, category, tags, 
       book_type, source_url, discount_code, book_status, user_id, created_at, updated_at) 
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
        book.book_type,
        book.source_url,
        book.discount_code || null,
        book.book_status || 0,
        book.user_id
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
      category = ?, tags = ?, book_type = ?, source_url = ?, discount_code = ?,
      book_status = ?, updated_at = NOW()
      WHERE id = ?`,
      [
        book.title,
        book.slug,
        book.cover,
        book.author,
        book.description,
        book.category,
        book.tags,
        book.book_type,
        book.source_url,
        book.discount_code || null,
        book.book_status || 0,
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

// Categories Management Endpoints
app.get('/api/categories', async (req, res) => {
  try {
    // Get all categories with their parent information
    const categories = await query(`
      SELECT c.*, p.name as parent_name 
      FROM categories c 
      LEFT JOIN categories p ON c.parent_id = p.id 
      ORDER BY COALESCE(c.parent_id, c.id), c.name
    `);

    // Organize into parent-child structure if requested
    const structured = req.query.structured === 'true'
      ? categories.reduce((acc, category) => {
          if (!category.parent_id) {
            // This is a parent category
            category.children = categories
              .filter(c => c.parent_id === category.id)
              .map(c => ({ ...c, children: [] }));
            acc.push(category);
          }
          return acc;
        }, [])
      : categories;

    res.json(structured);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  try {
    const [category] = await query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, description, parentId } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // If parentId is provided, verify it exists
    if (parentId) {
      const [parent] = await query('SELECT * FROM categories WHERE id = ?', [parentId]);
      if (!parent) {
        return res.status(400).json({ error: 'Parent category not found' });
      }
      if (parent.parent_id) {
        return res.status(400).json({ error: 'Cannot create nested categories beyond one level' });
      }
    }

    const slug = name.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-');

    const categoryId = uuidv4();
    await query(
      'INSERT INTO categories (id, name, slug, description, parent_id) VALUES (?, ?, ?, ?, ?)',
      [categoryId, name, slug, description, parentId || null]
    );

    const [newCategory] = await query('SELECT * FROM categories WHERE id = ?', [categoryId]);
    res.status(201).json(newCategory);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, description, parentId } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Verify the category exists
    const [existingCategory] = await query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // If parentId is provided, verify it exists and check nesting rules
    if (parentId) {
      // Can't set own ID as parent
      if (parentId === req.params.id) {
        return res.status(400).json({ error: 'Category cannot be its own parent' });
      }

      const [parent] = await query('SELECT * FROM categories WHERE id = ?', [parentId]);
      if (!parent) {
        return res.status(400).json({ error: 'Parent category not found' });
      }
      if (parent.parent_id) {
        return res.status(400).json({ error: 'Cannot create nested categories beyond one level' });
      }

      // Check if this category has children (can't make a parent category into a child)
      const [childCount] = await query(
        'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
        [req.params.id]
      );
      if (childCount.count > 0) {
        return res.status(400).json({ error: 'Cannot make a parent category into a child category' });
      }
    }

    const slug = name.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-');

    await query(
      'UPDATE categories SET name = ?, slug = ?, description = ?, parent_id = ? WHERE id = ?',
      [name, slug, description, parentId || null, req.params.id]
    );

    const [updatedCategory] = await query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!updatedCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(updatedCategory);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const [category] = await query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.status(204).end();
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
    console.error('Error fetching tracking codes:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tracking-codes/active/:position', async (req, res) => {
  try {
    const codes = await query(
      'SELECT * FROM tracking_codes WHERE position = ? AND active = true ORDER BY id',
      [req.params.position]
    );
    res.json(codes);
  } catch (err) {
    console.error('Error fetching active tracking codes:', err);
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
    console.error('Error creating tracking code:', err);
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
    console.error('Error updating tracking code:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tracking-codes/:id', async (req, res) => {
  try {
    await query('DELETE FROM tracking_codes WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting tracking code:', err);
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

// Forget password endpoint

// Generate and save token
app.post('/api/auth/request-reset', async (req, res) => {
  const { email } = req.body;
  
  // 1. Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');
  // Format the expiry date in MySQL format
  const expiresAt = new Date(Date.now() + 3600000 * 4) // 4 hours
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

  // 2. Save to database
  await query(
    'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
    [resetToken, expiresAt, email]
  );
  
  res.json({ token: resetToken });
});

// Verify token
app.get('/api/auth/verify-reset-token/:token', async (req, res) => {
  const [user] = await query(
    'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
    [req.params.token]
  );
  
  if (!user) return res.status(400).json({ valid: false });
  res.json({ valid: true, email: user.email });
});

// Password Reset Token Endpoint
app.post('/api/auth/reset-token', async (req, res) => {
  const { email, token, expiresAt } = req.body;
  if (!email || !token || !expiresAt) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  try {
    // Format the expiry date in MySQL format
    const formattedExpiresAt = new Date(expiresAt)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    // Update the user with the reset token and expiry
    const result = await query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
      [token, formattedExpiresAt, email]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'Reset token saved.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Password reset by token
app.post('/api/auth/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }
  try {
    // Find user with valid token
    const [user] = await query(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Update password and clear reset token
    await query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );
    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ message: err.message });
  }
});

//add subscriber endpoint
app.post('/api/subscriber', async (req, res) => {
  try {
    const { fullName, email, bookId } = req.body;
    console.log('Received subscriber data:', { fullName, email, bookId }); // Debug log

    // Validate input
    if (!fullName || !email || !bookId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if subscriber already exists for the book
    const [existingSubscriber] = await query(
      'SELECT id FROM subscribers WHERE email = ? AND book_id = ?',
      [email, bookId]
    );

    if (existingSubscriber) {
      return res.status(200).json({ message: 'Email already subscribed to this book', isNew: false });
    }

    // Add new subscriber
    const subscriberId = uuidv4();
    await query(
      'INSERT INTO subscribers (id, name, email, book_id, subscribed_at) VALUES (?, ?, ?, ?, NOW())',
      [subscriberId, fullName, email, bookId]
    );

    res.status(201).json({
      message: 'Subscription successful',
      isNew: true
    });
  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ message: err.message });
  }
});


/* subscriber handler end */ 

// Add Registration endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validate input
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const [existingUser] = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const userId = uuidv4();
    await query(
      'INSERT INTO users (id, full_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [userId, fullName, email, hashedPassword, 'contributor']
    );

    // Get user without password
    const [newUser] = await query(
      'SELECT id, full_name, email, role FROM users WHERE id = ?',
      [userId]
    );

    // Create token
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      process.env.JWT_SECRET || 'not-a-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
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

// Get all users with book counts
app.get('/api/users', async (req, res) => {
  try {
    const users = await query(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.role,
        COUNT(b.id) as book_count
      FROM users u
      LEFT JOIN books b ON u.id = b.user_id
      GROUP BY u.id
      ORDER BY u.full_name
    `);

    // Remove sensitive data
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete user and their books
app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent deleting admin users
    const [user] = await query('SELECT role FROM users WHERE id = ?', [userId]);
    if (user?.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    // Delete user's books first (due to foreign key)
    await query('DELETE FROM books WHERE user_id = ?', [userId]);
    
    // Then delete the user
    await query('DELETE FROM users WHERE id = ?', [userId]);
    
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: err.message });
  }
});

// Export subscribers for a specific book
app.get('/api/subscribers/export/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;

    // Fetch subscribers for the book
    const subscribers = await query(
      'SELECT name, email, subscribed_at FROM subscribers WHERE book_id = ?',
      [bookId]
    );

    if (subscribers.length === 0) {
      return res.status(404).json({ message: 'No subscribers found for this book.' });
    }

    // Generate CSV content
    const csvHeaders = 'Name,Email,Subscribed At\n';
    const csvRows = subscribers.map(sub => `${sub.name},${sub.email},${sub.subscribed_at}`).join('\n');
    const csvContent = csvHeaders + csvRows;

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="subscribers_${bookId}.csv"`);

    res.send(csvContent);
  } catch (err) {
    console.error('Error fetching subscribers:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get subscriber count for a specific book
app.get('/api/subscribers/count/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;

    // Query to count subscribers for the book
    const [result] = await query(
      'SELECT COUNT(*) as count FROM subscribers WHERE book_id = ?',
      [bookId]
    );

    res.json({ count: result.count });
  } catch (err) {
    console.error('Error fetching subscriber count:', err);
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database config: ${JSON.stringify(dbConfig, null, 2)}`);
});