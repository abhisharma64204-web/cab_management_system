-- ============================================================
-- CAB MANAGEMENT SYSTEM - DATABASE SCHEMA  (MySQL 8.0+)
-- Run this file FIRST, then seed.sql
-- ============================================================

-- Always start clean (drop if exists, create fresh)
DROP DATABASE IF EXISTS cab_management;
CREATE DATABASE cab_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cab_management;

-- -------------------------------------------------------
-- 1. ADMIN TABLE
-- -------------------------------------------------------
CREATE TABLE ADMIN (
    ADMIN_ID       VARCHAR(10)  NOT NULL,
    ADMIN_NAME     VARCHAR(100) NOT NULL,
    ADMIN_ROLE     VARCHAR(20)  NOT NULL DEFAULT 'manager',
    ADMIN_EMAIL    VARCHAR(100) NOT NULL,
    ADMIN_PASSWORD VARCHAR(255) NOT NULL,
    CREATED_AT     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ADMIN_ID),
    UNIQUE KEY uq_admin_email (ADMIN_EMAIL)
);

-- -------------------------------------------------------
-- 2. CUSTOMER TABLE
-- -------------------------------------------------------
CREATE TABLE CUSTOMER (
    CUST_ID       VARCHAR(10)  NOT NULL,
    CUST_NAME     VARCHAR(100) NOT NULL,
    CUST_PHONE    VARCHAR(15)  NOT NULL,
    CUST_EMAIL    VARCHAR(100) NOT NULL,
    CUST_ADDRESS  VARCHAR(255) DEFAULT '',
    CUST_CITY     VARCHAR(100) DEFAULT '',
    CUST_PASSWORD VARCHAR(255) NOT NULL,
    REG_DATE      DATE         NOT NULL,
    IS_ACTIVE     TINYINT(1)   NOT NULL DEFAULT 1,
    CREATED_AT    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (CUST_ID),
    UNIQUE KEY uq_cust_phone (CUST_PHONE),
    UNIQUE KEY uq_cust_email (CUST_EMAIL)
);

-- -------------------------------------------------------
-- 3. DRIVER TABLE
-- -------------------------------------------------------
CREATE TABLE DRIVER (
    DRIVER_ID     VARCHAR(10)   NOT NULL,
    DRIVER_NAME   VARCHAR(100)  NOT NULL,
    DRIVER_PHONE  VARCHAR(15)   NOT NULL,
    LICENSE_NO    VARCHAR(30)   NOT NULL,
    VEHICLE_TYPE  VARCHAR(20)   NOT NULL DEFAULT 'Sedan',
    VEHICLE_NO    VARCHAR(20)   NOT NULL,
    EXPERIENCE    INT           NOT NULL DEFAULT 0,
    AVAIL_STATUS  VARCHAR(15)   NOT NULL DEFAULT 'Offline',
    VERIFY_STATUS VARCHAR(15)   NOT NULL DEFAULT 'Pending',
    AVG_RATING    DECIMAL(3,2)  NOT NULL DEFAULT 0.00,
    TOTAL_RIDES   INT           NOT NULL DEFAULT 0,
    CREATED_AT    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (DRIVER_ID),
    UNIQUE KEY uq_driver_phone   (DRIVER_PHONE),
    UNIQUE KEY uq_driver_license (LICENSE_NO),
    UNIQUE KEY uq_driver_vehicle (VEHICLE_NO)
);

-- -------------------------------------------------------
-- 4. RIDE TABLE
-- -------------------------------------------------------
CREATE TABLE RIDE (
    RIDE_ID      VARCHAR(10)   NOT NULL,
    CUST_ID      VARCHAR(10)   NOT NULL,
    DRIVER_ID    VARCHAR(10)   NULL,
    PICKUP_LOC   VARCHAR(255)  NOT NULL,
    DROP_LOC     VARCHAR(255)  NOT NULL,
    RIDE_TYPE    VARCHAR(20)   NOT NULL DEFAULT 'Standard',
    REQUEST_TIME TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    START_TIME   TIMESTAMP     NULL,
    END_TIME     TIMESTAMP     NULL,
    DISTANCE     DECIMAL(8,2)  NOT NULL DEFAULT 0.00,
    FARE         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    RIDE_STATUS  VARCHAR(15)   NOT NULL DEFAULT 'Pending',
    CREATED_AT   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (RIDE_ID),
    KEY idx_ride_cust   (CUST_ID),
    KEY idx_ride_driver (DRIVER_ID),
    KEY idx_ride_status (RIDE_STATUS),
    CONSTRAINT fk_ride_cust   FOREIGN KEY (CUST_ID)   REFERENCES CUSTOMER(CUST_ID)  ON DELETE CASCADE,
    CONSTRAINT fk_ride_driver FOREIGN KEY (DRIVER_ID) REFERENCES DRIVER(DRIVER_ID)  ON DELETE SET NULL
);

-- -------------------------------------------------------
-- 5. PAYMENT TABLE
-- -------------------------------------------------------
CREATE TABLE PAYMENT (
    PAYMENT_ID     VARCHAR(10)   NOT NULL,
    RIDE_ID        VARCHAR(10)   NOT NULL,
    CUST_ID        VARCHAR(10)   NOT NULL,
    PAYMENT_AMOUNT DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    PAYMENT_METHOD VARCHAR(20)   NOT NULL DEFAULT 'Cash',
    PAYMENT_STATUS VARCHAR(15)   NOT NULL DEFAULT 'Pending',
    PAYMENT_DATE   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (PAYMENT_ID),
    UNIQUE KEY uq_pay_ride (RIDE_ID),
    KEY idx_pay_cust (CUST_ID),
    CONSTRAINT fk_pay_ride FOREIGN KEY (RIDE_ID) REFERENCES RIDE(RIDE_ID)     ON DELETE CASCADE,
    CONSTRAINT fk_pay_cust FOREIGN KEY (CUST_ID) REFERENCES CUSTOMER(CUST_ID) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- 6. FEEDBACK TABLE
-- -------------------------------------------------------
CREATE TABLE FEEDBACK (
    FEEDBACK_ID   VARCHAR(10) NOT NULL,
    RIDE_ID       VARCHAR(10) NOT NULL,
    CUST_ID       VARCHAR(10) NOT NULL,
    DRIVER_ID     VARCHAR(10) NOT NULL,
    RATING        INT         NOT NULL DEFAULT 5,
    COMMENTS      TEXT,
    FEEDBACK_DATE TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (FEEDBACK_ID),
    UNIQUE KEY uq_fb_ride (RIDE_ID),
    KEY idx_fb_driver (DRIVER_ID),
    CONSTRAINT fk_fb_ride   FOREIGN KEY (RIDE_ID)   REFERENCES RIDE(RIDE_ID)     ON DELETE CASCADE,
    CONSTRAINT fk_fb_cust   FOREIGN KEY (CUST_ID)   REFERENCES CUSTOMER(CUST_ID) ON DELETE CASCADE,
    CONSTRAINT fk_fb_driver FOREIGN KEY (DRIVER_ID) REFERENCES DRIVER(DRIVER_ID) ON DELETE CASCADE
);

-- Confirm tables were created
SHOW TABLES;
