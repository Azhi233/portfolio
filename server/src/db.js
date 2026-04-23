import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbHost = process.env.DB_HOST || process.env.BAOTA_DB_HOST || process.env.MYSQL_HOST || '127.0.0.1';
const dbUser = process.env.DB_USER || process.env.BAOTA_DB_USER || process.env.MYSQL_USER || 'mywebsite';
const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS || process.env.BAOTA_DB_PASSWORD || process.env.MYSQL_PASSWORD || '';
const dbName = process.env.DB_NAME || process.env.BAOTA_DB_NAME || process.env.MYSQL_DATABASE || 'mywebsite';
const dbPort = Number(process.env.DB_PORT || process.env.BAOTA_DB_PORT || process.env.MYSQL_PORT || 3306);

export const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: Number.isFinite(dbPort) && dbPort > 0 ? dbPort : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function initDB() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS global_config (
      key_name VARCHAR(191) PRIMARY KEY,
      json_value LONGTEXT NOT NULL
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(255) NULL,
      role VARCHAR(255) NULL,
      release_date VARCHAR(64) NULL,
      cover_url TEXT NULL,
      cover_asset_url TEXT NULL,
      cover_asset_object_name VARCHAR(512) NULL,
      cover_asset_file_type VARCHAR(128) NULL,
      cover_asset_is_private TINYINT(1) NOT NULL DEFAULT 0,
      thumbnail_url TEXT NULL,
      video_url TEXT NULL,
      main_video_url TEXT NULL,
      bts_media_json LONGTEXT NULL,
      client_agency VARCHAR(255) NULL,
      client_code VARCHAR(255) NULL,
      is_featured TINYINT(1) NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      description LONGTEXT NULL,
      credits LONGTEXT NULL,
      is_visible TINYINT(1) NOT NULL DEFAULT 1,
      publish_status VARCHAR(64) NULL,
      visibility VARCHAR(64) NULL,
      access_password VARCHAR(255) NULL,
      delivery_pin VARCHAR(255) NULL,
      status VARCHAR(64) NULL,
      password VARCHAR(255) NULL,
      private_files_json LONGTEXT NULL,
      outline_tags_json LONGTEXT NULL,
      content_json LONGTEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(191) PRIMARY KEY,
      username VARCHAR(191) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(64) NOT NULL DEFAULT 'admin',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS media_assets (
      id VARCHAR(191) PRIMARY KEY,
      kind VARCHAR(64) NOT NULL,
      url TEXT NOT NULL,
      meta_json LONGTEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(191) PRIMARY KEY,
      payload_json LONGTEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS review_audit_logs (
      id VARCHAR(191) PRIMARY KEY,
      payload_json LONGTEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS project_unlocks (
      project_id VARCHAR(191) PRIMARY KEY,
      unlocked TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS delivery_unlocks (
      project_id VARCHAR(191) PRIMARY KEY,
      unlocked TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS video_transcode_tasks (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      task_id VARCHAR(191) NOT NULL UNIQUE,
      status VARCHAR(32) NOT NULL,
      original_path VARCHAR(1024) NOT NULL,
      target_url TEXT NULL,
      error_msg TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_video_transcode_tasks_status (status),
      KEY idx_video_transcode_tasks_created_at (created_at)
    )
  `);
}

export async function testConnection() {
  try {
    await pool.query('SELECT 1 + 1 AS result');
    console.log('✅ MySQL 连接成功');
    return true;
  } catch (error) {
    console.error('❌ MySQL 连接失败:', error.message);
    return false;
  }
}

