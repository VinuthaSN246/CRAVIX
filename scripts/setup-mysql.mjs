import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'vinu@123',
  multipleStatements: true,
};

async function runSqlFile(conn, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  await conn.query(sql);
  console.log(`✓ Ran ${path.basename(filePath)}`);
}

async function seedUsers(conn) {
  const users = [
    { id: 'mock-admin-uuid-1111', email: 'admin@gmail.com', password: 'admin123' },
    { id: 'mock-customer-uuid-2222', email: 'john@gmail.com', password: 'password123' },
    { id: 'mock-customer-uuid-3333', email: 'sarah@gmail.com', password: 'password123' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await conn.query(
      `INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE email = VALUES(email), password_hash = VALUES(password_hash)`,
      [u.id, u.email, hash],
    );
  }
  console.log('✓ Seeded users with bcrypt passwords');
}

async function main() {
  console.log(`Connecting to MySQL at ${config.host}:${config.port} as ${config.user}...`);
  const conn = await mysql.createConnection(config);

  await runSqlFile(conn, path.join(root, 'mysql', 'schema.sql'));
  await conn.query('USE cravix');
  await seedUsers(conn);
  await runSqlFile(conn, path.join(root, 'mysql', 'seed.sql'));

  await conn.end();
  console.log('\n✅ CRAVIX MySQL database ready!');
  console.log('   Database name: cravix');
  console.log('   Admin login:   admin@gmail.com / admin123');
  console.log('   Customer login: john@gmail.com / password123');
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
