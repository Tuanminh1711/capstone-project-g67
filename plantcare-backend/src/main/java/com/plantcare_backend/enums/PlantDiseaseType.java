package com.plantcare_backend.enums;

public enum PlantDiseaseType {
    // Bệnh nấm
    POWDERY_MILDEW("Bệnh phấn trắng", "Nấm", "Trắng xám trên lá", "MEDIUM"),
    RUST_DISEASE("Bệnh gỉ sắt", "Nấm", "Đốm nâu cam trên lá", "MEDIUM"),
    BLACK_SPOT("Bệnh đốm đen", "Nấm", "Đốm đen tròn trên lá", "HIGH"),

    // Bệnh vi khuẩn
    BACTERIAL_LEAF_SPOT("Bệnh đốm lá vi khuẩn", "Vi khuẩn", "Đốm nâu với viền vàng", "HIGH"),
    BACTERIAL_WILT("Bệnh héo vi khuẩn", "Vi khuẩn", "Lá héo, thân mềm", "CRITICAL"),

    // Bệnh virus
    MOSAIC_VIRUS("Bệnh khảm lá", "Virus", "Lá có vệt xanh vàng", "HIGH"),
    YELLOW_LEAF_CURL("Bệnh xoăn lá vàng", "Virus", "Lá xoăn, vàng", "HIGH"),

    // Bệnh sinh lý
    NUTRIENT_DEFICIENCY("Thiếu dinh dưỡng", "Sinh lý", "Lá vàng, còi cọc", "LOW"),
    OVER_WATERING("Thừa nước", "Sinh lý", "Lá úa, rễ thối", "MEDIUM"),
    UNDER_WATERING("Thiếu nước", "Sinh lý", "Lá khô, héo", "LOW"),

    // Sâu bệnh
    APHIDS("Rệp sáp", "Côn trùng", "Côn trùng nhỏ trên lá", "MEDIUM"),
    SPIDER_MITES("Nhện đỏ", "Côn trùng", "Mạng nhện, lá vàng", "MEDIUM"),
    SCALE_INSECTS("Rệp vảy", "Côn trùng", "Vảy nâu trên thân", "MEDIUM"),

    // Bệnh khác
    ROOT_ROT("Thối rễ", "Nấm", "Rễ đen, mềm", "CRITICAL"),
    LEAF_BLIGHT("Cháy lá", "Nấm", "Lá cháy từ mép", "MEDIUM"),
    STEM_ROT("Thối thân", "Nấm", "Thân mềm, đen", "HIGH");

    private final String vietnameseName;
    private final String category;
    private final String symptoms;
    private final String severity;

    PlantDiseaseType(String vietnameseName, String category, String symptoms, String severity) {
        this.vietnameseName = vietnameseName;
        this.category = category;
        this.symptoms = symptoms;
        this.severity = severity;
    }

    // Getters
    public String getVietnameseName() {
        return vietnameseName;
    }

    public String getCategory() {
        return category;
    }

    public String getSymptoms() {
        return symptoms;
    }

    public String getSeverity() {
        return severity;
    }

    // Utility methods
    public static PlantDiseaseType fromVietnameseName(String name) {
        for (PlantDiseaseType disease : values()) {
            if (disease.getVietnameseName().equalsIgnoreCase(name)) {
                return disease;
            }
        }
        return null;
    }

    public static PlantDiseaseType[] getByCategory(String category) {
        return java.util.Arrays.stream(values())
                .filter(disease -> disease.getCategory().equals(category))
                .toArray(PlantDiseaseType[]::new);
    }

    public static PlantDiseaseType[] getBySeverity(String severity) {
        return java.util.Arrays.stream(values())
                .filter(disease -> disease.getSeverity().equals(severity))
                .toArray(PlantDiseaseType[]::new);
    }
}