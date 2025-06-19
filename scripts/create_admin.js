import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const createSuperAdmin = async () => {
  const password = '[A]dmin{777}'; // Change this to your desired password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'saas',
    password: '19283764x!',
    database: 'book_saas'
  });

  try {
    await connection.execute(
      `INSERT INTO users (full_name, email, password, role) 
       VALUES (?, ?, ?, ?)`,
      ['Super Admin', 'admin@example.com', hashedPassword, 'admin']
    );
    console.log('Super Admin created successfully!');
  } catch (error) {
    console.error('Error creating Super Admin:', error);
  } finally {
    await connection.end();
  }
};

createSuperAdmin();
