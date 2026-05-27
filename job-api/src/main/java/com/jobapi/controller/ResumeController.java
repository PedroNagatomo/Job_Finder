package com.jobapi.controller;

import com.jobapi.model.Job;
import com.jobapi.model.Resume;
import com.jobapi.service.JobAggregatorService;
import com.jobapi.service.ResumeParserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ResumeController {

    @Autowired
    private ResumeParserService resumeParserService;

    @Autowired
    private JobAggregatorService jobAggregatorService;

    @PostMapping("/upload-resume")
    public Map<String, Object> uploadResume(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Processa o currículo
            Resume resume = resumeParserService.parseResume(file);

            // Gera query de busca baseada no currículo
            String searchQuery = resumeParserService.generateSearchQuery(resume);
            String location = resumeParserService.extractLocation(resume.getFullText());

            // Busca vagas compatíveis
            List<Job> matchingJobs = jobAggregatorService.searchAllSources(searchQuery, location);

            // Filtra e ordena por relevância
            List<Job> filteredJobs = filterJobsByResume(matchingJobs, resume);

            response.put("success", true);
            response.put("resume", createResumeResponse(resume));
            response.put("searchQuery", searchQuery);
            response.put("location", location);
            response.put("totalJobs", filteredJobs.size());
            response.put("jobs", filteredJobs);
            response.put("message", "Currículo processado com sucesso!");

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Erro ao processar currículo: " + e.getMessage());
            response.put("jobs", List.of());
        }

        return response;
    }

    private Map<String, Object> createResumeResponse(Resume resume) {
        Map<String, Object> resumeResponse = new HashMap<>();
        resumeResponse.put("fileName", resume.getFileName());
        resumeResponse.put("desiredRole", resume.getDesiredRole());
        resumeResponse.put("experienceLevel", resume.getExperienceLevel());
        resumeResponse.put("technologies", resume.getTechnologies());
        resumeResponse.put("skills", resume.getSkills());
        resumeResponse.put("keywords", resume.getKeywords());
        return resumeResponse;
    }

    private List<Job> filterJobsByResume(List<Job> jobs, Resume resume) {
        return jobs.stream()
                .filter(job -> isJobRelevant(job, resume))
                .sorted((j1, j2) -> compareJobRelevance(j2, resume) - compareJobRelevance(j1, resume))
                .collect(java.util.stream.Collectors.toList());
    }

    private boolean isJobRelevant(Job job, Resume resume) {
        String jobText = (job.getTitle() + " " + job.getDescription()).toLowerCase();

        // Verifica se tem pelo menos uma tecnologia em comum
        for (String tech : resume.getTechnologies()) {
            if (jobText.contains(tech.toLowerCase())) {
                return true;
            }
        }

        // Ou se o cargo é compatível
        if (jobText.contains(resume.getDesiredRole().toLowerCase())) {
            return true;
        }

        return false;
    }

    private int compareJobRelevance(Job job, Resume resume) {
        String jobText = (job.getTitle() + " " + job.getDescription()).toLowerCase();
        int score = 0;

        // Pontua por tecnologias em comum
        for (String tech : resume.getTechnologies()) {
            if (jobText.contains(tech.toLowerCase())) {
                score += 2;
            }
        }

        // Pontua por cargo compatível
        if (jobText.contains(resume.getDesiredRole().toLowerCase())) {
            score += 3;
        }

        // Pontua por nível de experiência
        if (resume.getExperienceLevel() != null &&
                jobText.contains(resume.getExperienceLevel().toLowerCase())) {
            score += 2;
        }

        // Pontua por palavras-chave em comum
        for (String keyword : resume.getKeywords()) {
            if (jobText.contains(keyword.toLowerCase())) {
                score += 1;
            }
        }

        return score;
    }
}