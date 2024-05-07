-- Create db calculator
CREATE DATABASE calculator;
-- Create user
CREATE USER 'mtribino'@'localhost' IDENTIFIED BY 'mtribino18';
-- Grant access to db
GRANT ALL ON calculator.* TO 'mtribino'@'localhost';
-- Create Tables
-- Using sequelize instead of this
CREATE TABLE IF NOT EXISTS User (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Operation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('addition', 'subtraction', 'multiplication', 'division', 'square', 'root', 'random_string') NOT NULL,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Record (
  id INT AUTO_INCREMENT PRIMARY KEY,
  operation_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  user_balance DECIMAL(10, 2) NOT NULL,
  operation_response TEXT,
  date DATETIME NOT NULL,
  FOREIGN KEY (operation_id) REFERENCES Operation(id),
  FOREIGN KEY (user_id) REFERENCES User(id)
);

-- Insert sample users
INSERT INTO User (username, password, status, balance) VALUES
('mtribino', 'mtribino8', 'active', 100.00),
('truenorth', 'truenorth', 'active', 500.00),
('inactiveuser', 'inactiveuser', 'inactive', 0.00);

-- Insert sample operations
INSERT INTO Operation (id, type, cost) VALUES
(1, 'addition', 1.00),
(2, 'subtraction', 1.00),
(3, 'multiplication', 2.00),
(4, 'division', 2.00),
(5, 'square_root', 3.00),
(6, 'random_string', 5.00);