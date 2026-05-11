-- Run this file in MySQL Workbench or phpMyAdmin to set up the database

CREATE DATABASE IF NOT EXISTS appsteam;
USE appsteam;

-- USER table
CREATE TABLE IF NOT EXISTS USER (
  user_id      INT PRIMARY KEY AUTO_INCREMENT,
  username     VARCHAR(50)  NOT NULL,
  email        VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role         ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  profile_pic  VARCHAR(255),
  created_at   DATETIME DEFAULT NOW()
);

-- GAME table
CREATE TABLE IF NOT EXISTS GAME (
  game_id      INT PRIMARY KEY AUTO_INCREMENT,
  title        VARCHAR(100) NOT NULL,
  description  TEXT,
  price        DECIMAL(10,2) NOT NULL,
  genre        VARCHAR(50),
  cover_image  VARCHAR(255),
  stock        INT DEFAULT 0,
  created_at   DATETIME DEFAULT NOW()
);

-- CART table
CREATE TABLE IF NOT EXISTS CART (
  cart_id    INT PRIMARY KEY AUTO_INCREMENT,
  user_id    INT NOT NULL,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
);

-- CART_ITEM table
CREATE TABLE IF NOT EXISTS CART_ITEM (
  cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
  cart_id      INT NOT NULL,
  game_id      INT NOT NULL,
  quantity     INT DEFAULT 1,
  FOREIGN KEY (cart_id) REFERENCES CART(cart_id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES GAME(game_id) ON DELETE CASCADE
);

-- ORDER table
CREATE TABLE IF NOT EXISTS `ORDER` (
  order_id     INT PRIMARY KEY AUTO_INCREMENT,
  user_id      INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status       ENUM('pending','completed','cancelled') DEFAULT 'pending',
  created_at   DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
);

-- ORDER_ITEM table
CREATE TABLE IF NOT EXISTS ORDER_ITEM (
  order_item_id     INT PRIMARY KEY AUTO_INCREMENT,
  order_id          INT NOT NULL,
  game_id           INT NOT NULL,
  price_at_purchase DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES `ORDER`(order_id) ON DELETE CASCADE,
  FOREIGN KEY (game_id)  REFERENCES GAME(game_id) ON DELETE CASCADE
);

-- PAYMENT table
CREATE TABLE IF NOT EXISTS PAYMENT (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  order_id   INT NOT NULL,
  method     ENUM('credit_card','gcash','paypal') NOT NULL,
  status     ENUM('paid','failed','refunded') DEFAULT 'paid',
  amount     DECIMAL(10,2) NOT NULL,
  paid_at    DATETIME DEFAULT NOW(),
  FOREIGN KEY (order_id) REFERENCES `ORDER`(order_id) ON DELETE CASCADE
);

-- Sample admin account (password: admin123)
INSERT IGNORE INTO USER (username, email, password_hash, role)
VALUES ('admin', 'admin@appsteam.com',
  '$2a$10$YourHashedPasswordHere', 'admin');

-- Sample games
INSERT IGNORE INTO GAME (title, description, price, genre, cover_image, stock) VALUES
('Hollow Knight', 'A challenging action-adventure game set in a vast underground kingdom.', 299.00, 'Indie', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Hollow_Knight_first_cover_art.webp/220px-Hollow_Knight_first_cover_art.webp.png', 100),
('Hades', 'Battle out of the Underworld in this rogue-like dungeon crawler.', 599.00, 'RPG', 'https://upload.wikimedia.org/wikipedia/en/c/cc/Hades_cover_art.jpg', 100),
('Stardew Valley', 'Build the farm of your dreams in this relaxing farming RPG.', 249.00, 'Simulation', 'https://upload.wikimedia.org/wikipedia/en/f/fd/Logo_of_Stardew_Valley.png', 100),
('Celeste', 'Help Madeline survive her inner demons on her journey to the top of Celeste Mountain.', 349.00, 'Indie', NULL, 100),
('Terraria', 'Dig, fight, explore and build in this 2D adventure game.', 199.00, 'Sandbox', NULL, 100);
