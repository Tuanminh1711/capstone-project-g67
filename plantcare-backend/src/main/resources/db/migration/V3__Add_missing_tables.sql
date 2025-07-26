-- Thêm các bảng bị thiếu
CREATE TABLE IF NOT EXISTS permissions
(
    permission_id  INT PRIMARY KEY AUTO_INCREMENT,
    permission_key VARCHAR(100) UNIQUE NOT NULL,
    description    VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS roles_permissions
(
    role_id       INT,
    permission_id INT,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles (role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions (permission_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS care_reminder_channels
(
    channel_id     INT PRIMARY KEY AUTO_INCREMENT,
    user_id        INT,
    channel_type   ENUM('EMAIL', 'PUSH', 'SMS'),
    target_address VARCHAR(255),
    enabled        BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE IF NOT EXISTS report_responses
(
    response_id  INT PRIMARY KEY AUTO_INCREMENT,
    report_id    INT NOT NULL,
    responder_id INT NOT NULL,
    content      TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES plant_reports (report_id),
    FOREIGN KEY (responder_id) REFERENCES users (user_id)
);

CREATE TABLE IF NOT EXISTS article_categories
(
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS care_articles
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

CREATE TABLE IF NOT EXISTS expert_profiles
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