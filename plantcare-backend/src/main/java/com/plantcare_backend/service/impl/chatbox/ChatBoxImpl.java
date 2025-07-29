package com.plantcare_backend.service.impl.chatbox;

import com.plantcare_backend.service.chatbox.ChatService;
import org.springframework.beans.factory.annotation.Value;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ChatBoxImpl implements ChatService {
    @Value("${openai.api.key}")
    private String openaiApiKey;

    @Value("${openrouter.api.key}")
    private String openRouterApiKey;

    @Value("${openrouter.api.model:openai/gpt-3.5-turbo}")
    private String openRouterModel;

    @Value("${app.base-url:http://40.81.23.51}")
    private String baseUrl;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    private static final String OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

    @Override
    public String askOpenAI(String message) {
        try {
            log.info("Calling OpenAI API with message length: {}", message.length());
            
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + openaiApiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            JSONObject body = new JSONObject();
            body.put("model", "gpt-3.5-turbo");
            JSONArray messages = new JSONArray();
            JSONObject userMsg = new JSONObject();
            userMsg.put("role", "user");
            userMsg.put("content", message);
            messages.put(userMsg);
            body.put("messages", messages);

            HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);
            log.debug("OpenAI request body: {}", body.toString());

            ResponseEntity<String> response = restTemplate.postForEntity(OPENAI_API_URL, entity, String.class);
            log.info("OpenAI response status: {}", response.getStatusCode());

            JSONObject obj = new JSONObject(response.getBody());
            String reply = obj.getJSONArray("choices").getJSONObject(0).getJSONObject("message").getString("content");
            log.info("OpenAI response received successfully");
            return reply.trim();
            
        } catch (HttpClientErrorException e) {
            log.error("OpenAI API client error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("OpenAI API error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
        } catch (HttpServerErrorException e) {
            log.error("OpenAI API server error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("OpenAI server error: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("OpenAI API unexpected error", e);
            throw new RuntimeException("OpenAI API error: " + e.getMessage());
        }
    }

    @Override
    public String askOpenRouter(String message) {
        try {
            log.info("Calling OpenRouter API with message length: {}", message.length());
            
            if (openRouterApiKey == null || openRouterApiKey.trim().isEmpty()) {
                log.error("OpenRouter API key is not configured");
                throw new RuntimeException("OpenRouter API key not configured");
            }
            
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + openRouterApiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("HTTP-Referer", baseUrl);
            headers.set("X-Title", "PlantCare AI Chat");

            String model = openRouterModel;
            log.info("Using OpenRouter model: {}", model);

            JSONObject body = new JSONObject();
            body.put("model", model);

            JSONArray messages = new JSONArray();
            JSONObject userMsg = new JSONObject();
            userMsg.put("role", "user");
            userMsg.put("content", message);
            messages.put(userMsg);
            body.put("messages", messages);

            HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);
            log.debug("OpenRouter request body: {}", body.toString());
            log.debug("OpenRouter headers: Authorization=Bearer ***, HTTP-Referer={}, X-Title={}", 
                     baseUrl, "PlantCare AI Chat");

            ResponseEntity<String> response = restTemplate.postForEntity(OPENROUTER_API_URL, entity, String.class);
            log.info("OpenRouter response status: {}", response.getStatusCode());

            // Parse kết quả trả về
            JSONObject obj = new JSONObject(response.getBody());
            JSONArray choices = obj.optJSONArray("choices");
            if (choices != null && choices.length() > 0) {
                JSONObject messageObj = choices.getJSONObject(0).getJSONObject("message");
                String reply = messageObj.getString("content").trim();
                log.info("OpenRouter response received successfully");
                return reply;
            }
            
            log.warn("OpenRouter response has no choices");
            return "Không nhận được phản hồi từ OpenRouter.";
            
        } catch (HttpClientErrorException e) {
            log.error("OpenRouter API client error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 403) {
                throw new RuntimeException("OpenRouter access forbidden. Please check API key and permissions.");
            }
            throw new RuntimeException("OpenRouter API error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
        } catch (HttpServerErrorException e) {
            log.error("OpenRouter API server error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("OpenRouter server error: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("OpenRouter API unexpected error", e);
            throw new RuntimeException("OpenRouter API error: " + e.getMessage());
        }
    }

    @Override
    public String askAI(String message) {
        // Sử dụng OpenRouter làm service mặc định
        return askOpenRouter(message);
    }
}
