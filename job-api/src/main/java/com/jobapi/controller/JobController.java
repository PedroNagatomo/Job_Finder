package com.jobapi.controller;

import com.jobapi.model.Job;
import com.jobapi.model.MatchResult;
import com.jobapi.model.Resume;
import com.jobapi.service.IntelligentMatchingService;
import com.jobapi.service.JobAggregatorService;
import com.jobapi.service.ResumeParserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"},
        methods = {RequestMethod.GET, RequestMethod.POST})
public class JobController {

    @Autowired
    private JobAggregatorService jobService;

    @Autowired
    private IntelligentMatchingService matchingService;

    @Autowired
    private ResumeParserService resumeParser;

    @GetMapping("/jobs")
    public Map<String, Object> searchJobs(
            @RequestParam(required = false, defaultValue = "developer") String query,
            @RequestParam(required = false, defaultValue = "Brasil") String location,
            @RequestParam(required = false) String source,
            @RequestParam(required = false, defaultValue = "100") int limit) {  // Novo parâmetro

        Map<String, Object> response = new HashMap<>();

        try {
            List<Job> jobs;

            if (source != null && !source.isEmpty()) {
                jobs = jobService.searchBySource(source, query, location);
            } else {
                jobs = jobService.searchAllSources(query, location);
            }

            // Limitar ao número solicitado (padrão 100)
            if (jobs.size() > limit) {
                jobs = jobs.subList(0, limit);
            }

            response.put("success", true);
            response.put("totalJobs", jobs.size());
            response.put("query", query);
            response.put("location", location);
            response.put("jobs", jobs);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("jobs", List.of());
        }

        return response;
    }

    @GetMapping("/jobs/sources")
    public Map<String, Object> getAvailableSources() {
        Map<String, Object> sources = new HashMap<>();
        sources.put("sources", new String[]{
                "LinkedIn", "Indeed", "Google Jobs", "InfoJobs"
        });
        return sources;
    }

    @GetMapping("/health")
    public Map<String, String> healthCheck() {
        Map<String, String> health = new HashMap<>();
        health.put("status", "UP");
        health.put("message", "Job API is running");
        return health;
    }

    @PostMapping("/jobs/match-resume")
    public Map<String, Object> matchResumeWithJobs(
            @RequestParam("file") MultipartFile file) {

        Map<String, Object> response = new HashMap<>();

        try {
            // 1. Parse do currículo
            Resume resume = resumeParser.parseResume(file);

            // 2. Gerar queries de busca
            List<String> queries = resumeParser.generateSearchQueries(resume);
            String primaryQuery = queries.get(0);
            String location = resumeParser.extractLocation(resume.getFullText());

            // 3. Buscar vagas com múltiplas queries
            Set<Job> allJobs = new LinkedHashSet<>();
            for (String query : queries) {
                allJobs.addAll(jobService.searchAllSources(query, location));
            }

            // 4. Aplicar matching inteligente
            List<MatchResult> matchedJobs = matchingService.matchResumeWithJobs(
                    resume,
                    new ArrayList<>(allJobs)
            );

            // 5. Separar por nível de match
            List<MatchResult> topMatches = matchedJobs.stream()
                    .filter(m -> m.getTotalScore() >= 75)
                    .limit(10)
                    .collect(Collectors.toList());

            List<MatchResult> goodMatches = matchedJobs.stream()
                    .filter(m -> m.getTotalScore() >= 60 && m.getTotalScore() < 75)
                    .limit(10)
                    .collect(Collectors.toList());

            List<MatchResult> otherMatches = matchedJobs.stream()
                    .filter(m -> m.getTotalScore() < 60)
                    .limit(10)
                    .collect(Collectors.toList());

            // 6. Montar resposta
            response.put("success", true);
            response.put("resume", resume);
            response.put("searchQuery", primaryQuery);
            response.put("location", location);
            response.put("totalJobsFound", matchedJobs.size());
            response.put("topMatches", topMatches);
            response.put("goodMatches", goodMatches);
            response.put("otherMatches", otherMatches);
            response.put("jobs", matchedJobs.stream()
                    .map(MatchResult::getJob)
                    .collect(Collectors.toList()));

            // Adicionar scores aos jobs
            Map<String, Double> jobScores = new HashMap<>();
            for (MatchResult match : matchedJobs) {
                jobScores.put(match.getJob().getId(), match.getTotalScore());
            }
            response.put("matchScores", jobScores);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Erro ao processar currículo: " + e.getMessage());
        }

        return response;
    }
}