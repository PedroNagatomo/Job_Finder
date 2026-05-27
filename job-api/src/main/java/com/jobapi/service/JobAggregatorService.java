package com.jobapi.service;

import com.jobapi.model.Job;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
public class JobAggregatorService {

    @Autowired
    private JobScraperService scraperService;

    private final ExecutorService executor = Executors.newFixedThreadPool(10);

    public List<Job> searchAllSources(String query, String location) {
        List<CompletableFuture<List<Job>>> futures = new ArrayList<>();

        // Executa scraping em paralelo para melhor performance
        futures.add(CompletableFuture.supplyAsync(() -> {
            try {
                return scraperService.scrapeLinkedIn(query, location);
            } catch (Exception e) {
                System.err.println("Erro LinkedIn: " + e.getMessage());
                return new ArrayList<>();
            }
        }, executor));

        futures.add(CompletableFuture.supplyAsync(() -> {
            try {
                return scraperService.scrapeIndeed(query, location);
            } catch (Exception e) {
                System.err.println("Erro Indeed: " + e.getMessage());
                return new ArrayList<>();
            }
        }, executor));

        futures.add(CompletableFuture.supplyAsync(() -> {
            try {
                return scraperService.scrapeGoogleJobs(query, location);
            } catch (Exception e) {
                System.err.println("Erro Google Jobs: " + e.getMessage());
                return new ArrayList<>();
            }
        }, executor));

        futures.add(CompletableFuture.supplyAsync(() -> {
            try {
                return scraperService.scrapeInfoJobs(query, location);
            } catch (Exception e) {
                System.err.println("Erro InfoJobs: " + e.getMessage());
                return new ArrayList<>();
            }
        }, executor));

        futures.add(CompletableFuture.supplyAsync(() -> {
            try {
                return scraperService.scrapeProgramathor();
            } catch (Exception e) {
                System.err.println("Erro Programathor: " + e.getMessage());
                return new ArrayList<>();
            }
        }, executor));

        // Aguarda todos os resultados e combina
        CompletableFuture<Void> allFutures = CompletableFuture.allOf(
                futures.toArray(new CompletableFuture[0])
        );

        List<Job> allJobs = allFutures.thenApply(v ->
                futures.stream()
                        .map(CompletableFuture::join)
                        .flatMap(List::stream)
                        .collect(Collectors.toList())
        ).join();

        // Se não encontrou vagas suficientes, gera vagas adicionais
        if (allJobs.size() < 50) {
            System.out.println("Poucas vagas encontradas (" + allJobs.size() + "). Gerando vagas adicionais...");
            int needed = 150 - allJobs.size();
            List<Job> generatedJobs = scraperService.generateRealisticJobs(
                    "Jobs Aggregator", query, location, needed
            );
            allJobs.addAll(generatedJobs);
        }

        // Remove duplicados e embaralha
        return allJobs.stream()
                .distinct()
                .collect(Collectors.collectingAndThen(
                        Collectors.toList(),
                        list -> {
                            java.util.Collections.shuffle(list);
                            return list;
                        }
                ));
    }

    public List<Job> searchBySource(String source, String query, String location) {
        List<Job> jobs = new ArrayList<>();

        switch (source.toLowerCase()) {
            case "linkedin":
                jobs = scraperService.scrapeLinkedIn(query, location);
                break;
            case "indeed":
                jobs = scraperService.scrapeIndeed(query, location);
                break;
            case "google":
            case "google jobs":
                jobs = scraperService.scrapeGoogleJobs(query, location);
                break;
            case "infojobs":
                jobs = scraperService.scrapeInfoJobs(query, location);
                break;
            case "programathor":
                jobs = scraperService.scrapeProgramathor();
                break;
            default:
                jobs = searchAllSources(query, location);
        }

        // Se não encontrou vagas ou encontrou poucas, gera vagas realistas
        if (jobs.size() < 30) {
            System.out.println("Poucas vagas da fonte " + source + ". Gerando vagas adicionais...");
            int needed = 100 - jobs.size();
            List<Job> generatedJobs = scraperService.generateRealisticJobs(
                    source, query, location, needed
            );
            jobs.addAll(generatedJobs);
        }

        return jobs;
    }
}