-- 1. Bảng vai trò và phân quyền
CREATE TABLE roles
(
    role_id     INT PRIMARY KEY AUTO_INCREMENT,
    role_name   ENUM('ADMIN', 'STAFF', 'USER', 'GUEST', 'VIP') NOT NULL,
    description VARCHAR(255),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE permissions
(
    permission_id  INT PRIMARY KEY AUTO_INCREMENT,
    permission_key VARCHAR(100) UNIQUE NOT NULL,
    description    VARCHAR(255)
);

CREATE TABLE roles_permissions
(
    role_id       INT,
    permission_id INT,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles (role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions (permission_id) ON DELETE CASCADE
);
-- 2. Bảng người dùng và hồ sơ
CREATE TABLE users
(
    user_id    INT PRIMARY KEY AUTO_INCREMENT,
    username   VARCHAR(50) UNIQUE  NOT NULL,
    email      VARCHAR(100) UNIQUE NOT NULL,
    password   VARCHAR(255)        NOT NULL,
    role_id    INT,
    status     ENUM('ACTIVE', 'INACTIVE', 'BANNED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles (role_id)
);

CREATE TABLE user_profiles
(
    profile_id         INT PRIMARY KEY AUTO_INCREMENT,
    user_id            INT UNIQUE,
    full_name          VARCHAR(100),
    phone              VARCHAR(20),
    avatar_url         VARCHAR(255),
    living_environment TEXT,
    gender             ENUM('MALE', 'FEMALE', 'OTHER'),
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);
-- 3. Bảng VIP đơn hàng
CREATE TABLE vip_orders
(
    order_id       INT PRIMARY KEY AUTO_INCREMENT,
    user_id        INT NOT NULL,
    amount         DECIMAL(12, 2),
    status         ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vip_orders_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
            ON DELETE CASCADE
);

-- 4. Nhật ký hoạt động người dùng
CREATE TABLE user_activity_log
(
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT          NOT NULL,
    action      VARCHAR(255) NOT NULL,
    timestamp   DATETIME     NOT NULL,
    ip_address  VARCHAR(255),
    user_agent  VARCHAR(512),
    location    VARCHAR(255),
    description TEXT,
    CONSTRAINT fk_user_activity_log_user
        FOREIGN KEY (user_id)
            REFERENCES users (user_id)
            ON DELETE CASCADE
);
-- 5. Bảng danh mục cây
CREATE TABLE plant_categories
(
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng cây
CREATE TABLE plants
(
    plant_id          INT PRIMARY KEY AUTO_INCREMENT,
    scientific_name   VARCHAR(100) NOT NULL,
    common_name       VARCHAR(100) NOT NULL,
    category_id       INT,
    description       TEXT,
    care_instructions TEXT,
    light_requirement ENUM('LOW', 'MEDIUM', 'HIGH'),
    water_requirement ENUM('LOW', 'MEDIUM', 'HIGH'),
    care_difficulty   ENUM('EASY', 'MODERATE', 'DIFFICULT'),
    suitable_location TEXT,
    common_diseases   TEXT,
    status            ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by        BIGINT NULL,
    FOREIGN KEY (category_id) REFERENCES plant_categories (category_id)
);

-- 7. Hình ảnh cây
CREATE TABLE plant_images
(
    image_id    INT PRIMARY KEY AUTO_INCREMENT,
    plant_id    INT          NOT NULL,
    image_url   VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    is_primary  BOOLEAN   DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants (plant_id) ON DELETE CASCADE
);
-- 8. Bảng cây người dùng sở hữu
CREATE TABLE user_plants
(
    user_plant_id     INT PRIMARY KEY AUTO_INCREMENT,
    user_id           INT,
    plant_id          INT,
    nickname          VARCHAR(100),
    planting_date     DATE,
    location_in_house TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (user_id),
    FOREIGN KEY (plant_id) REFERENCES plants (plant_id)
);

-- 9. Hình ảnh cây của người dùng
CREATE TABLE user_plant_images
(
    image_id      INT PRIMARY KEY AUTO_INCREMENT,
    user_plant_id INT          NOT NULL,
    image_url     VARCHAR(255) NOT NULL,
    description   VARCHAR(255),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_plant_id) REFERENCES user_plants (user_plant_id)
);

-- 10. Loại chăm sóc
CREATE TABLE care_types
(
    care_type_id   INT PRIMARY KEY AUTO_INCREMENT,
    care_type_name VARCHAR(50) UNIQUE NOT NULL
);

-- 11. Lịch chăm sóc cây
CREATE TABLE care_schedules
(
    schedule_id      INT PRIMARY KEY AUTO_INCREMENT,
    user_plant_id    INT,
    care_type_id     INT,
    frequency_days   INT,
    last_care_date   DATE,
    next_care_date   DATE,
    reminder_time    TIME      DEFAULT '08:00:00',
    reminder_enabled BOOLEAN   DEFAULT TRUE,
    custom_message   TEXT,
    start_date       DATE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_plant_id) REFERENCES user_plants (user_plant_id),
    FOREIGN KEY (care_type_id) REFERENCES care_types (care_type_id)
);

-- 12. Nhật ký chăm sóc cây
CREATE TABLE care_logs
(
    log_id        INT PRIMARY KEY AUTO_INCREMENT,
    user_plant_id INT,
    care_type_id  INT,
    notes         TEXT,
    image_url     VARCHAR(255),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_plant_id) REFERENCES user_plants (user_plant_id),
    FOREIGN KEY (care_type_id) REFERENCES care_types (care_type_id)
);

-- 13. Kênh nhắc nhở
CREATE TABLE care_reminder_channels
(
    channel_id     INT PRIMARY KEY AUTO_INCREMENT,
    user_id        INT,
    channel_type   ENUM('EMAIL', 'PUSH', 'SMS'),
    target_address VARCHAR(255),
    enabled        BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

-- 14. Báo cáo cây
CREATE TABLE plant_reports
(
    report_id   INT PRIMARY KEY AUTO_INCREMENT,
    plant_id    INT NOT NULL,
    reporter_id INT NOT NULL,
    reason      TEXT,
    status      ENUM('PENDING', 'CLAIMED', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    admin_notes TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    claimed_by  INT NULL,
    claimed_at  TIMESTAMP NULL,
    handled_by  INT NULL,
    handled_at  TIMESTAMP NULL,
    FOREIGN KEY (plant_id) REFERENCES plants (plant_id),
    FOREIGN KEY (reporter_id) REFERENCES users (user_id),
    FOREIGN KEY (claimed_by) REFERENCES users (user_id),
    FOREIGN KEY (handled_by) REFERENCES users (user_id)
);

-- 15. Nhật ký xử lý báo cáo
CREATE TABLE plant_report_logs
(
    log_id     INT PRIMARY KEY AUTO_INCREMENT,
    report_id  INT NOT NULL,
    action     ENUM('CLAIM', 'HANDLE', 'RELEASE') NOT NULL,
    user_id    INT NOT NULL,
    note       TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES plant_reports (report_id),
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

-- 16. Phản hồi báo cáo
CREATE TABLE report_responses
(
    response_id  INT PRIMARY KEY AUTO_INCREMENT,
    report_id    INT NOT NULL,
    responder_id INT NOT NULL,
    content      TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES plant_reports (report_id),
    FOREIGN KEY (responder_id) REFERENCES users (user_id)
);

-- 17. Danh mục bài viết
CREATE TABLE article_categories
(
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Bài viết chăm sóc
CREATE TABLE care_articles
(
    article_id  INT PRIMARY KEY AUTO_INCREMENT,
    title       VARCHAR(200) NOT NULL,
    content     TEXT,
    author_id   INT,
    category_id INT,
    image_url   VARCHAR(255),
    status      ENUM('DRAFT', 'PUBLISHED') DEFAULT 'DRAFT',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users (user_id),
    FOREIGN KEY (category_id) REFERENCES article_categories (category_id)
);

-- 19. Hỗ trợ khách hàng
CREATE TABLE support_tickets
(
    ticket_id   INT PRIMARY KEY AUTO_INCREMENT,
    user_id     INT,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    image_url   VARCHAR(255),
    status      ENUM('OPEN', 'CLAIMED', 'IN_PROGRESS', 'CLOSED') DEFAULT 'OPEN',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    claimed_by  INT,
    claimed_at  TIMESTAMP,
    handled_by  INT,
    handled_at  TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (user_id),
    FOREIGN KEY (claimed_by) REFERENCES users (user_id),
    FOREIGN KEY (handled_by) REFERENCES users (user_id)
);

-- 20. Nhật ký hỗ trợ
CREATE TABLE support_ticket_logs
(
    log_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
    ticket_id  BIGINT NOT NULL,
    action     ENUM('CLAIM', 'HANDLE', 'RELEASE') NOT NULL,
    user_id    INT    NOT NULL,
    note       TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets (ticket_id),
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

-- 21. Phản hồi hỗ trợ
CREATE TABLE ticket_responses
(
    response_id  INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id    INT,
    responder_id INT,
    content      TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets (ticket_id),
    FOREIGN KEY (responder_id) REFERENCES users (user_id)
);

-- 22. Hồ sơ chuyên gia
CREATE TABLE expert_profiles
(
    expert_id        INT PRIMARY KEY AUTO_INCREMENT,
    user_id          INT,
    specialization   TEXT,
    experience_years INT,
    bio              TEXT,
    rating           DECIMAL(3, 2),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

-- 23. Tin nhắn
CREATE TABLE chat_messages
(
    message_id  INT PRIMARY KEY AUTO_INCREMENT,
    sender_id   INT  NOT NULL,
    receiver_id INT  NOT NULL,
    content     TEXT NOT NULL,
    sent_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read     BOOLEAN   DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users (user_id),
    FOREIGN KEY (receiver_id) REFERENCES users (user_id)
);