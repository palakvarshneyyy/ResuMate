package com.resume.atsanalyzer.service;

import org.springframework.stereotype.Service;

import com.resume.atsanalyzer.dto.AnalyzeRequest;

@Service
public class AnalyzeService {

    private final OpenRouterService openRouterService;

    public AnalyzeService(OpenRouterService openRouterService) {
        this.openRouterService = openRouterService;
    }

    public String analyzeResume(AnalyzeRequest request) {

        String prompt =
                "Resume:\n" + request.getResumeText() +
                "\n\nJob Description:\n" + request.getJobDescription() +
                "\n\nAnalyze this resume for ATS compatibility. " +
                "Give an ATS score, missing keywords, strengths and suggestions.";

        return openRouterService.analyzeResume(prompt);
    }
}