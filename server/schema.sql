-- ============================================================
-- CampusBite Database Schema
-- Run this file once against MySQL 8.x:
--   mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS campusbite
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campusbite;

-- ── Users (students authenticated via Google OAuth) ──────────
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  google_id   VARCHAR(128)    UNIQUE NOT NULL,
  name        VARCHAR(128)    NOT NULL,
  email       VARCHAR(256)    UNIQUE NOT NULL,
  avatar_url  VARCHAR(512),
  created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Admins (shop owners: username + bcrypt password) ─────────
CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(64)   UNIQUE NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  shop_name     VARCHAR(128)  NOT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Places (one admin → one place) ───────────────────────────
CREATE TABLE IF NOT EXISTS places (
  id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  admin_id    INT UNSIGNED  NOT NULL,
  name        VARCHAR(128)  NOT NULL,
  description VARCHAR(512),
  image_url   VARCHAR(512),
  is_open     TINYINT(1)    DEFAULT 1,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Items (menu items per place) ─────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  id           INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
  place_id     INT UNSIGNED   NOT NULL,
  name         VARCHAR(128)   NOT NULL,
  price        DECIMAL(10,2)  NOT NULL,
  quantity     INT UNSIGNED   DEFAULT 0,
  category     VARCHAR(64),
  image_url    VARCHAR(512),
  is_available TINYINT(1)     DEFAULT 1,
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Orders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                   INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
  user_id              INT UNSIGNED   NOT NULL,
  place_id             INT UNSIGNED   NOT NULL,
  total_amount         DECIMAL(10,2)  NOT NULL,
  status               ENUM('pending','paid','delivered','failed') DEFAULT 'pending',
  razorpay_order_id    VARCHAR(128),
  razorpay_payment_id  VARCHAR(128),
  qr_token             CHAR(36)       UNIQUE,
  created_at           TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  delivered_at         TIMESTAMP      NULL,
  INDEX idx_orders_qr_token   (qr_token),
  INDEX idx_orders_user_status (user_id, status),
  FOREIGN KEY (user_id)  REFERENCES users(id),
  FOREIGN KEY (place_id) REFERENCES places(id)
) ENGINE=InnoDB;

-- ── Order Items (price+name frozen at order time) ────────────
CREATE TABLE IF NOT EXISTS order_items (
  id        INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
  order_id  INT UNSIGNED   NOT NULL,
  item_id   INT UNSIGNED   NOT NULL,
  name      VARCHAR(128)   NOT NULL,
  price     DECIMAL(10,2)  NOT NULL,
  quantity  INT UNSIGNED   NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id)  REFERENCES items(id)
) ENGINE=InnoDB;
