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

@Service
public class ChatBoxImpl implements ChatService {
    @Value("${openai.api.key}")
    private String openaiApiKey;

    @Value("${openrouter.api.key}")
    private String openRouterApiKey;

    @Value("${openrouter.api.model:openai/gpt-3.5-turbo}")
    private String openRouterModel;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    private static final String OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

    @Override
    public String askOpenAI(String message) {
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

        ResponseEntity<String> response = restTemplate.postForEntity(OPENAI_API_URL, entity, String.class);

        JSONObject obj = new JSONObject(response.getBody());
        String reply = obj.getJSONArray("choices").getJSONObject(0).getJSONObject("message").getString("content");
        return reply.trim();
    }

    @Override
    public String askOpenRouter(String message) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + openRouterApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("HTTP-Referer", "http://localhost:8080"); // hoặc domain của bạn

        // Sử dụng model từ config
        String model = openRouterModel;

        JSONObject body = new JSONObject();
        body.put("model", model);

        JSONArray messages = new JSONArray();
        JSONObject userMsg = new JSONObject();
        userMsg.put("role", "user");
        userMsg.put("content", message);
        messages.put(userMsg);
        body.put("messages", messages);

        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

        ResponseEntity<String> response = restTemplate.postForEntity(OPENROUTER_API_URL, entity, String.class);

        // Parse kết quả trả về
        JSONObject obj = new JSONObject(response.getBody());
        JSONArray choices = obj.optJSONArray("choices");
        if (choices != null && choices.length() > 0) {
            JSONObject messageObj = choices.getJSONObject(0).getJSONObject("message");
            return messageObj.getString("content").trim();
        }
        return "Không nhận được phản hồi từ OpenRouter.";
    }

    @Override
    public String askAI(String message) {
        // Sử dụng OpenRouter làm service mặc định
        return askOpenRouter(message);
    }

}
