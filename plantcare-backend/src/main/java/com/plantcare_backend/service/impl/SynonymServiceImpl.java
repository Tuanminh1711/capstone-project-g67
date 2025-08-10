package com.plantcare_backend.service.impl;

import com.plantcare_backend.config.DiseaseDetectionProperties;
import com.plantcare_backend.service.SynonymService;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.regex.Pattern;

@Service
@Slf4j
public class SynonymServiceImpl implements SynonymService {
    
    private final DiseaseDetectionProperties config;
    
    public SynonymServiceImpl(DiseaseDetectionProperties config) {
        this.config = config;
    }

    // Vietnamese stop words for plant disease context
    private static final Set<String> STOP_WORDS = new HashSet<>(Arrays.asList(
        "của", "là", "có", "bị", "và", "hoặc", "nhưng", "nếu", "thì", "để", "cho", "với", "từ", "đến",
        "trong", "ngoài", "trên", "dưới", "bên", "cạnh", "gần", "xa", "nhiều", "ít", "một", "hai", "ba",
        "cây", "lá", "thân", "rễ", "hoa", "quả", "hạt", "chồi", "nhánh", "cành", "gốc", "ngọn"
    ));

    // Vietnamese plant disease synonyms
    private static final Map<String, List<String>> DISEASE_SYNONYMS = new HashMap<>();
    
    static {
        // Bệnh nấm
        DISEASE_SYNONYMS.put("nấm", Arrays.asList("nấm mốc", "nấm bệnh", "vi nấm", "fungi", "mold"));
        DISEASE_SYNONYMS.put("thối", Arrays.asList("thối rữa", "mục nát", "hư hỏng", "decay", "rot"));
        DISEASE_SYNONYMS.put("đốm", Arrays.asList("vết đốm", "chấm đen", "spot", "stain", "mark"));
        
        // Bệnh vi khuẩn
        DISEASE_SYNONYMS.put("vi khuẩn", Arrays.asList("bacteria", "vi trùng", "khuẩn", "bacterial"));
        DISEASE_SYNONYMS.put("loét", Arrays.asList("vết loét", "sẹo", "ulcer", "sore", "wound"));
        
        // Bệnh virus
        DISEASE_SYNONYMS.put("virus", Arrays.asList("vi rút", "bệnh virus", "viral disease"));
        DISEASE_SYNONYMS.put("khảm", Arrays.asList("mosaic", "khảm lá", "viral mosaic"));
        
        // Triệu chứng lá
        DISEASE_SYNONYMS.put("vàng", Arrays.asList("vàng úa", "vàng lá", "yellow", "chlorosis"));
        DISEASE_SYNONYMS.put("khô", Arrays.asList("khô héo", "khô lá", "dry", "wilted"));
        DISEASE_SYNONYMS.put("rụng", Arrays.asList("rụng lá", "falling", "dropping", "shedding"));
        DISEASE_SYNONYMS.put("quăn", Arrays.asList("quăn lá", "cuốn lá", "curled", "twisted"));
        DISEASE_SYNONYMS.put("biến dạng", Arrays.asList("dị dạng", "deformed", "malformed", "abnormal"));
        
        // Triệu chứng thân
        DISEASE_SYNONYMS.put("sưng", Arrays.asList("phình to", "swollen", "enlarged", "bulging"));
        DISEASE_SYNONYMS.put("nứt", Arrays.asList("nứt vỏ", "cracked", "split", "fissured"));
        
        // Triệu chứng rễ
        DISEASE_SYNONYMS.put("thối rễ", Arrays.asList("rễ thối", "root rot", "root decay"));
        DISEASE_SYNONYMS.put("rễ đen", Arrays.asList("black root", "dark root", "root discoloration"));
        
        // Côn trùng
        DISEASE_SYNONYMS.put("rệp", Arrays.asList("rệp sáp", "aphid", "scale insect"));
        DISEASE_SYNONYMS.put("sâu", Arrays.asList("sâu bọ", "caterpillar", "larva", "worm"));
        DISEASE_SYNONYMS.put("nhện", Arrays.asList("nhện đỏ", "spider mite", "mite"));
        
        // Môi trường
        DISEASE_SYNONYMS.put("thiếu nước", Arrays.asList("khô hạn", "drought", "water stress"));
        DISEASE_SYNONYMS.put("thừa nước", Arrays.asList("ngập úng", "waterlogged", "overwatering"));
        DISEASE_SYNONYMS.put("thiếu dinh dưỡng", Arrays.asList("suy dinh dưỡng", "nutrient deficiency", "malnutrition"));
    }

    // Severity keywords with weights
    private static final Map<String, Double> SEVERITY_WEIGHTS = new HashMap<>();
    
    static {
        SEVERITY_WEIGHTS.put("nghiêm trọng", 1.0);
        SEVERITY_WEIGHTS.put("nặng", 0.9);
        SEVERITY_WEIGHTS.put("trung bình", 0.6);
        SEVERITY_WEIGHTS.put("nhẹ", 0.3);
        SEVERITY_WEIGHTS.put("khởi phát", 0.2);
    }

    @Override
    public List<String> getSynonyms(String word) {
        String normalized = normalizeWord(word);
        return DISEASE_SYNONYMS.getOrDefault(normalized, Arrays.asList(normalized));
    }

    @Override
    public double getSimilarity(String word1, String word2) {
        if (word1.equals(word2)) return 1.0;
        
        String norm1 = normalizeWord(word1);
        String norm2 = normalizeWord(word2);
        
        if (norm1.equals(norm2)) return 1.0;
        
        // Check if words are synonyms
        List<String> synonyms1 = getSynonyms(norm1);
        if (synonyms1.contains(norm2)) return 0.9;
        
        // Check if words are synonyms of each other
        List<String> synonyms2 = getSynonyms(norm2);
        if (synonyms2.contains(norm1)) return 0.9;
        
        // Check for partial matches
        if (norm1.contains(norm2) || norm2.contains(norm1)) return 0.7;
        
        // Check for common prefixes/suffixes
        if (norm1.length() > 3 && norm2.length() > 3) {
            if (norm1.startsWith(norm2.substring(0, Math.min(3, norm2.length())))) return 0.5;
            if (norm2.startsWith(norm1.substring(0, Math.min(3, norm1.length())))) return 0.5;
        }
        
        return 0.0;
    }

    @Override
    public boolean isStopWord(String word) {
        return STOP_WORDS.contains(normalizeWord(word));
    }

    @Override
    public String normalizeWord(String word) {
        if (word == null || word.trim().isEmpty()) return "";
        
        String normalized = word.toLowerCase().trim();
        
        // Remove diacritics for better matching
        normalized = removeDiacritics(normalized);
        
        // Remove common suffixes
        normalized = removeSuffixes(normalized);
        
        return normalized;
    }

    @Override
    public List<String> extractKeywords(String text) {
        if (text == null || text.trim().isEmpty()) return new ArrayList<>();
        
        // Split by multiple delimiters
        String[] words = text.split("[\\s,.;:!?()\\[\\]{}'\"]+");
        List<String> keywords = new ArrayList<>();
        
        for (String word : words) {
            String normalized = normalizeWord(word);
            
            // Filter out stop words and short words
            if (!normalized.isEmpty() && normalized.length() > 2 && !isStopWord(normalized)) {
                keywords.add(normalized);
                
                // Add synonyms for important keywords
                List<String> synonyms = getSynonyms(normalized);
                for (String synonym : synonyms) {
                    if (!synonyms.equals(normalized) && !keywords.contains(synonym)) {
                        keywords.add(synonym);
                    }
                }
            }
        }
        
        return keywords;
    }

    @Override
    public double calculateMatchScore(String diseaseSymptoms, List<String> keywords) {
        if (diseaseSymptoms == null || diseaseSymptoms.isEmpty() || keywords == null || keywords.isEmpty()) {
            return 0.0;
        }
        
        String normalizedSymptoms = normalizeWord(diseaseSymptoms);
        double totalScore = 0.0;
        int matchedKeywords = 0;
        
        for (String keyword : keywords) {
            double bestMatchScore = 0.0;
            
            // Check direct match
            if (normalizedSymptoms.contains(keyword)) {
                bestMatchScore = Math.max(bestMatchScore, 0.8);
            }
            
            // Check synonym matches
            List<String> synonyms = getSynonyms(keyword);
            for (String synonym : synonyms) {
                if (normalizedSymptoms.contains(synonym)) {
                    bestMatchScore = Math.max(bestMatchScore, 0.7);
                }
            }
            
            // Check partial matches
            if (keyword.length() > 3) {
                for (int i = 0; i <= normalizedSymptoms.length() - keyword.length(); i++) {
                    String substring = normalizedSymptoms.substring(i, i + keyword.length());
                    double similarity = getSimilarity(keyword, substring);
                    if (similarity > 0.5) {
                        bestMatchScore = Math.max(bestMatchScore, similarity * 0.6);
                    }
                }
            }
            
            // Apply severity weight if keyword indicates severity
            for (Map.Entry<String, Double> entry : SEVERITY_WEIGHTS.entrySet()) {
                if (normalizedSymptoms.contains(entry.getKey()) && keyword.contains(entry.getKey())) {
                    bestMatchScore *= entry.getValue();
                }
            }
            
            if (bestMatchScore > 0) {
                totalScore += bestMatchScore;
                matchedKeywords++;
            }
        }
        
        // Calculate final score with bonus for multiple matches
        double baseScore = matchedKeywords > 0 ? totalScore / keywords.size() : 0.0;
        double bonusScore = matchedKeywords > 1 ? Math.min(0.2, matchedKeywords * 0.05) : 0.0;
        
        double finalScore = Math.min(1.0, baseScore + bonusScore);
        
        // Apply configuration-based threshold
        if (config.getSymptomMatching().isEnableSeverityWeighting()) {
            // Apply severity weighting if enabled
            for (Map.Entry<String, Double> entry : SEVERITY_WEIGHTS.entrySet()) {
                if (normalizedSymptoms.contains(entry.getKey())) {
                    finalScore *= entry.getValue();
                }
            }
        }
        
        return finalScore;
    }

    private String removeDiacritics(String text) {
        // Simple diacritic removal for Vietnamese
        return text.replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                  .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                  .replaceAll("[ìíịỉĩ]", "i")
                  .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                  .replaceAll("[ùúụủũưừứựửữ]", "u")
                  .replaceAll("[ỳýỵỷỹ]", "y")
                  .replaceAll("[đ]", "d");
    }

    private String removeSuffixes(String word) {
        // Remove common Vietnamese suffixes
        String[] suffixes = {"s", "es", "ing", "ed", "er", "est", "ly", "ment", "ness", "tion", "sion"};
        for (String suffix : suffixes) {
            if (word.endsWith(suffix) && word.length() > suffix.length() + 2) {
                word = word.substring(0, word.length() - suffix.length());
            }
        }
        return word;
    }
}
