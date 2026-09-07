-- ============================================================
-- CAB MANAGEMENT SYSTEM - SEED DATA
-- Run AFTER schema.sql
-- ============================================================

USE cab_management;

-- -------------------------------------------------------
-- ADMIN  (explicit column list — never rely on positional)
-- -------------------------------------------------------
INSERT INTO ADMIN (ADMIN_ID, ADMIN_NAME, ADMIN_ROLE, ADMIN_EMAIL, ADMIN_PASSWORD)
VALUES
  ('A001', 'Super Admin',        'superadmin', 'admin@cabgo.com', 'admin123'),
  ('A002', 'Operations Manager', 'manager',    'ops@cabgo.com',   'ops123');

-- -------------------------------------------------------
-- CUSTOMERS
-- -------------------------------------------------------
INSERT INTO CUSTOMER (CUST_ID, CUST_NAME, CUST_PHONE, CUST_EMAIL, CUST_ADDRESS, CUST_CITY, CUST_PASSWORD, REG_DATE)
VALUES
  ('C001', 'Amit Sharma',  '9876543210', 'amit@email.com',  '123 MG Road',      'Bangalore', 'pass123', '2024-01-15'),
  ('C002', 'Priya Patel',  '9765432109', 'priya@email.com', '456 FC Road',      'Pune',      'pass123', '2024-02-20'),
  ('C003', 'Rahul Singh',  '9654321098', 'rahul@email.com', '789 CP Area',      'Delhi',     'pass123', '2024-03-10'),
  ('C004', 'Sneha Reddy',  '9543210987', 'sneha@email.com', '321 Banjara Hills','Hyderabad', 'pass123', '2024-03-25'),
  ('C005', 'Kiran Nair',   '9432109876', 'kiran@email.com', '654 Marine Drive', 'Mumbai',    'pass123', '2024-04-01');

-- -------------------------------------------------------
-- DRIVERS
-- -------------------------------------------------------
INSERT INTO DRIVER (DRIVER_ID, DRIVER_NAME, DRIVER_PHONE, LICENSE_NO, VEHICLE_TYPE, VEHICLE_NO, EXPERIENCE, AVAIL_STATUS, VERIFY_STATUS, AVG_RATING, TOTAL_RIDES)
VALUES
  ('D001', 'Suresh Kumar', '9111222333', 'KA01-20234567', 'Sedan',    'KA01AB1234', 5, 'Available', 'Verified', 4.80, 125),
  ('D002', 'Ravi Verma',   '9222333444', 'MH02-20235678', 'SUV',      'MH02CD5678', 3, 'Available', 'Verified', 4.50,  87),
  ('D003', 'Manoj Tiwari', '9333444555', 'DL03-20236789', 'Auto',     'DL03EF9012', 7, 'Busy',      'Verified', 4.20, 210),
  ('D004', 'Anil Gupta',   '9444555666', 'TN04-20237890', 'Premium',  'TN04GH3456', 4, 'Available', 'Pending',  0.00,   0),
  ('D005', 'Vijay Rao',    '9555666777', 'AP05-20238901', 'Sedan',    'AP05IJ7890', 6, 'Available', 'Verified', 4.90, 189),
  ('D006', 'Kiran Mehta',  '9666777888', 'GJ06-20239012', 'Hatchback','GJ06KL2345', 2, 'Offline',   'Verified', 4.10,  45);

-- -------------------------------------------------------
-- RIDES
-- -------------------------------------------------------
INSERT INTO RIDE (RIDE_ID, CUST_ID, DRIVER_ID, PICKUP_LOC, DROP_LOC, RIDE_TYPE, REQUEST_TIME, START_TIME, END_TIME, DISTANCE, FARE, RIDE_STATUS)
VALUES
  ('R001','C001','D001','Airport',       'City Center','Standard','2024-04-10 08:00:00','2024-04-10 08:15:00','2024-04-10 09:00:00',18.00,256.00,'Completed'),
  ('R002','C002','D002','Mall',          'University', 'SUV',     '2024-04-11 10:00:00','2024-04-11 10:10:00','2024-04-11 10:45:00',12.00,256.00,'Completed'),
  ('R003','C003','D005','Train Station', 'Hotel Grand','Premium', '2024-04-12 14:00:00','2024-04-12 14:08:00', NULL,                 8.00,200.00,'Ongoing'),
  ('R004','C004','D001','Office Park',   'Suburb',     'Auto',    '2024-04-12 16:00:00', NULL,                NULL,                 5.00, 80.00,'Accepted'),
  ('R005','C001','D002','Tech Park',     'Medical Center','Standard','2024-04-09 09:00:00','2024-04-09 09:12:00','2024-04-09 09:55:00',15.00,220.00,'Completed'),
  ('R006','C005','D003','Bus Stand',     'Hill View',  'Auto',    '2024-04-11 17:00:00','2024-04-11 17:08:00','2024-04-11 17:30:00', 6.00, 88.00,'Completed');

-- -------------------------------------------------------
-- PAYMENTS
-- -------------------------------------------------------
INSERT INTO PAYMENT (PAYMENT_ID, RIDE_ID, CUST_ID, PAYMENT_AMOUNT, PAYMENT_METHOD, PAYMENT_STATUS, PAYMENT_DATE)
VALUES
  ('P001','R001','C001',256.00,'UPI',    'Completed','2024-04-10 09:05:00'),
  ('P002','R002','C002',256.00,'Card',   'Completed','2024-04-11 10:50:00'),
  ('P003','R005','C001',220.00,'Wallet', 'Completed','2024-04-09 10:00:00'),
  ('P004','R006','C005', 88.00,'Cash',   'Completed','2024-04-11 17:35:00');

-- -------------------------------------------------------
-- FEEDBACK
-- -------------------------------------------------------
INSERT INTO FEEDBACK (FEEDBACK_ID, RIDE_ID, CUST_ID, DRIVER_ID, RATING, COMMENTS, FEEDBACK_DATE)
VALUES
  ('F001','R001','C001','D001', 5,'Excellent service! Very professional and punctual.','2024-04-10 09:10:00'),
  ('F002','R002','C002','D002', 4,'Good ride, clean vehicle. Friendly driver.',        '2024-04-11 11:00:00'),
  ('F003','R005','C001','D002', 5,'Loved the ride! Will book again.',                  '2024-04-09 10:05:00'),
  ('F004','R006','C005','D003', 4,'Decent ride. Knew the routes well.',                '2024-04-11 17:40:00');

-- Verify row counts
SELECT 'ADMIN'    AS tbl, COUNT(*) AS rows FROM ADMIN    UNION ALL
SELECT 'CUSTOMER',       COUNT(*)          FROM CUSTOMER UNION ALL
SELECT 'DRIVER',         COUNT(*)          FROM DRIVER   UNION ALL
SELECT 'RIDE',           COUNT(*)          FROM RIDE     UNION ALL
SELECT 'PAYMENT',        COUNT(*)          FROM PAYMENT  UNION ALL
SELECT 'FEEDBACK',       COUNT(*)          FROM FEEDBACK;
