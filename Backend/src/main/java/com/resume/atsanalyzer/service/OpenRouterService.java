package com.resume.atsanalyzer.service;

import java.util.Arrays;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.resume.atsanalyzer.config.OpenRouterConfig;
import com.resume.atsanalyzer.dto.ChatMessage;
import com.resume.atsanalyzer.dto.ChatRequest;
import com.resume.atsanalyzer.dto.ChatResponse;

@Service
public class OpenRouterService {

    private final WebClient webClient;
    private final OpenRouterConfig openRouterConfig;

    public OpenRouterService(WebClient.Builder builder,
                             OpenRouterConfig openRouterConfig) {

        this.webClient = builder.baseUrl("https://openrouter.ai/api/v1").build();
        this.openRouterConfig = openRouterConfig;
    }

    public String analyzeResume(String prompt) {

        ChatRequest request = new ChatRequest(
                "google/gemini-2.5-flash-lite",
                Arrays.asList(
                        new ChatMessage(
                                "system",
                                "You are an ATS Resume Analyzer. Give concise and practical suggestions."
                        ),
                        new ChatMessage(
                                "user",
                                prompt
                        )
                ),
                0.4,
                250
        );

        ChatResponse response = webClient.post()
                .uri("/chat/completions")
                .header(HttpHeaders.AUTHORIZATION,
                        "Bearer " + openRouterConfig.getApiKey())
                .header(HttpHeaders.CONTENT_TYPE,
                        MediaType.APPLICATION_JSON_VALUE)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ChatResponse.class)
                .block();

        if (response == null ||
                response.getChoices() == null ||
                response.getChoices().isEmpty()) {

            return "No response received.";
        }

        return response.getChoices()
                .get(0)
                .getMessage()
                .getContent();
    }
}