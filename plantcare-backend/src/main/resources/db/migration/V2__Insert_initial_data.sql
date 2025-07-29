-- File: V2__Insert_initial_data.sql
-- Insert dữ liệu mẫu

-- 1. Insert roles TRƯỚC (vì users cần reference)
INSERT INTO roles (role_name, description)
VALUES ('ADMIN', 'Administrator'),
       ('STAFF', 'Staff member'),
       ('USER', 'Regular user'),
       ('GUEST', 'Guest user'),
       ('EXPERT', 'Plant expert'),
       ('VIP', 'VIP user');

-- 2. Insert plant categories TRƯỚC (vì plants cần reference)
INSERT INTO plant_categories (name, description, created_at)
VALUES ('Củ dong',
        'Nhóm thực vật có thân rễ phát triển dưới đất, thường có lá lớn, được trồng làm cảnh trong nhà hoặc sân vườn.',
        CURRENT_TIMESTAMP),
       ('Cúc', 'Chi thực vật có hoa thuộc họ Asteraceae, phổ biến trong trang trí nội thất và làm cây cảnh.',
        CURRENT_TIMESTAMP),
       ('Dâu tằm', 'Cây thân gỗ hoặc bụi, có quả ăn được, thường trồng để lấy lá nuôi tằm hoặc làm cây cảnh.',
        CURRENT_TIMESTAMP),
       ('Dong riềng cảnh', 'Loài cây thân thảo có hoa đẹp, lá lớn, thường được trồng làm cảnh ở nơi có ánh sáng tốt.',
        CURRENT_TIMESTAMP),
       ('Dương xỉ',
        'Nhóm thực vật không hoa, sinh sản bằng bào tử, có khả năng sống tốt trong bóng râm và lọc không khí.',
        CURRENT_TIMESTAMP),
       ('Hồ tiêu', 'Cây dây leo thân mềm, lá xanh bóng, thường được trồng làm cảnh trong nhà hoặc ngoài trời.',
        CURRENT_TIMESTAMP),
       ('Không khí', 'Loài cây sống chủ yếu bằng hấp thụ chất dinh dưỡng và độ ẩm trong không khí, không cần đất.',
        CURRENT_TIMESTAMP),
       ('Măng tây',
        'Nhóm cây cảnh thân thảo với lá mảnh mai, xanh tươi, thường được dùng để trang trí không gian nội thất.',
        CURRENT_TIMESTAMP),
       ('Mọng nước',
        'Loài cây có khả năng tích trữ nước trong thân hoặc lá, dễ chăm sóc, thích hợp trang trí trong nhà.',
        CURRENT_TIMESTAMP),
       ('Ngũ gia bì',
        'Cây thân gỗ nhỏ hoặc cây bụi, lá kép xòe dạng chân vịt, có tác dụng lọc không khí, mang ý nghĩa phong thủy.',
        CURRENT_TIMESTAMP),
       ('Ô rô', 'Cây thân thảo sống trong điều kiện ẩm ướt, thường có hoa tím hoặc xanh, phù hợp trồng nơi bán râm.',
        CURRENT_TIMESTAMP),
       ('Ráy',
        'Nhóm cây thân thảo, lá lớn, thường mọc dưới tán rừng hoặc trong bóng râm, rất được ưa chuộng trong trang trí nội thất.',
        CURRENT_TIMESTAMP),
       ('Tai voi',
        'Loài cây thuộc họ Ráy, lá to giống tai voi, tạo cảm giác nhiệt đới, mạnh mẽ, thường trồng trong nhà hoặc sân vườn.',
        CURRENT_TIMESTAMP),
       ('Tầm ma', 'Cây thân thảo có lông gây ngứa, thường được biết đến trong y học cổ truyền hoặc làm cây cảnh lạ.',
        CURRENT_TIMESTAMP),
       ('Thài lài', 'Cây mọc lan, lá màu sắc đẹp, thường dùng làm cây phủ nền hoặc trang trí giỏ treo.',
        CURRENT_TIMESTAMP),
       ('Thầu dầu', 'Cây có lá dày, màu sắc sặc sỡ, thường được trồng làm cảnh nội thất nhờ hình dáng độc đáo.',
        CURRENT_TIMESTAMP),
       ('Thiên lý', 'Dây leo có hoa thơm, thường trồng làm giàn che mát, lấy hoa dùng trong ẩm thực và làm cảnh.',
        CURRENT_TIMESTAMP),
       ('Thu hải đường', 'Nhóm cây cảnh có hoa hoặc lá đẹp, phong phú về màu sắc, thích hợp làm cây nội thất.',
        CURRENT_TIMESTAMP),
       ('Thuốc bỏng', 'Cây mọng nước có tính mát, thường dùng trong dân gian để chữa bỏng, cũng được trồng làm cảnh.',
        CURRENT_TIMESTAMP),
       ('Xương rồng', 'Nhóm cây mọng nước có gai, sinh sống tốt trong điều kiện khô hạn, rất phổ biến trong trang trí.',
        CURRENT_TIMESTAMP);

-- 3. Insert care types (không có dependency)
INSERT INTO care_types (care_type_name)
VALUES ('Tưới nước'),
       ('Bón phân'),
       ('Cắt tỉa'),
       ('Thay chậu'),
       ('Kiểm tra sâu bệnh'),
       ('Lau lá'),
       ('Phun thuốc');

-- 4. Insert article categories (không có dependency)
INSERT INTO article_categories (name, description)
VALUES ('Chăm sóc cơ bản', 'Hướng dẫn chăm sóc cây cảnh cơ bản'),
       ('Bệnh và sâu hại', 'Cách phòng và trị bệnh cho cây'),
       ('Kỹ thuật trồng', 'Kỹ thuật trồng và nhân giống cây'),
       ('Phong thủy', 'Ý nghĩa phong thủy của các loại cây');

-- 5. Insert admin user SAU KHI CÓ roles
INSERT INTO users (username, email, password, role_id, status)
VALUES ('admin', 'hotrochamsoccaycanhtainha@gmail.com', '$10$e2jvG5E8c2AT9I1qozycJ.zlAyqroKRHkHQZmunqAb.Cog8SgmAAC', 1,
        'ACTIVE');

-- 6. Insert sample plant SAU KHI CÓ plant_categories
INSERT INTO plants (scientific_name, common_name, category_id, description, care_instructions,
                    light_requirement, water_requirement, care_difficulty, suitable_location,
                    common_diseases, created_by, status)
VALUES ('Aglaonema commutatum', 'Vạn Niên Thanh', 12,
        'Cây thân thảo, cao 30-60 cm, lá elip xanh đậm bóng với đốm bạc/trắng, mọc thành bụi, mang ý nghĩa may mắn, tài lộc',
        'Đặt cây ở nơi có ánh sáng gián tiếp hoặc ánh sáng yếu như gần cửa sổ có rèm, tưới nước khi đất khô 2-3 cm, đảm bảo đất tơi xốp thoát nước tốt. Giữ nhiệt độ 18-27°C, tránh gió lùa, bón phân lỏng pha loãng 1-2 lần/tháng vào mùa sinh trưởng. Duy trì độ ẩm trung bình, phun sương nếu không khí khô',
        'MEDIUM', 'LOW',
        'MODERATE', 'Đặt ở phòng khách, bàn làm việc, gần cửa sổ có rèm lọc ánh sáng.',
        'Thối rễ, vàng lá, rệp sáp', 1, 'ACTIVE'),
       ('Alocasia cuprea', 'Môn Rồng Đỏ', 12,
        'Cây thân thảo cao 30-50 cm, lá hình bầu dục, xanh ánh kim loại với gân nổi màu đồng, tạo vẻ đẹp độc đáo, sang trọng',
        'Đặt cây ở nơi có ánh sáng gián tiếp sáng, tránh nắng trực tiếp. Tưới nước khi đất khô nhẹ trên bề mặt, giữ đất hơi ẩm nhưng thoát nước tốt',
        'MEDIUM', 'MEDIUM', 'MODERATE', 'Phòng khách, bàn làm việc hoặc góc sáng gần cửa sổ có rèm',
        'Thối rễ, vàng lá, rệp sáp, nhện đỏ', 1, 'ACTIVE'),
       ('Alocasia macrorrhizos', 'Ráy tai voi', 12,
        'Cây thân thảo cao 1-2 m, lá lớn hình tim, xanh bóng, gân nổi rõ, mang vẻ hùng vĩ, nhiệt đới',
        'Đặt cây ở nơi có ánh sáng gián tiếp sáng, tránh nắng gắt. Tưới nước khi đất khô nhẹ 2-3 cm trên bề mặt, giữ đất ẩm nhưng không ngập úng',
        'MEDIUM', 'MEDIUM', 'MODERATE', 'Phòng khách rộng hoặc góc sáng gần cửa sổ có rèm',
        'Thối rễ, vàng lá, rệp sáp, nhện đỏ', 1, 'ACTIVE'),
       ('Alocasia reginula', 'Môn nhung đen', 12,
        'Cây thân thảo nhỏ gọn, cao 20-40 cm, lá hình bầu dục, xanh đen nhung mịn với gân sáng nổi bật, mang vẻ đẹp huyền bí',
        'Đặt cây ở nơi có ánh sáng gián tiếp sáng, tránh nắng trực tiếp. Tưới nước khi đất khô nhẹ trên bề mặt, giữ đất hơi ẩm nhưng thoát nước tốt',
        'MEDIUM', 'MEDIUM', 'MODERATE', 'Bàn làm việc, kệ trang trí hoặc góc sáng gần cửa sổ có rèm',
        'Thối rễ, vàng lá, rệp sáp, nhện đỏ', 1, 'ACTIVE'),
       ('Alocasia sanderiana', 'Ráy kris', 12,
        'Cây thân thảo cao 30-60 cm, lá hình mũi tên, xanh đậm bóng với gân trắng bạc và mép lá lượn sóng, mang vẻ đẹp độc đáo, nhiệt đới',
        'Đặt cây ở nơi có ánh sáng gián tiếp sáng, tránh ánh nắng trực tiếp. Tưới nước khi đất khô nhẹ trên bề mặt, giữ đất hơi ẩm nhưng thoát nước tốt',
        'MEDIUM', 'MEDIUM', 'MODERATE', 'Phòng khách, bàn làm việc hoặc góc sáng gần cửa sổ có rèm',
        'Thối rễ, vàng lá, rệp sáp, nhện đỏ', 1, 'ACTIVE'),
       ('Alocasia zebrina', 'Môn ngựa vằn', 12,
        'Cây thân thảo cao 40-80 cm, lá hình mũi tên xanh bóng, thân có sọc trắng đen giống như da ngựa vằn, mang vẻ đẹp nổi bật, độc lạ',
        'Đặt cây ở nơi có ánh sáng gián tiếp sáng, tránh nắng trực tiếp. Tưới nước khi đất khô nhẹ trên bề mặt, giữ đất hơi ẩm nhưng thoát nước tốt',
        'MEDIUM', 'MEDIUM', 'MODERATE', 'Phòng khách, góc sáng gần cửa sổ có rèm hoặc kệ trang trí',
        'Thối rễ, vàng lá, rệp sáp, nhện đỏ', 1, 'ACTIVE'),
       ('Aloe aristata', 'Nha đam gai', 8,
        'Cây mọng nước nhỏ gọn, cao 15-30 cm, lá mọng xếp thành hoa thị, màu xanh đậm với chấm trắng, mép lá có răng cưa mềm, mang vẻ đẹp mộc mạc',
        'Đặt cây ở nơi có ánh sáng gián tiếp sáng hoặc ánh nắng nhẹ buổi sáng. Tưới nước khi đất khô hoàn toàn, khoảng 1-2 tuần/lần, tránh ngập úng',
        'MEDIUM', 'LOW', 'EASY', 'Phòng khách, phòng làm việc, bệ cửa sổ, ban công trong nhà',
        'Thối rễ, cháy lá, rệp sáp', 1, 'ACTIVE'),
       ('Aloe humilis', 'Nha đam lùn', 8,
        'Cây mọng nước nhỏ, cao 10-20 cm, lá mọng mọc hoa thị, màu xanh xám với chấm trắng, mép có răng cưa nhỏ, mang vẻ đẹp gọn gàng, dễ thương',
        'Đặt cây ở nơi có ánh sáng gián tiếp sáng hoặc ánh nắng nhẹ buổi sáng. Tưới nước khi đất khô hoàn toàn, khoảng 1-2 tuần/lần, tránh ngập úng',
        'MEDIUM', 'LOW', 'EASY', 'Phòng khách, phòng làm việc, bệ cửa sổ, ban công trong nhà',
        'Thối rễ, cháy lá, rệp sáp', 1, 'ACTIVE');

-- 7. Insert admin profile SAU KHI CÓ users
INSERT INTO user_profiles (user_id, full_name, phone, gender)
VALUES (1, 'Administrator', '0333201780', 'OTHER');