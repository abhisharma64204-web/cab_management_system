-- Cab Management System
-- MySQL 8.0+ schema, constraints, triggers, indexes, and sample data.
-- Execute this entire script in MySQL Workbench.

DROP DATABASE IF EXISTS cab_management;
CREATE DATABASE cab_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE cab_management;

SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- =========================================================
-- 1) Master and Reference Tables
-- =========================================================

CREATE TABLE city (
    city_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    city_name VARCHAR(80) NOT NULL,
    state_name VARCHAR(80) NOT NULL,
    country_code CHAR(2) NOT NULL DEFAULT 'IN',
    time_zone VARCHAR(40) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (city_id),
    UNIQUE KEY uk_city_name_country (city_name, country_code)
) ENGINE=InnoDB;

CREATE TABLE service_type (
    service_type_id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    service_code VARCHAR(20) NOT NULL,
    display_name VARCHAR(40) NOT NULL,
    min_seating_capacity TINYINT UNSIGNED NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (service_type_id),
    UNIQUE KEY uk_service_code (service_code),
    CHECK (min_seating_capacity >= 1)
) ENGINE=InnoDB;

CREATE TABLE cancellation_reason (
    cancellation_reason_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    reason_code VARCHAR(40) NOT NULL,
    reason_description VARCHAR(200) NOT NULL,
    applicable_actor VARCHAR(20) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (cancellation_reason_id),
    UNIQUE KEY uk_cancellation_reason_code (reason_code),
    CHECK (applicable_actor IN ('rider', 'driver', 'system', 'ops'))
) ENGINE=InnoDB;

CREATE TABLE location_reference (
    location_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    city_id SMALLINT UNSIGNED NOT NULL,
    label VARCHAR(120) NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    area VARCHAR(100) NOT NULL,
    postal_code VARCHAR(12) NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (location_id),
    KEY idx_location_city (city_id),
    KEY idx_location_lat_lng (latitude, longitude),
    CONSTRAINT fk_location_city
        FOREIGN KEY (city_id) REFERENCES city(city_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================================================
-- 2) Rider / Driver / Vehicle Domain
-- =========================================================

CREATE TABLE rider (
    rider_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    phone_e164 VARCHAR(20) NOT NULL,
    email VARCHAR(120) NULL,
    rating_average DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    rating_count INT UNSIGNED NOT NULL DEFAULT 0,
    account_status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (rider_id),
    UNIQUE KEY uk_rider_phone (phone_e164),
    UNIQUE KEY uk_rider_email (email),
    CHECK (rating_average >= 0 AND rating_average <= 5),
    CHECK (account_status IN ('active', 'blocked', 'deleted'))
) ENGINE=InnoDB;

CREATE TABLE driver (
    driver_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    phone_e164 VARCHAR(20) NOT NULL,
    email VARCHAR(120) NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    service_city_id SMALLINT UNSIGNED NOT NULL,
    driver_status VARCHAR(20) NOT NULL DEFAULT 'active',
    license_number VARCHAR(40) NOT NULL,
    rating_average DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    rating_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (driver_id),
    UNIQUE KEY uk_driver_phone (phone_e164),
    UNIQUE KEY uk_driver_email (email),
    UNIQUE KEY uk_driver_license (license_number),
    KEY idx_driver_city_status (service_city_id, driver_status),
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    CHECK (driver_status IN ('active', 'inactive', 'suspended')),
    CHECK (rating_average >= 0 AND rating_average <= 5),
    CONSTRAINT fk_driver_city
        FOREIGN KEY (service_city_id) REFERENCES city(city_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE vehicle (
    vehicle_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    registration_number VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL,
    brand_model VARCHAR(80) NOT NULL,
    model_year SMALLINT UNSIGNED NOT NULL,
    seating_capacity TINYINT UNSIGNED NOT NULL,
    compliance_status VARCHAR(20) NOT NULL DEFAULT 'compliant',
    current_driver_id BIGINT UNSIGNED NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (vehicle_id),
    UNIQUE KEY uk_vehicle_registration (registration_number),
    KEY idx_vehicle_current_driver (current_driver_id),
    CHECK (vehicle_type IN ('hatchback', 'sedan', 'suv', 'bike', 'ev')),
    CHECK (seating_capacity >= 1),
    CHECK (compliance_status IN ('compliant', 'expired', 'suspended')),
    CONSTRAINT fk_vehicle_current_driver
        FOREIGN KEY (current_driver_id) REFERENCES driver(driver_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE driver_vehicle_assignment (
    driver_vehicle_assignment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    driver_id BIGINT UNSIGNED NOT NULL,
    vehicle_id BIGINT UNSIGNED NOT NULL,
    start_at DATETIME(3) NOT NULL,
    end_at DATETIME(3) NULL,
    assignment_note VARCHAR(200) NULL,
    active_driver_id BIGINT UNSIGNED GENERATED ALWAYS AS (
        CASE WHEN end_at IS NULL THEN driver_id ELSE NULL END
    ) STORED,
    active_vehicle_id BIGINT UNSIGNED GENERATED ALWAYS AS (
        CASE WHEN end_at IS NULL THEN vehicle_id ELSE NULL END
    ) STORED,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (driver_vehicle_assignment_id),
    KEY idx_driver_vehicle_driver_time (driver_id, start_at),
    KEY idx_driver_vehicle_vehicle_time (vehicle_id, start_at),
    UNIQUE KEY uk_assignment_one_active_driver (active_driver_id),
    UNIQUE KEY uk_assignment_one_active_vehicle (active_vehicle_id),
    CHECK (end_at IS NULL OR end_at > start_at),
    CONSTRAINT fk_assignment_driver
        FOREIGN KEY (driver_id) REFERENCES driver(driver_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_assignment_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE driver_service_type (
    driver_id BIGINT UNSIGNED NOT NULL,
    service_type_id TINYINT UNSIGNED NOT NULL,
    enabled_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (driver_id, service_type_id),
    KEY idx_driver_service_type (service_type_id),
    CONSTRAINT fk_driver_service_driver
        FOREIGN KEY (driver_id) REFERENCES driver(driver_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_driver_service_type
        FOREIGN KEY (service_type_id) REFERENCES service_type(service_type_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =========================================================
-- 3) Ride Request, Assignment, Trip Lifecycle
-- =========================================================

CREATE TABLE ride_request (
    ride_request_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    rider_id BIGINT UNSIGNED NOT NULL,
    pickup_location_id BIGINT UNSIGNED NOT NULL,
    drop_location_id BIGINT UNSIGNED NOT NULL,
    city_id SMALLINT UNSIGNED NOT NULL,
    service_type_id TINYINT UNSIGNED NOT NULL,
    request_status VARCHAR(20) NOT NULL DEFAULT 'open',
    requested_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    expire_at DATETIME(3) NOT NULL,
    canceled_by_actor VARCHAR(20) NULL,
    cancellation_reason_id SMALLINT UNSIGNED NULL,
    estimated_distance_km DECIMAL(6,2) NULL,
    estimated_duration_minutes SMALLINT UNSIGNED NULL,
    special_instructions VARCHAR(255) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (ride_request_id),
    KEY idx_request_status_time (request_status, requested_at),
    KEY idx_request_city_service_status (city_id, service_type_id, request_status),
    KEY idx_request_rider_time (rider_id, requested_at),
    KEY idx_request_expire_at (expire_at),
    CHECK (request_status IN ('open', 'matched', 'expired', 'canceled', 'fulfilled')),
    CHECK (expire_at > requested_at),
    CHECK (pickup_location_id <> drop_location_id),
    CHECK (request_status NOT IN ('canceled', 'expired') OR canceled_by_actor IS NOT NULL),
    CHECK (request_status NOT IN ('canceled', 'expired') OR cancellation_reason_id IS NOT NULL),
    CHECK (canceled_by_actor IS NULL OR canceled_by_actor IN ('rider', 'driver', 'system', 'ops')),
    CONSTRAINT fk_request_rider
        FOREIGN KEY (rider_id) REFERENCES rider(rider_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_request_pickup_location
        FOREIGN KEY (pickup_location_id) REFERENCES location_reference(location_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_request_drop_location
        FOREIGN KEY (drop_location_id) REFERENCES location_reference(location_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_request_city
        FOREIGN KEY (city_id) REFERENCES city(city_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_request_service_type
        FOREIGN KEY (service_type_id) REFERENCES service_type(service_type_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_request_cancel_reason
        FOREIGN KEY (cancellation_reason_id) REFERENCES cancellation_reason(cancellation_reason_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE ride_assignment (
    ride_assignment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ride_request_id BIGINT UNSIGNED NOT NULL,
    driver_id BIGINT UNSIGNED NOT NULL,
    assignment_state VARCHAR(20) NOT NULL,
    offered_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    responded_at DATETIME(3) NULL,
    selection_rank SMALLINT UNSIGNED NOT NULL,
    response_note VARCHAR(255) NULL,
    accepted_request_id BIGINT UNSIGNED GENERATED ALWAYS AS (
        CASE WHEN assignment_state = 'accepted' THEN ride_request_id ELSE NULL END
    ) STORED,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (ride_assignment_id),
    UNIQUE KEY uk_assignment_rank_per_request (ride_request_id, selection_rank),
    UNIQUE KEY uk_single_accepted_assignment_per_request (accepted_request_id),
    KEY idx_assignment_driver_state_time (driver_id, assignment_state, offered_at),
    KEY idx_assignment_request_time (ride_request_id, offered_at),
    CHECK (assignment_state IN ('offered', 'accepted', 'rejected', 'timed_out', 'canceled')),
    CHECK ((assignment_state = 'offered' AND responded_at IS NULL) OR (assignment_state <> 'offered' AND responded_at IS NOT NULL)),
    CHECK (responded_at IS NULL OR responded_at >= offered_at),
    CHECK (selection_rank >= 1),
    CONSTRAINT fk_assignment_request
        FOREIGN KEY (ride_request_id) REFERENCES ride_request(ride_request_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_assignment_driver_ref
        FOREIGN KEY (driver_id) REFERENCES driver(driver_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE trip (
    trip_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ride_request_id BIGINT UNSIGNED NOT NULL,
    assigned_driver_id BIGINT UNSIGNED NOT NULL,
    rider_id BIGINT UNSIGNED NOT NULL,
    trip_state VARCHAR(20) NOT NULL,
    started_at DATETIME(3) NULL,
    ended_at DATETIME(3) NULL,
    canceled_at DATETIME(3) NULL,
    cancellation_reason_id SMALLINT UNSIGNED NULL,
    distance_km DECIMAL(8,2) NULL,
    duration_seconds INT UNSIGNED NULL,
    last_state_actor_type VARCHAR(20) NOT NULL DEFAULT 'system',
    last_state_reason_code VARCHAR(40) NULL,
    last_state_reason_text VARCHAR(255) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    active_driver_id BIGINT UNSIGNED GENERATED ALWAYS AS (
        CASE WHEN trip_state IN ('assigned', 'driver_arrived', 'ongoing') THEN assigned_driver_id ELSE NULL END
    ) STORED,
    active_rider_id BIGINT UNSIGNED GENERATED ALWAYS AS (
        CASE WHEN trip_state IN ('assigned', 'driver_arrived', 'ongoing') THEN rider_id ELSE NULL END
    ) STORED,
    PRIMARY KEY (trip_id),
    UNIQUE KEY uk_trip_per_request (ride_request_id),
    UNIQUE KEY uk_trip_one_active_driver (active_driver_id),
    UNIQUE KEY uk_trip_one_active_rider (active_rider_id),
    KEY idx_trip_driver_state (assigned_driver_id, trip_state),
    KEY idx_trip_rider_time (rider_id, created_at),
    CHECK (trip_state IN ('requested', 'assigned', 'driver_arrived', 'ongoing', 'completed', 'canceled')),
    CHECK (last_state_actor_type IN ('system', 'rider', 'driver', 'ops')),
    CHECK (ended_at IS NULL OR (started_at IS NOT NULL AND ended_at >= started_at)),
    CHECK (trip_state <> 'ongoing' OR started_at IS NOT NULL),
    CHECK (trip_state <> 'completed' OR ended_at IS NOT NULL),
    CHECK (trip_state <> 'canceled' OR canceled_at IS NOT NULL),
    CHECK (trip_state <> 'canceled' OR cancellation_reason_id IS NOT NULL),
    CONSTRAINT fk_trip_request
        FOREIGN KEY (ride_request_id) REFERENCES ride_request(ride_request_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_trip_driver
        FOREIGN KEY (assigned_driver_id) REFERENCES driver(driver_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_trip_rider
        FOREIGN KEY (rider_id) REFERENCES rider(rider_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_trip_cancel_reason
        FOREIGN KEY (cancellation_reason_id) REFERENCES cancellation_reason(cancellation_reason_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE trip_state_history (
    trip_state_event_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    trip_id BIGINT UNSIGNED NOT NULL,
    previous_state VARCHAR(20) NULL,
    new_state VARCHAR(20) NOT NULL,
    event_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    actor_type VARCHAR(20) NOT NULL,
    reason_code VARCHAR(40) NULL,
    reason_text VARCHAR(255) NULL,
    PRIMARY KEY (trip_state_event_id),
    KEY idx_trip_history_trip_time (trip_id, event_time),
    CHECK (new_state IN ('requested', 'assigned', 'driver_arrived', 'ongoing', 'completed', 'canceled')),
    CHECK (previous_state IS NULL OR previous_state IN ('requested', 'assigned', 'driver_arrived', 'ongoing', 'completed', 'canceled')),
    CHECK (actor_type IN ('system', 'rider', 'driver', 'ops')),
    CONSTRAINT fk_trip_history_trip
        FOREIGN KEY (trip_id) REFERENCES trip(trip_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 4) Fare and Payment Domain
-- =========================================================

CREATE TABLE fare (
    fare_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    trip_id BIGINT UNSIGNED NOT NULL,
    base_fare DECIMAL(10,2) NOT NULL,
    distance_fare DECIMAL(10,2) NOT NULL,
    time_fare DECIMAL(10,2) NOT NULL,
    dynamic_adjustment DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    taxes_and_fees DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_fare DECIMAL(10,2) GENERATED ALWAYS AS (
        ROUND(base_fare + distance_fare + time_fare + dynamic_adjustment + taxes_and_fees - discount_amount, 2)
    ) STORED,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    calculated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (fare_id),
    UNIQUE KEY uk_fare_trip (trip_id),
    KEY idx_fare_currency_time (currency, calculated_at),
    CHECK (base_fare >= 0),
    CHECK (distance_fare >= 0),
    CHECK (time_fare >= 0),
    CHECK (taxes_and_fees >= 0),
    CHECK (discount_amount >= 0),
    CHECK (base_fare + distance_fare + time_fare + dynamic_adjustment + taxes_and_fees - discount_amount >= 0),
    CONSTRAINT fk_fare_trip
        FOREIGN KEY (trip_id) REFERENCES trip(trip_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE payment_method (
    payment_method_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    rider_id BIGINT UNSIGNED NOT NULL,
    method_type VARCHAR(20) NOT NULL,
    provider_name VARCHAR(40) NOT NULL,
    masked_identifier VARCHAR(50) NOT NULL,
    token_reference VARCHAR(100) NULL,
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (payment_method_id),
    UNIQUE KEY uk_payment_method_token (token_reference),
    KEY idx_payment_method_rider (rider_id, is_default),
    CHECK (method_type IN ('card', 'upi', 'wallet', 'cash', 'netbanking')),
    CONSTRAINT fk_payment_method_rider
        FOREIGN KEY (rider_id) REFERENCES rider(rider_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE payment (
    payment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    trip_id BIGINT UNSIGNED NOT NULL,
    rider_id BIGINT UNSIGNED NOT NULL,
    payment_method_id BIGINT UNSIGNED NULL,
    payment_state VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    gateway_name VARCHAR(40) NULL,
    gateway_payment_ref VARCHAR(100) NULL,
    idempotency_key VARCHAR(64) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    settled_at DATETIME(3) NULL,
    PRIMARY KEY (payment_id),
    UNIQUE KEY uk_payment_trip (trip_id),
    UNIQUE KEY uk_payment_idempotency_key (idempotency_key),
    KEY idx_payment_state_time (payment_state, created_at),
    KEY idx_payment_rider_time (rider_id, created_at),
    CHECK (payment_state IN ('pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded', 'voided')),
    CHECK (amount >= 0),
    CHECK (settled_at IS NULL OR settled_at >= created_at),
    CONSTRAINT fk_payment_trip
        FOREIGN KEY (trip_id) REFERENCES trip(trip_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_payment_rider
        FOREIGN KEY (rider_id) REFERENCES rider(rider_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_payment_method
        FOREIGN KEY (payment_method_id) REFERENCES payment_method(payment_method_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE payment_attempt (
    payment_attempt_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    payment_id BIGINT UNSIGNED NOT NULL,
    attempt_sequence SMALLINT UNSIGNED NOT NULL,
    gateway_reference VARCHAR(100) NULL,
    attempt_state VARCHAR(20) NOT NULL,
    attempted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    failure_reason VARCHAR(255) NULL,
    gateway_response_code VARCHAR(20) NULL,
    PRIMARY KEY (payment_attempt_id),
    UNIQUE KEY uk_payment_attempt_sequence (payment_id, attempt_sequence),
    KEY idx_payment_attempt_state_time (attempt_state, attempted_at),
    CHECK (attempt_state IN ('initiated', 'authorized', 'captured', 'failed', 'timeout', 'refunded')),
    CONSTRAINT fk_payment_attempt_payment
        FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 5) Real-Time Driver State Tables
-- =========================================================

CREATE TABLE driver_realtime_status (
    driver_id BIGINT UNSIGNED NOT NULL,
    availability_state VARCHAR(20) NOT NULL,
    location_id BIGINT UNSIGNED NULL,
    current_geo_cell VARCHAR(24) NULL,
    current_latitude DECIMAL(10,7) NULL,
    current_longitude DECIMAL(10,7) NULL,
    last_heartbeat_at DATETIME(3) NOT NULL,
    active_trip_id BIGINT UNSIGNED NULL,
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (driver_id),
    UNIQUE KEY uk_realtime_active_trip (active_trip_id),
    KEY idx_realtime_state_heartbeat (availability_state, last_heartbeat_at),
    CHECK (availability_state IN ('online', 'offline', 'busy', 'break')),
    CHECK ((availability_state = 'busy' AND active_trip_id IS NOT NULL) OR (availability_state <> 'busy' AND active_trip_id IS NULL)),
    CONSTRAINT fk_realtime_driver
        FOREIGN KEY (driver_id) REFERENCES driver(driver_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_realtime_location
        FOREIGN KEY (location_id) REFERENCES location_reference(location_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_realtime_trip
        FOREIGN KEY (active_trip_id) REFERENCES trip(trip_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE driver_availability_snapshot (
    snapshot_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    driver_id BIGINT UNSIGNED NOT NULL,
    availability_state VARCHAR(20) NOT NULL,
    location_id BIGINT UNSIGNED NULL,
    current_geo_cell VARCHAR(24) NULL,
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    last_heartbeat_at DATETIME(3) NOT NULL,
    active_trip_id BIGINT UNSIGNED NULL,
    snapshot_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (snapshot_id),
    KEY idx_snapshot_driver_time (driver_id, snapshot_at),
    KEY idx_snapshot_state_time (availability_state, snapshot_at),
    CHECK (availability_state IN ('online', 'offline', 'busy', 'break')),
    CONSTRAINT fk_snapshot_driver
        FOREIGN KEY (driver_id) REFERENCES driver(driver_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_snapshot_location
        FOREIGN KEY (location_id) REFERENCES location_reference(location_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_snapshot_trip
        FOREIGN KEY (active_trip_id) REFERENCES trip(trip_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- 6) Operational Views
-- =========================================================

CREATE OR REPLACE VIEW vw_available_drivers AS
SELECT
    d.driver_id,
    d.full_name,
    d.service_city_id,
    drs.current_latitude,
    drs.current_longitude,
    drs.last_heartbeat_at
FROM driver AS d
JOIN driver_realtime_status AS drs
    ON drs.driver_id = d.driver_id
WHERE d.driver_status = 'active'
  AND d.verification_status = 'verified'
  AND drs.availability_state = 'online'
  AND TIMESTAMPDIFF(SECOND, drs.last_heartbeat_at, CURRENT_TIMESTAMP(3)) <= 180;

CREATE OR REPLACE VIEW vw_active_trips AS
SELECT
    t.trip_id,
    t.trip_state,
    t.created_at,
    t.started_at,
    t.assigned_driver_id,
    d.full_name AS driver_name,
    t.rider_id,
    r.full_name AS rider_name,
    t.ride_request_id
FROM trip AS t
JOIN driver AS d
    ON d.driver_id = t.assigned_driver_id
JOIN rider AS r
    ON r.rider_id = t.rider_id
WHERE t.trip_state IN ('assigned', 'driver_arrived', 'ongoing');

-- =========================================================
-- 7) Business Rule Triggers
-- =========================================================

DELIMITER $$

CREATE TRIGGER trg_trip_before_insert_validate
BEFORE INSERT ON trip
FOR EACH ROW
BEGIN
    DECLARE v_rider_id BIGINT UNSIGNED;
    DECLARE v_accepted_count INT;

    SELECT rr.rider_id
      INTO v_rider_id
      FROM ride_request AS rr
     WHERE rr.ride_request_id = NEW.ride_request_id;

    IF v_rider_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Trip insert failed: ride_request does not exist.';
    END IF;

    IF NEW.rider_id <> v_rider_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Trip insert failed: rider_id does not match ride_request owner.';
    END IF;

    SELECT COUNT(*)
      INTO v_accepted_count
      FROM ride_assignment AS ra
     WHERE ra.ride_request_id = NEW.ride_request_id
       AND ra.driver_id = NEW.assigned_driver_id
       AND ra.assignment_state = 'accepted';

    IF v_accepted_count = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Trip insert failed: accepted assignment not found for ride_request and driver.';
    END IF;
END$$

CREATE TRIGGER trg_trip_before_update_validate_transition
BEFORE UPDATE ON trip
FOR EACH ROW
BEGIN
    IF NEW.ride_request_id <> OLD.ride_request_id
       OR NEW.assigned_driver_id <> OLD.assigned_driver_id
       OR NEW.rider_id <> OLD.rider_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Trip update failed: contract fields (request, driver, rider) are immutable.';
    END IF;

    IF NEW.trip_state <> OLD.trip_state THEN
        IF NOT (
            (OLD.trip_state = 'requested' AND NEW.trip_state IN ('assigned', 'canceled'))
            OR (OLD.trip_state = 'assigned' AND NEW.trip_state IN ('driver_arrived', 'canceled'))
            OR (OLD.trip_state = 'driver_arrived' AND NEW.trip_state IN ('ongoing', 'canceled'))
            OR (OLD.trip_state = 'ongoing' AND NEW.trip_state IN ('completed', 'canceled'))
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Trip update failed: invalid trip state transition.';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_trip_after_insert_history
AFTER INSERT ON trip
FOR EACH ROW
BEGIN
    INSERT INTO trip_state_history (
        trip_id,
        previous_state,
        new_state,
        event_time,
        actor_type,
        reason_code,
        reason_text
    )
    VALUES (
        NEW.trip_id,
        NULL,
        NEW.trip_state,
        NEW.created_at,
        NEW.last_state_actor_type,
        'trip_created',
        'Trip row created'
    );

    UPDATE ride_request
       SET request_status = 'matched'
     WHERE ride_request_id = NEW.ride_request_id
       AND request_status IN ('open', 'matched', 'fulfilled');
END$$

CREATE TRIGGER trg_trip_after_update_history
AFTER UPDATE ON trip
FOR EACH ROW
BEGIN
    IF NEW.trip_state <> OLD.trip_state THEN
        INSERT INTO trip_state_history (
            trip_id,
            previous_state,
            new_state,
            event_time,
            actor_type,
            reason_code,
            reason_text
        )
        VALUES (
            NEW.trip_id,
            OLD.trip_state,
            NEW.trip_state,
            CURRENT_TIMESTAMP(3),
            NEW.last_state_actor_type,
            NEW.last_state_reason_code,
            NEW.last_state_reason_text
        );

        IF NEW.trip_state IN ('completed', 'canceled') THEN
            UPDATE ride_request
               SET request_status = 'fulfilled'
             WHERE ride_request_id = NEW.ride_request_id;
        ELSE
            UPDATE ride_request
               SET request_status = 'matched'
             WHERE ride_request_id = NEW.ride_request_id;
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_payment_before_insert_validate
BEFORE INSERT ON payment
FOR EACH ROW
BEGIN
    DECLARE v_trip_rider_id BIGINT UNSIGNED;
    DECLARE v_trip_state VARCHAR(20);

    SELECT t.rider_id, t.trip_state
      INTO v_trip_rider_id, v_trip_state
      FROM trip AS t
     WHERE t.trip_id = NEW.trip_id;

    IF v_trip_rider_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Payment insert failed: trip does not exist.';
    END IF;

    IF NEW.rider_id <> v_trip_rider_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Payment insert failed: rider_id does not match trip owner.';
    END IF;

    IF v_trip_state NOT IN ('completed', 'canceled') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Payment insert failed: trip must be completed or canceled.';
    END IF;

    IF NEW.payment_state IN ('captured', 'partially_refunded', 'refunded') AND NEW.settled_at IS NULL THEN
        SET NEW.settled_at = CURRENT_TIMESTAMP(3);
    END IF;
END$$

CREATE TRIGGER trg_payment_before_update_validate_transition
BEFORE UPDATE ON payment
FOR EACH ROW
BEGIN
    IF NEW.trip_id <> OLD.trip_id OR NEW.rider_id <> OLD.rider_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Payment update failed: trip_id and rider_id are immutable.';
    END IF;

    IF NEW.payment_state <> OLD.payment_state THEN
        IF NOT (
            (OLD.payment_state = 'pending' AND NEW.payment_state IN ('authorized', 'captured', 'failed', 'voided'))
            OR (OLD.payment_state = 'authorized' AND NEW.payment_state IN ('captured', 'failed', 'voided'))
            OR (OLD.payment_state = 'captured' AND NEW.payment_state IN ('partially_refunded', 'refunded'))
            OR (OLD.payment_state = 'partially_refunded' AND NEW.payment_state IN ('refunded'))
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Payment update failed: invalid payment state transition.';
        END IF;
    END IF;

    IF NEW.payment_state IN ('captured', 'partially_refunded', 'refunded') AND NEW.settled_at IS NULL THEN
        SET NEW.settled_at = CURRENT_TIMESTAMP(3);
    END IF;
END$$

DELIMITER ;

-- =========================================================
-- 8) Seed Data (Realistic Simulation)
-- =========================================================

INSERT INTO city (city_id, city_name, state_name, country_code, time_zone) VALUES
(1, 'Bengaluru', 'Karnataka', 'IN', 'Asia/Kolkata'),
(2, 'Mumbai', 'Maharashtra', 'IN', 'Asia/Kolkata'),
(3, 'New Delhi', 'Delhi', 'IN', 'Asia/Kolkata');

INSERT INTO service_type (service_type_id, service_code, display_name, min_seating_capacity) VALUES
(1, 'ECONOMY', 'Economy', 4),
(2, 'PREMIUM', 'Premium', 4),
(3, 'SUV', 'SUV', 6),
(4, 'BIKE', 'Bike', 1);

INSERT INTO cancellation_reason (cancellation_reason_id, reason_code, reason_description, applicable_actor) VALUES
(1, 'RIDER_NO_SHOW', 'Rider did not show up at pickup point', 'driver'),
(2, 'DRIVER_NO_SHOW', 'Driver did not arrive in SLA window', 'rider'),
(3, 'RIDER_CHANGED_MIND', 'Rider canceled after booking confirmation', 'rider'),
(4, 'DRIVER_VEHICLE_ISSUE', 'Driver reported vehicle issue', 'driver'),
(5, 'PAYMENT_FAILURE', 'Payment failure after trip completion', 'system'),
(6, 'AUTO_EXPIRED', 'No driver accepted before request timeout', 'system');

INSERT INTO location_reference (
    location_id, city_id, label, address_line, area, postal_code, latitude, longitude
) VALUES
(1001, 1, 'MG Road Metro', 'MG Road', 'Central Bengaluru', '560001', 12.9756000, 77.6050000),
(1002, 1, 'Koramangala 4th Block', '80 Feet Road', 'Koramangala', '560034', 12.9352000, 77.6245000),
(1003, 1, 'Whitefield Main Road', 'Whitefield Main Road', 'Whitefield', '560066', 12.9698000, 77.7499000),
(1004, 1, 'HSR Layout Sector 2', '27th Main Road', 'HSR Layout', '560102', 12.9116000, 77.6474000),
(1005, 1, 'Electronic City Phase 1', 'Hosur Road', 'Electronic City', '560100', 12.8456000, 77.6603000),
(1006, 1, 'Kempegowda Airport T1', 'Airport Terminal 1 Road', 'Devanahalli', '560300', 13.1986000, 77.7066000),
(2001, 2, 'Bandra Reclamation', 'Bandra West', 'Bandra', '400050', 19.0522000, 72.8264000),
(2002, 2, 'Powai Lake Front', 'Adi Shankaracharya Marg', 'Powai', '400076', 19.1197000, 72.9059000),
(2003, 2, 'Lower Parel Station', 'Senapati Bapat Marg', 'Lower Parel', '400013', 18.9967000, 72.8258000),
(2004, 2, 'Andheri East Metro', 'Andheri Kurla Road', 'Andheri East', '400069', 19.1136000, 72.8697000),
(3001, 3, 'Connaught Place Inner Circle', 'Inner Circle', 'Connaught Place', '110001', 28.6315000, 77.2167000),
(3002, 3, 'Hauz Khas Metro', 'Aurobindo Marg', 'Hauz Khas', '110016', 28.5494000, 77.2066000),
(3003, 3, 'Dwarka Sector 21 Metro', 'Dwarka Sector 21', 'Dwarka', '110077', 28.5547000, 77.0597000);

INSERT INTO rider (
    rider_id, full_name, phone_e164, email, rating_average, rating_count, account_status, created_at
) VALUES
(2001, 'Aisha Khan', '+919999000001', 'aisha.khan@example.com', 4.90, 128, 'active', '2025-01-10 10:00:00.000'),
(2002, 'Rahul Mehta', '+919999000002', 'rahul.mehta@example.com', 4.70, 96, 'active', '2025-02-14 11:10:00.000'),
(2003, 'Neha Iyer', '+919999000003', 'neha.iyer@example.com', 4.80, 63, 'active', '2025-03-02 09:05:00.000'),
(2004, 'Pranav Desai', '+919999000004', 'pranav.desai@example.com', 4.55, 45, 'active', '2025-04-18 14:40:00.000'),
(2005, 'Simran Arora', '+919999000005', 'simran.arora@example.com', 4.95, 152, 'active', '2025-05-20 12:00:00.000'),
(2006, 'Kunal Verma', '+919999000006', 'kunal.verma@example.com', 4.20, 18, 'active', '2025-11-07 08:30:00.000');

INSERT INTO driver (
    driver_id, full_name, phone_e164, email, verification_status, service_city_id, driver_status,
    license_number, rating_average, rating_count, created_at
) VALUES
(3001, 'Arjun Patil', '+918888000001', 'arjun.patil@example.com', 'verified', 1, 'active', 'KA01D9001', 4.88, 520, '2024-01-10 09:00:00.000'),
(3002, 'Naveen Kumar', '+918888000002', 'naveen.kumar@example.com', 'verified', 1, 'active', 'KA01D9002', 4.62, 302, '2024-02-12 09:30:00.000'),
(3003, 'Imran Shaikh', '+918888000003', 'imran.shaikh@example.com', 'verified', 2, 'active', 'MH01D9003', 4.73, 411, '2023-12-18 08:50:00.000'),
(3004, 'Suresh Rao', '+918888000004', 'suresh.rao@example.com', 'verified', 1, 'active', 'KA01D9004', 4.91, 689, '2023-10-21 10:15:00.000'),
(3005, 'Sameer Khan', '+918888000005', 'sameer.khan@example.com', 'verified', 2, 'active', 'MH01D9005', 4.41, 194, '2024-06-01 07:45:00.000'),
(3006, 'Vikas Singh', '+918888000006', 'vikas.singh@example.com', 'verified', 1, 'active', 'KA01D9006', 4.58, 265, '2024-07-16 09:20:00.000'),
(3007, 'Mohit Sharma', '+918888000007', 'mohit.sharma@example.com', 'verified', 3, 'active', 'DL01D9007', 4.76, 350, '2024-03-12 11:00:00.000'),
(3008, 'Karan Malhotra', '+918888000008', 'karan.malhotra@example.com', 'verified', 3, 'suspended', 'DL01D9008', 4.10, 72, '2024-08-04 10:00:00.000');

INSERT INTO vehicle (
    vehicle_id, registration_number, vehicle_type, brand_model, model_year, seating_capacity,
    compliance_status, current_driver_id, created_at
) VALUES
(4001, 'KA01AB1234', 'sedan', 'Honda City', 2022, 4, 'compliant', 3001, '2024-01-11 09:10:00.000'),
(4002, 'KA05CD5678', 'hatchback', 'Maruti Baleno', 2021, 4, 'compliant', 3002, '2024-02-13 09:45:00.000'),
(4003, 'MH01EF1122', 'sedan', 'Hyundai Verna', 2020, 4, 'compliant', NULL, '2023-12-20 08:55:00.000'),
(4004, 'MH01GH3344', 'suv', 'Toyota Innova', 2023, 7, 'compliant', 3003, '2026-03-21 08:00:00.000'),
(4005, 'KA03IJ7788', 'sedan', 'Skoda Slavia', 2024, 4, 'compliant', 3004, '2023-10-22 10:20:00.000'),
(4006, 'MH02KL9900', 'hatchback', 'Tata Altroz', 2022, 4, 'compliant', 3005, '2024-06-02 07:50:00.000'),
(4007, 'KA04MN2468', 'sedan', 'Hyundai Aura', 2021, 4, 'compliant', 3006, '2024-07-18 09:25:00.000'),
(4008, 'DL09OP4567', 'suv', 'Mahindra XUV700', 2023, 6, 'compliant', 3007, '2024-03-15 11:10:00.000');

INSERT INTO driver_vehicle_assignment (
    driver_vehicle_assignment_id, driver_id, vehicle_id, start_at, end_at, assignment_note
) VALUES
(5001, 3001, 4001, '2024-01-11 09:30:00.000', NULL, 'Primary active vehicle'),
(5002, 3002, 4002, '2024-02-13 10:00:00.000', NULL, 'Primary active vehicle'),
(5003, 3003, 4003, '2023-12-20 09:15:00.000', '2026-03-20 22:00:00.000', 'Old vehicle retired from service'),
(5004, 3003, 4004, '2026-03-21 08:15:00.000', NULL, 'Upgraded to SUV for premium routes'),
(5005, 3004, 4005, '2023-10-22 10:40:00.000', NULL, 'Primary active vehicle'),
(5006, 3005, 4006, '2024-06-02 08:10:00.000', NULL, 'Primary active vehicle'),
(5007, 3006, 4007, '2024-07-18 09:40:00.000', NULL, 'Primary active vehicle'),
(5008, 3007, 4008, '2024-03-15 11:20:00.000', NULL, 'Primary active vehicle');

INSERT INTO driver_service_type (driver_id, service_type_id, enabled_at) VALUES
(3001, 1, '2024-01-12 00:00:00.000'),
(3001, 2, '2024-08-01 00:00:00.000'),
(3002, 1, '2024-02-14 00:00:00.000'),
(3003, 2, '2023-12-22 00:00:00.000'),
(3003, 3, '2026-03-22 00:00:00.000'),
(3004, 1, '2023-10-23 00:00:00.000'),
(3005, 1, '2024-06-03 00:00:00.000'),
(3006, 1, '2024-07-19 00:00:00.000'),
(3007, 2, '2024-03-16 00:00:00.000'),
(3008, 3, '2024-08-05 00:00:00.000');

INSERT INTO ride_request (
    ride_request_id, rider_id, pickup_location_id, drop_location_id, city_id, service_type_id,
    request_status, requested_at, expire_at, canceled_by_actor, cancellation_reason_id,
    estimated_distance_km, estimated_duration_minutes, special_instructions
) VALUES
(6001, 2001, 1001, 1004, 1, 1, 'open', '2026-04-05 08:00:00.000', '2026-04-05 08:05:00.000', NULL, NULL, 13.90, 34, 'Please call on arrival'),
(6002, 2002, 2001, 2003, 2, 2, 'open', '2026-04-05 08:10:00.000', '2026-04-05 08:15:00.000', NULL, NULL, 25.60, 45, NULL),
(6003, 2003, 1002, 1006, 1, 1, 'open', '2026-04-05 09:30:00.000', '2026-04-05 09:35:00.000', NULL, NULL, 38.20, 58, 'Airport departure at 11 AM'),
(6004, 2004, 1003, 1005, 1, 1, 'canceled', '2026-04-05 09:40:00.000', '2026-04-05 09:45:00.000', 'rider', 3, 16.40, 37, 'Need child seat'),
(6005, 2005, 2002, 2004, 2, 1, 'open', '2026-04-05 10:02:00.000', '2026-04-05 10:07:00.000', NULL, NULL, 10.80, 29, NULL),
(6006, 2006, 3001, 3003, 3, 2, 'expired', '2026-04-05 09:55:00.000', '2026-04-05 10:00:00.000', 'system', 6, 22.00, 42, NULL),
(6007, 2004, 1004, 1001, 1, 1, 'open', '2026-04-05 09:00:00.000', '2026-04-05 09:05:00.000', NULL, NULL, 14.10, 33, NULL),
(6008, 2001, 1005, 1002, 1, 1, 'open', '2026-04-05 10:10:00.000', '2026-04-05 10:15:00.000', NULL, NULL, 19.70, 39, NULL),
(6009, 2005, 3002, 3001, 3, 2, 'open', '2026-04-05 10:20:00.000', '2026-04-05 10:25:00.000', NULL, NULL, 12.30, 27, 'Corporate priority trip'),
(6010, 2006, 3002, 3003, 3, 2, 'canceled', '2026-04-05 10:30:00.000', '2026-04-05 10:35:00.000', 'rider', 2, 15.40, 31, NULL);

INSERT INTO ride_assignment (
    ride_assignment_id, ride_request_id, driver_id, assignment_state, offered_at,
    responded_at, selection_rank, response_note
) VALUES
(7001, 6001, 3001, 'accepted', '2026-04-05 08:00:08.000', '2026-04-05 08:00:15.000', 1, 'Accepted immediately'),
(7002, 6002, 3002, 'timed_out', '2026-04-05 08:10:05.000', '2026-04-05 08:10:20.000', 1, 'No response from driver'),
(7003, 6002, 3003, 'accepted', '2026-04-05 08:10:25.000', '2026-04-05 08:10:35.000', 2, 'Accepted on second attempt'),
(7004, 6003, 3004, 'accepted', '2026-04-05 09:30:05.000', '2026-04-05 09:30:12.000', 1, 'Accepted quickly'),
(7005, 6005, 3005, 'offered', '2026-04-05 10:02:05.000', NULL, 1, 'Awaiting driver response'),
(7006, 6007, 3006, 'accepted', '2026-04-05 09:00:06.000', '2026-04-05 09:00:12.000', 1, 'Accepted'),
(7007, 6009, 3007, 'accepted', '2026-04-05 10:20:05.000', '2026-04-05 10:20:15.000', 1, 'Accepted'),
(7008, 6008, 3002, 'rejected', '2026-04-05 10:10:05.000', '2026-04-05 10:10:25.000', 1, 'Driver rejected due long pickup'),
(7009, 6006, 3007, 'timed_out', '2026-04-05 09:55:05.000', '2026-04-05 10:00:00.000', 1, 'Offer expired with request');

INSERT INTO trip (
    trip_id, ride_request_id, assigned_driver_id, rider_id, trip_state,
    last_state_actor_type, last_state_reason_code, last_state_reason_text,
    created_at
) VALUES
(8001, 6001, 3001, 2001, 'assigned', 'system', 'TRIP_CREATED', 'Trip contract created after assignment acceptance', '2026-04-05 08:00:15.000'),
(8002, 6002, 3003, 2002, 'assigned', 'system', 'TRIP_CREATED', 'Trip contract created after assignment acceptance', '2026-04-05 08:10:35.000'),
(8003, 6003, 3004, 2003, 'assigned', 'system', 'TRIP_CREATED', 'Trip contract created after assignment acceptance', '2026-04-05 09:30:12.000'),
(8004, 6007, 3006, 2004, 'assigned', 'system', 'TRIP_CREATED', 'Trip contract created after assignment acceptance', '2026-04-05 09:00:12.000'),
(8005, 6009, 3007, 2005, 'assigned', 'system', 'TRIP_CREATED', 'Trip contract created after assignment acceptance', '2026-04-05 10:20:15.000');

-- Trip 8001 transitions: assigned -> driver_arrived -> ongoing -> completed
UPDATE trip
   SET trip_state = 'driver_arrived',
       last_state_actor_type = 'driver',
       last_state_reason_code = 'DRIVER_ARRIVED',
       last_state_reason_text = 'Driver reached pickup location'
 WHERE trip_id = 8001;

UPDATE trip
   SET trip_state = 'ongoing',
       started_at = '2026-04-05 08:08:00.000',
       last_state_actor_type = 'driver',
       last_state_reason_code = 'TRIP_STARTED',
       last_state_reason_text = 'Rider onboard and trip started'
 WHERE trip_id = 8001;

UPDATE trip
   SET trip_state = 'completed',
       ended_at = '2026-04-05 08:42:00.000',
       distance_km = 14.20,
       duration_seconds = 2040,
       last_state_actor_type = 'system',
       last_state_reason_code = 'TRIP_COMPLETED',
       last_state_reason_text = 'Trip completed successfully'
 WHERE trip_id = 8001;

-- Trip 8002 transitions: assigned -> driver_arrived -> ongoing -> completed
UPDATE trip
   SET trip_state = 'driver_arrived',
       last_state_actor_type = 'driver',
       last_state_reason_code = 'DRIVER_ARRIVED',
       last_state_reason_text = 'Driver reached pickup location'
 WHERE trip_id = 8002;

UPDATE trip
   SET trip_state = 'ongoing',
       started_at = '2026-04-05 08:18:00.000',
       last_state_actor_type = 'driver',
       last_state_reason_code = 'TRIP_STARTED',
       last_state_reason_text = 'Rider onboard and trip started'
 WHERE trip_id = 8002;

UPDATE trip
   SET trip_state = 'completed',
       ended_at = '2026-04-05 09:05:00.000',
       distance_km = 26.50,
       duration_seconds = 2820,
       last_state_actor_type = 'system',
       last_state_reason_code = 'TRIP_COMPLETED',
       last_state_reason_text = 'Trip completed successfully'
 WHERE trip_id = 8002;

-- Trip 8003 transitions: assigned -> driver_arrived -> ongoing
UPDATE trip
   SET trip_state = 'driver_arrived',
       last_state_actor_type = 'driver',
       last_state_reason_code = 'DRIVER_ARRIVED',
       last_state_reason_text = 'Driver reached pickup location'
 WHERE trip_id = 8003;

UPDATE trip
   SET trip_state = 'ongoing',
       started_at = '2026-04-05 09:40:00.000',
       last_state_actor_type = 'driver',
       last_state_reason_code = 'TRIP_STARTED',
       last_state_reason_text = 'Trip currently in progress'
 WHERE trip_id = 8003;

-- Trip 8004 transition: assigned -> canceled
UPDATE trip
   SET trip_state = 'canceled',
       canceled_at = '2026-04-05 09:05:00.000',
       cancellation_reason_id = 3,
       last_state_actor_type = 'rider',
       last_state_reason_code = 'RIDER_CHANGED_MIND',
       last_state_reason_text = 'Rider canceled shortly after assignment'
 WHERE trip_id = 8004;

INSERT INTO fare (
    fare_id, trip_id, base_fare, distance_fare, time_fare, dynamic_adjustment,
    taxes_and_fees, discount_amount, currency, calculated_at
) VALUES
(10001, 8001, 80.00, 120.00, 30.00, 20.00, 25.00, 10.00, 'INR', '2026-04-05 08:42:05.000'),
(10002, 8002, 100.00, 240.00, 60.00, 40.00, 40.00, 20.00, 'INR', '2026-04-05 09:05:02.000'),
(10003, 8004, 30.00, 0.00, 0.00, 0.00, 5.00, 0.00, 'INR', '2026-04-05 09:05:03.000');

INSERT INTO payment_method (
    payment_method_id, rider_id, method_type, provider_name, masked_identifier,
    token_reference, is_default, is_active, created_at
) VALUES
(9001, 2001, 'card', 'VISA', '**** **** **** 1111', 'tok_card_2001_visa_1111', 1, 1, '2025-01-11 10:00:00.000'),
(9002, 2002, 'upi', 'GPay', 'rahul.mehta@upi', 'tok_upi_2002_gpay', 1, 1, '2025-02-15 11:00:00.000'),
(9003, 2004, 'wallet', 'Paytm', '+91-9999-000004', 'tok_wallet_2004_paytm', 1, 1, '2025-04-19 14:00:00.000'),
(9004, 2005, 'card', 'Mastercard', '**** **** **** 2233', 'tok_card_2005_mc_2233', 1, 1, '2025-05-21 12:10:00.000');

INSERT INTO payment (
    payment_id, trip_id, rider_id, payment_method_id, payment_state, amount, currency,
    gateway_name, gateway_payment_ref, idempotency_key, created_at, settled_at
) VALUES
(11001, 8001, 2001, 9001, 'captured', 265.00, 'INR', 'Razorpay', 'pay_8001_001', 'pay-8001-v1', '2026-04-05 08:42:10.000', '2026-04-05 08:42:14.000'),
(11002, 8002, 2002, 9002, 'captured', 460.00, 'INR', 'Razorpay', 'pay_8002_002', 'pay-8002-v1', '2026-04-05 09:05:03.000', '2026-04-05 09:05:20.000'),
(11003, 8004, 2004, 9003, 'failed', 35.00, 'INR', 'Paytm', 'pay_8004_003', 'pay-8004-v1', '2026-04-05 09:05:10.000', NULL);

INSERT INTO payment_attempt (
    payment_attempt_id, payment_id, attempt_sequence, gateway_reference, attempt_state,
    attempted_at, failure_reason, gateway_response_code
) VALUES
(12001, 11001, 1, 'rzp_attempt_11001_1', 'captured', '2026-04-05 08:42:11.000', NULL, '200'),
(12002, 11002, 1, 'rzp_attempt_11002_1', 'timeout', '2026-04-05 09:05:05.000', 'Gateway timeout', '504'),
(12003, 11002, 2, 'rzp_attempt_11002_2', 'captured', '2026-04-05 09:05:20.000', NULL, '200'),
(12004, 11003, 1, 'paytm_attempt_11003_1', 'failed', '2026-04-05 09:05:12.000', 'Wallet balance insufficient', '402'),
(12005, 11003, 2, 'paytm_attempt_11003_2', 'failed', '2026-04-05 09:06:00.000', 'Wallet balance insufficient', '402');

INSERT INTO driver_realtime_status (
    driver_id, availability_state, location_id, current_geo_cell,
    current_latitude, current_longitude, last_heartbeat_at, active_trip_id
) VALUES
(3001, 'online', 1004, 'te7j5s', 12.9116000, 77.6474000, '2026-04-05 10:35:00.000', NULL),
(3002, 'online', 1002, 'te7j47', 12.9352000, 77.6245000, '2026-04-05 10:35:03.000', NULL),
(3003, 'online', 2003, 'tdr5rv', 18.9967000, 72.8258000, '2026-04-05 10:34:57.000', NULL),
(3004, 'busy', 1005, 'te79wy', 12.8456000, 77.6603000, '2026-04-05 10:35:05.000', 8003),
(3005, 'online', 2002, 'tdr7gv', 19.1197000, 72.9059000, '2026-04-05 10:34:59.000', NULL),
(3006, 'offline', 1004, 'te7j5s', 12.9116000, 77.6474000, '2026-04-05 10:00:00.000', NULL),
(3007, 'busy', 3002, 'ttn0h4', 28.5494000, 77.2066000, '2026-04-05 10:35:02.000', 8005),
(3008, 'offline', 3003, 'ttn06n', 28.5547000, 77.0597000, '2026-04-05 09:58:00.000', NULL);

INSERT INTO driver_availability_snapshot (
    snapshot_id, driver_id, availability_state, location_id, current_geo_cell,
    latitude, longitude, last_heartbeat_at, active_trip_id, snapshot_at
) VALUES
(13001, 3001, 'online', 1001, 'te7j5r', 12.9756000, 77.6050000, '2026-04-05 07:59:50.000', NULL, '2026-04-05 07:59:50.000'),
(13002, 3001, 'busy', 1001, 'te7j5r', 12.9756000, 77.6050000, '2026-04-05 08:00:20.000', 8001, '2026-04-05 08:00:20.000'),
(13003, 3001, 'online', 1004, 'te7j5s', 12.9116000, 77.6474000, '2026-04-05 08:42:10.000', NULL, '2026-04-05 08:42:10.000'),
(13004, 3003, 'online', 2001, 'tdr5ru', 19.0522000, 72.8264000, '2026-04-05 08:10:22.000', NULL, '2026-04-05 08:10:22.000'),
(13005, 3003, 'busy', 2001, 'tdr5ru', 19.0522000, 72.8264000, '2026-04-05 08:10:40.000', 8002, '2026-04-05 08:10:40.000'),
(13006, 3003, 'online', 2003, 'tdr5rv', 18.9967000, 72.8258000, '2026-04-05 09:05:10.000', NULL, '2026-04-05 09:05:10.000'),
(13007, 3004, 'online', 1002, 'te7j47', 12.9352000, 77.6245000, '2026-04-05 09:29:58.000', NULL, '2026-04-05 09:29:58.000'),
(13008, 3004, 'busy', 1002, 'te7j47', 12.9352000, 77.6245000, '2026-04-05 09:30:20.000', 8003, '2026-04-05 09:30:20.000'),
(13009, 3004, 'busy', 1005, 'te79wy', 12.8456000, 77.6603000, '2026-04-05 10:35:05.000', 8003, '2026-04-05 10:35:05.000'),
(13010, 3006, 'online', 1004, 'te7j5s', 12.9116000, 77.6474000, '2026-04-05 09:00:10.000', NULL, '2026-04-05 09:00:10.000'),
(13011, 3006, 'busy', 1004, 'te7j5s', 12.9116000, 77.6474000, '2026-04-05 09:00:18.000', 8004, '2026-04-05 09:00:18.000'),
(13012, 3006, 'offline', 1004, 'te7j5s', 12.9116000, 77.6474000, '2026-04-05 09:06:00.000', NULL, '2026-04-05 09:06:00.000'),
(13013, 3007, 'online', 3002, 'ttn0h4', 28.5494000, 77.2066000, '2026-04-05 10:19:58.000', NULL, '2026-04-05 10:19:58.000'),
(13014, 3007, 'busy', 3002, 'ttn0h4', 28.5494000, 77.2066000, '2026-04-05 10:20:20.000', 8005, '2026-04-05 10:20:20.000'),
(13015, 3002, 'online', 1002, 'te7j47', 12.9352000, 77.6245000, '2026-04-05 10:35:03.000', NULL, '2026-04-05 10:35:03.000'),
(13016, 3005, 'online', 2002, 'tdr7gv', 19.1197000, 72.9059000, '2026-04-05 10:34:59.000', NULL, '2026-04-05 10:34:59.000');

-- =========================================================
-- 9) Optional Validation Queries
-- =========================================================

-- Active trips with rider and driver
SELECT * FROM vw_active_trips;

-- Drivers currently eligible for matching (fresh heartbeat)
SELECT * FROM vw_available_drivers;

-- Trip lifecycle audit log
SELECT trip_id, previous_state, new_state, actor_type, reason_code, event_time
FROM trip_state_history
ORDER BY trip_id, event_time;

-- Payment and retry audit
SELECT p.payment_id, p.trip_id, p.payment_state, p.amount,
       pa.attempt_sequence, pa.attempt_state, pa.attempted_at, pa.failure_reason
FROM payment p
LEFT JOIN payment_attempt pa
  ON pa.payment_id = p.payment_id
ORDER BY p.payment_id, pa.attempt_sequence;
