package com.plantcare_backend.dto.validator;

import java.util.Arrays;
import java.util.List;

public class ValidationConstants {
    public static final List<String> SPAM_KEYWORDS = Arrays.asList(
            "mua", "bán", "rẻ", "giảm giá", "khuyến mãi", "deal",
            "click vào đây", "truy cập", "website", "www", "http", "https",
            "gọi ngay", "liên hệ", "điện thoại", "email", "quảng cáo",
            "promotion", "thời gian có hạn", "hành động ngay", "dùng thử miễn phí",
            "buy", "sell", "cheap", "discount", "offer", "free trial"
    );

    public static final int DAILY_PLANT_LIMIT = 5;
    public static final int MIN_SCIENTIFIC_NAME_LENGTH = 3;
    public static final int MAX_SCIENTIFIC_NAME_LENGTH = 100;
    public static final int MIN_COMMON_NAME_LENGTH = 2;
    public static final int MAX_COMMON_NAME_LENGTH = 100;
    public static final int MIN_DESCRIPTION_LENGTH = 20;
    public static final int MAX_DESCRIPTION_LENGTH = 2000;
    public static final int MIN_CARE_INSTRUCTIONS_LENGTH = 30;
    public static final int MAX_CARE_INSTRUCTIONS_LENGTH = 3000;
    public static final int MAX_SUITABLE_LOCATION_LENGTH = 500;
    public static final int MAX_COMMON_DISEASES_LENGTH = 1000;
}
