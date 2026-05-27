package com.jobapi.model;

import java.util.List;
import java.util.Map;

public class Resume {
    private String fileName;
    private String fullText;
    private List<String> skills;
    private List<String> technologies;
    private String experienceLevel;
    private String desiredRole;
    private List<String> keywords;
    private Map<String, Integer> wordFrequency;

    // Construtores
    public Resume() {}

    public Resume(String fileName, String fullText) {
        this.fileName = fileName;
        this.fullText = fullText;
    }

    // Getters e Setters
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFullText() { return fullText; }
    public void setFullText(String fullText) { this.fullText = fullText; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }

    public List<String> getTechnologies() { return technologies; }
    public void setTechnologies(List<String> technologies) { this.technologies = technologies; }

    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }

    public String getDesiredRole() { return desiredRole; }
    public void setDesiredRole(String desiredRole) { this.desiredRole = desiredRole; }

    public List<String> getKeywords() { return keywords; }
    public void setKeywords(List<String> keywords) { this.keywords = keywords; }

    public Map<String, Integer> getWordFrequency() { return wordFrequency; }
    public void setWordFrequency(Map<String, Integer> wordFrequency) { this.wordFrequency = wordFrequency; }
}