package com.plantcare_backend.service;

import java.util.List;

public interface SynonymService {

    /**
     * Lấy danh sách từ đồng nghĩa cho một từ
     * 
     * @param word Từ cần tìm đồng nghĩa
     * @return Danh sách từ đồng nghĩa
     */
    List<String> getSynonyms(String word);

    /**
     * Tính độ tương đồng giữa hai từ
     * 
     * @param word1 Từ thứ nhất
     * @param word2 Từ thứ hai
     * @return Độ tương đồng (0.0 - 1.0)
     */
    double getSimilarity(String word1, String word2);

    /**
     * Kiểm tra xem một từ có phải là stop word không
     * 
     * @param word Từ cần kiểm tra
     * @return true nếu là stop word
     */
    boolean isStopWord(String word);

    /**
     * Chuẩn hóa từ (loại bỏ dấu, chuyển về chữ thường)
     * 
     * @param word Từ cần chuẩn hóa
     * @return Từ đã chuẩn hóa
     */
    String normalizeWord(String word);

    /**
     * Trích xuất từ khóa từ văn bản
     * 
     * @param text Văn bản cần trích xuất
     * @return Danh sách từ khóa
     */
    List<String> extractKeywords(String text);

    /**
     * Tính điểm tương đồng giữa triệu chứng bệnh và từ khóa
     * 
     * @param diseaseSymptoms Triệu chứng bệnh
     * @param keywords        Danh sách từ khóa
     * @return Điểm tương đồng (0.0 - 1.0)
     */
    double calculateMatchScore(String diseaseSymptoms, List<String> keywords);
}
