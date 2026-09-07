-- Cab Management System (Quick Lab Demo)
-- MySQL 8.0 | Keep this script small and practical for 30 min implementation.

DROP DATABASE IF EXISTS cab_lab;
CREATE DATABASE cab_lab;
USE cab_lab;

-- 1) Core tables
CREATE TABLE riders (
  rider_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(80) NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE,
  rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE drivers (
  driver_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(80) NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE,
  license_no VARCHAR(30) NOT NULL UNIQUE,
  status ENUM('online','offline','busy') NOT NULL DEFAULT 'offline',
  rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cabs (
  cab_id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  car_number VARCHAR(20) NOT NULL UNIQUE,
  car_type ENUM('mini','sedan','suv') NOT NULL,
  seats TINYINT NOT NULL DEFAULT 4,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (driver_id) REFERENCES drivers(driver_id)
);

CREATE TABLE ride_requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  rider_id INT NOT NULL,
  pickup VARCHAR(120) NOT NULL,
  drop_point VARCHAR(120) NOT NULL,
  status ENUM('open','matched','canceled') NOT NULL DEFAULT 'open',
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rider_id) REFERENCES riders(rider_id)
);

CREATE TABLE trips (
  trip_id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL UNIQUE,
  rider_id INT NOT NULL,
  driver_id INT NOT NULL,
  cab_id INT NOT NULL,
  state ENUM('assigned','ongoing','completed','canceled') NOT NULL DEFAULT 'assigned',
  fare DECIMAL(8,2) DEFAULT NULL,
  start_time DATETIME DEFAULT NULL,
  end_time DATETIME DEFAULT NULL,
  distance_km DECIMAL(6,2) DEFAULT NULL,
  FOREIGN KEY (request_id) REFERENCES ride_requests(request_id),
  FOREIGN KEY (rider_id) REFERENCES riders(rider_id),
  FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
  FOREIGN KEY (cab_id) REFERENCES cabs(cab_id)
);

CREATE TABLE payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL UNIQUE,
  method ENUM('cash','upi','card') NOT NULL,
  amount DECIMAL(8,2) NOT NULL,
  payment_state ENUM('pending','captured','failed') NOT NULL DEFAULT 'pending',
  paid_at DATETIME DEFAULT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
);

-- 2) Useful indexes for fast demo queries
CREATE INDEX idx_rr_status ON ride_requests(status);
CREATE INDEX idx_trips_state ON trips(state);
CREATE INDEX idx_pay_state ON payments(payment_state);

-- 3) Sample data
INSERT INTO riders (full_name, phone, rating) VALUES
('Anjali sharma', '+919999000001', 4.9),
('Rahul Mehta', '+919999000002', 4.7),
('Neha Iyer', '+919999000003', 4.8);

INSERT INTO drivers (full_name, phone, license_no, status, rating) VALUES
('Arjun Patil', '+918888000001', 'KA01D9001', 'online', 4.9),
('Naveen Kumar', '+918888000002', 'KA01D9002', 'busy', 4.6),
('Aman singh', '+918888000003', 'MH01D9003', 'online', 4.8);

INSERT INTO cabs (driver_id, car_number, car_type, seats, is_active) VALUES
(1, 'KA01AB1234', 'sedan', 4, 1),
(2, 'KA05CD5678', 'mini', 4, 1),
(3, 'MH01EF1122', 'suv', 6, 1);

INSERT INTO ride_requests (rider_id, pickup, drop_point, status, requested_at) VALUES
(1, 'MG Road Metro', 'HSR Layout Sector 2', 'matched', '2026-04-05 09:50:00'),
(2, 'Koramangala 4th Block', 'Whitefield Main Road', 'matched', '2026-04-05 10:00:00'),
(3, 'Bandra Reclamation', 'Powai Lake Front', 'open', '2026-04-05 10:10:00');

INSERT INTO trips (request_id, rider_id, driver_id, cab_id, state, fare, start_time, end_time, distance_km) VALUES
(1, 1, 1, 1, 'completed', 340.00, '2026-04-05 09:55:00', '2026-04-05 10:28:00', 14.20),
(2, 2, 2, 2, 'ongoing', NULL, '2026-04-05 10:05:00', NULL, 6.40);

INSERT INTO payments (trip_id, method, amount, payment_state, paid_at) VALUES
(1, 'upi', 340.00, 'captured', '2026-04-05 10:28:30'),
(2, 'cash', 0.00, 'pending', NULL);

-- 4) Quick simulation (run these during demo)
-- Complete trip #2 and capture payment.
UPDATE trips
SET state = 'completed', fare = 290.00, end_time = NOW(), distance_km = 11.20
WHERE trip_id = 2;

select * from trips;

UPDATE payments
SET amount = 290.00, payment_state = 'captured', paid_at = NOW()
WHERE trip_id = 2;

select * from payments;

UPDATE drivers
SET status = 'online'
WHERE driver_id = 2;

select * from drivers;

-- 5) Demo queries (show these outputs)
-- Q1: Online drivers with cabs
SELECT d.driver_id, d.full_name, d.status, c.car_number, c.car_type
FROM drivers d
JOIN cabs c ON c.driver_id = d.driver_id
WHERE d.status = 'online';



-- Q2: All ride requests with rider name
SELECT rr.request_id, r.full_name AS rider, rr.pickup, rr.drop_point, rr.status, rr.requested_at
FROM ride_requests rr
JOIN riders r ON r.rider_id = rr.rider_id
ORDER BY rr.request_id;

-- Q3: Trip details with rider + driver
SELECT t.trip_id, r.full_name AS rider, d.full_name AS driver, c.car_number, t.state, t.fare
FROM trips t
JOIN riders r ON r.rider_id = t.rider_id
JOIN drivers d ON d.driver_id = t.driver_id
JOIN cabs c ON c.cab_id = t.cab_id
ORDER BY t.trip_id;

-- Q4: Payment status per trip
SELECT p.payment_id, t.trip_id, p.method, p.amount, p.payment_state, p.paid_at
FROM payments p
JOIN trips t ON t.trip_id = p.trip_id
ORDER BY p.payment_id;

-- Q5: Mini dashboard
SELECT
  COUNT(*) AS total_trips,
  SUM(CASE WHEN state = 'completed' THEN 1 ELSE 0 END) AS completed_trips,
  ROUND(SUM(CASE WHEN state = 'completed' THEN fare ELSE 0 END), 2) AS total_revenue
FROM trips;
