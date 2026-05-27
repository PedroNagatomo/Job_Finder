package com.jobapi.model;

import java.util.List;
import java.util.Map;

public class MatchResult {
    private Job job;
    private double totalScore;        // 0-100
    private double skillMatchScore;    // Match de habilidades técnicas
    private double experienceScore;    // Match de experiência
    private double educationScore;     // Match de educação
    private double roleScore;         // Match de cargo
    private double locationScore;     // Match de localização
    private List<String> matchingSkills;
    private List<String> missingSkills;
    private List<String> matchingHighlights;
    private String recommendation;
    private String matchLevel;        // PERFECT, EXCELLENT, GOOD, FAIR, LOW

    // Construtores
    public MatchResult() {}

    public MatchResult(Job job) {
        this.job = job;
        this.totalScore = 0;
    }

    // Getters e Setters
    public Job getJob() { return job; }
    public void setJob(Job job) { this.job = job; }

    public double getTotalScore() { return totalScore; }
    public void setTotalScore(double totalScore) { this.totalScore = totalScore; }

    public double getSkillMatchScore() { return skillMatchScore; }
    public void setSkillMatchScore(double skillMatchScore) { this.skillMatchScore = skillMatchScore; }

    public double getExperienceScore() { return experienceScore; }
    public void setExperienceScore(double experienceScore) { this.experienceScore = experienceScore; }

    public double getEducationScore() { return educationScore; }
    public void setEducationScore(double educationScore) { this.educationScore = educationScore; }

    public double getRoleScore() { return roleScore; }
    public void setRoleScore(double roleScore) { this.roleScore = roleScore; }

    public double getLocationScore() { return locationScore; }
    public void setLocationScore(double locationScore) { this.locationScore = locationScore; }

    public List<String> getMatchingSkills() { return matchingSkills; }
    public void setMatchingSkills(List<String> matchingSkills) { this.matchingSkills = matchingSkills; }

    public List<String> getMissingSkills() { return missingSkills; }
    public void setMissingSkills(List<String> missingSkills) { this.missingSkills = missingSkills; }

    public List<String> getMatchingHighlights() { return matchingHighlights; }
    public void setMatchingHighlights(List<String> matchingHighlights) { this.matchingHighlights = matchingHighlights; }

    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }

    public String getMatchLevel() { return matchLevel; }
    public void setMatchLevel(String matchLevel) { this.matchLevel = matchLevel; }
}