-- ==========================================================
--  SMART TOUR ĐÀ LẠT - DATABASE SCHEMA v2.0
--  MySQL (XAMPP) - Tương thích Hibernate ddl-auto=update
--  Sửa: Tất cả ENUM → VARCHAR để tránh lỗi 500 khi INSERT
-- ==========================================================

CREATE DATABASE IF NOT EXISTS smart_tour_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_tour_db;

-- ============ NGƯỜI DÙNG & QUYỀN ============

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'USER',
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    agency_name VARCHAR(200) NOT NULL,
    business_license VARCHAR(100),
    address VARCHAR(255),
    is_approved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============ ĐỊA ĐIỂM ============

CREATE TABLE locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(30) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    description TEXT,
    reference_price DECIMAL(15, 2) DEFAULT 0,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ DỊCH VỤ ============
-- QUAN TRỌNG: service_type dùng VARCHAR(50) thay ENUM
-- Hibernate ddl-auto=update không handle được ENUM → lỗi 500 khi INSERT

CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    original_price DECIMAL(15, 2) NOT NULL,
    sale_price DECIMAL(15, 2) NOT NULL,
    description TEXT,
    map_points TEXT,
    image_url VARCHAR(255),
    is_approved BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    tour_schedule TEXT,
    max_people INT,
    departure_point VARCHAR(255),
    hotel_name VARCHAR(255),
    room_type VARCHAR(100),
    capacity INT,
    amenities TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

-- ============ LỊCH TRÌNH AI ============

CREATE TABLE itineraries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    expected_budget DECIMAL(15, 2),
    transport_type VARCHAR(50),
    preferred_category VARCHAR(150),
    offline_file_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE itinerary_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    itinerary_id INT NOT NULL,
    schedule_date DATE NOT NULL,
    session_of_day VARCHAR(20) NOT NULL,
    location_id INT NOT NULL,
    distance_osm DOUBLE,
    travel_time DOUBLE,
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- ============ ĐẶT HÀNG ============

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    itinerary_id INT,
    total_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE SET NULL
);

CREATE TABLE order_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    service_id INT NOT NULL,
    quantity INT DEFAULT 1,
    actual_price DECIMAL(15, 2) NOT NULL,
    apply_date DATE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id)
);

-- ============ HÓA ĐƠN NHÓM ============

CREATE TABLE group_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    itinerary_id INT UNIQUE NOT NULL,
    total_incurred_cost DECIMAL(15, 2) DEFAULT 0,
    member_count INT NOT NULL DEFAULT 1,
    split_details JSON,
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
);

-- ============ CẤU HÌNH HỆ THỐNG ============

CREATE TABLE system_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value VARCHAR(255) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO system_configs (config_key, config_value, description) VALUES
    ('GEMINI_API_KEY', 'put_your_gemini_key_here', 'API Key kết nối Gemini AI'),
    ('OPENSTREETMAP_KEY', 'put_your_osm_key_here', 'Key điều hướng bản đồ');


-- ==========================================================
--  MIGRATION: Chạy nếu DB đã được tạo từ phiên bản cũ
--  (Bỏ comment dòng cần thiết rồi chạy trong phpMyAdmin)
-- ==========================================================

-- ALTER TABLE services MODIFY COLUMN service_type VARCHAR(50) NOT NULL;
-- ALTER TABLE users MODIFY COLUMN role VARCHAR(20) DEFAULT 'USER';
-- ALTER TABLE orders MODIFY COLUMN status VARCHAR(20) DEFAULT 'PENDING';
-- ALTER TABLE itinerary_details MODIFY COLUMN session_of_day VARCHAR(20) NOT NULL;
-- ALTER TABLE locations MODIFY COLUMN category VARCHAR(30) NOT NULL;
-- ALTER TABLE services ADD COLUMN IF NOT EXISTS map_points TEXT AFTER description;
