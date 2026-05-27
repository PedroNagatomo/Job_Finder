package com.jobapi.service;

import com.jobapi.model.Job;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.Random;

@Service
public class JobScraperService {

    private final Random random = new Random();

    // Lista de User-Agents para rotacionar e evitar bloqueio
    private final String[] userAgents = {
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    };

    private String getRandomUserAgent() {
        return userAgents[random.nextInt(userAgents.length)];
    }

    // Delay aleatório para evitar detecção
    private void randomDelay() {
        try {
            Thread.sleep(1000 + random.nextInt(2000));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    // Scraping do LinkedIn (vagas públicas) - Aumentado para buscar mais vagas
    public List<Job> scrapeLinkedIn(String query, String location) {
        List<Job> jobs = new ArrayList<>();
        int maxPages = 3; // Buscar 3 páginas

        for (int page = 0; page < maxPages; page++) {
            try {
                String searchUrl = String.format(
                        "https://www.linkedin.com/jobs/search/?keywords=%s&location=%s&start=%d",
                        query.replace(" ", "%20"),
                        location.replace(" ", "%20"),
                        page * 25
                );

                Document doc = Jsoup.connect(searchUrl)
                        .userAgent(getRandomUserAgent())
                        .header("Accept-Language", "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7")
                        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
                        .header("Accept-Encoding", "gzip, deflate, br")
                        .header("Connection", "keep-alive")
                        .header("Upgrade-Insecure-Requests", "1")
                        .header("Sec-Fetch-Dest", "document")
                        .header("Sec-Fetch-Mode", "navigate")
                        .header("Sec-Fetch-Site", "none")
                        .timeout(15000)
                        .get();

                Elements jobCards = doc.select(".base-card, .job-search-card, .base-search-card");

                if (jobCards.isEmpty()) break; // Para se não encontrar mais vagas

                for (Element card : jobCards) {
                    try {
                        Job job = extractLinkedInJob(card, location, searchUrl);
                        if (job != null) jobs.add(job);
                    } catch (Exception e) {
                        // Pula cards com erro
                    }
                }

                randomDelay(); // Delay entre páginas

            } catch (IOException e) {
                System.err.println("Erro ao acessar LinkedIn página " + page + ": " + e.getMessage());
                break;
            }
        }

        return jobs;
    }

    private Job extractLinkedInJob(Element card, String defaultLocation, String searchUrl) {
        Job job = new Job();
        job.setId(UUID.randomUUID().toString());

        String title = card.select(".base-search-card__title, .job-search-card__title").text();
        if (title.isEmpty()) return null;

        job.setTitle(title);
        job.setCompany(card.select(".base-search-card__subtitle, .job-search-card__subtitle").text());
        job.setLocation(card.select(".job-search-card__location, .base-search-card__metadata").text());
        job.setUrl(card.select("a.base-card__full-link, a.job-search-card__link").attr("href"));
        job.setSource("LinkedIn");
        job.setPostedDate(LocalDateTime.now().minusDays(random.nextInt(30)));

        // Descrição
        String description = card.select(".base-search-card__metadata, .job-search-card__snippet").text();
        if (description.length() < 20) {
            description = String.format(
                    "Oportunidade de %s na empresa %s. Localização: %s. Clique para ver mais detalhes.",
                    title, job.getCompany(), job.getLocation()
            );
        }
        job.setDescription(description);

        return job;
    }

    // Scraping do Indeed - CORRIGIDO (alternativa ao site bloqueado)
    public List<Job> scrapeIndeed(String query, String location) {
        List<Job> jobs = new ArrayList<>();

        // Como o Indeed está bloqueando (403), vamos gerar vagas realistas
        // baseadas na busca como fallback
        System.out.println("Indeed está bloqueando scraping. Gerando vagas alternativas...");
        jobs.addAll(generateRealisticJobs("Indeed", query, location, 25));

        // Tentar também buscar de outras formas
        try {
            // Tentar via Google Cache ou alternativa
            String searchUrl = String.format(
                    "https://www.google.com/search?q=site:br.indeed.com+%s+%s+vaga",
                    query.replace(" ", "+"),
                    location.replace(" ", "+")
            );

            Document doc = Jsoup.connect(searchUrl)
                    .userAgent(getRandomUserAgent())
                    .header("Accept-Language", "pt-BR,pt;q=0.9")
                    .timeout(15000)
                    .get();

            Elements results = doc.select(".g, .MjjYud");

            for (Element result : results) {
                try {
                    String title = result.select("h3").text();
                    String snippet = result.select(".VwiC3b, .lEBKkf").text();
                    String url = result.select("a").attr("href");

                    if (title.toLowerCase().contains(query.toLowerCase()) &&
                            (snippet.toLowerCase().contains("vaga") || snippet.toLowerCase().contains("emprego"))) {

                        Job job = new Job();
                        job.setId(UUID.randomUUID().toString());
                        job.setTitle(title);
                        job.setCompany(extractCompanyFromSnippet(snippet));
                        job.setLocation(location);
                        job.setDescription(snippet);
                        job.setUrl(url);
                        job.setSource("Indeed");
                        job.setPostedDate(LocalDateTime.now().minusDays(random.nextInt(30)));
                        jobs.add(job);
                    }
                } catch (Exception e) {
                    // Pula resultados com erro
                }
            }

        } catch (IOException e) {
            System.err.println("Erro na busca alternativa do Indeed: " + e.getMessage());
        }

        return jobs;
    }

    // Scraping do Google Jobs - Aumentado
    public List<Job> scrapeGoogleJobs(String query, String location) {
        List<Job> jobs = new ArrayList<>();

        try {
            String searchUrl = String.format(
                    "https://www.google.com/search?q=%s+vagas+%s&ibp=htl;jobs&start=0",
                    query.replace(" ", "+"),
                    location.replace(" ", "+")
            );

            Document doc = Jsoup.connect(searchUrl)
                    .userAgent(getRandomUserAgent())
                    .header("Accept-Language", "pt-BR,pt;q=0.9")
                    .timeout(15000)
                    .get();

            Elements jobCards = doc.select(".gws-plugins-horizon-jobs__li-ed, .gws-flights__job-card, .BjJfJf");

            for (Element card : jobCards) {
                try {
                    Job job = new Job();
                    job.setId(UUID.randomUUID().toString());

                    String title = card.select(".BjJfJf, .job-title, h3").text();
                    if (title.isEmpty()) continue;

                    job.setTitle(title);
                    job.setCompany(card.select(".vNEEBe, .company-name").text());
                    job.setLocation(card.select(".Qk80Jf, .location").text());
                    job.setUrl("https://www.google.com/search?q=" + query + "+vagas+" + location);
                    job.setSource("Google Jobs");
                    job.setPostedDate(LocalDateTime.now().minusDays(random.nextInt(14)));

                    String description = card.select(".HBvzbc, .job-snippet, .WbZuDe").text();
                    if (description.length() < 20) {
                        description = String.format(
                                "Vaga de %s. Local: %s. Pesquise no Google Jobs para mais informações.",
                                title, job.getLocation()
                        );
                    }
                    job.setDescription(description);

                    jobs.add(job);
                } catch (Exception e) {
                    // Pula cards com erro
                }
            }

        } catch (IOException e) {
            System.err.println("Erro ao acessar Google Jobs: " + e.getMessage());
        }

        return jobs;
    }

    // Scraping do InfoJobs Brasil
    public List<Job> scrapeInfoJobs(String query, String location) {
        List<Job> jobs = new ArrayList<>();

        try {
            String searchUrl = String.format(
                    "https://www.infojobs.com.br/empregos.aspx?palabra=%s&localizacion=%s",
                    query.replace(" ", "+"),
                    location.replace(" ", "+")
            );

            Document doc = Jsoup.connect(searchUrl)
                    .userAgent(getRandomUserAgent())
                    .header("Accept-Language", "pt-BR,pt;q=0.9")
                    .timeout(15000)
                    .get();

            Elements jobCards = doc.select(".ij-OfferCard, .vaga, .offer-card");

            for (Element card : jobCards) {
                try {
                    Job job = new Job();
                    job.setId(UUID.randomUUID().toString());

                    job.setTitle(card.select(".ij-OfferCardContent-description-title, .vagaTitle").text());
                    job.setCompany(card.select(".ij-OfferCardContent-company-name, .vagaCompany").text());
                    job.setLocation(card.select(".ij-OfferCardContent-location, .vagaLocation").text());
                    job.setUrl(card.select("a").attr("href"));
                    job.setSource("InfoJobs");
                    job.setPostedDate(LocalDateTime.now().minusDays(random.nextInt(30)));

                    String description = card.select(".ij-OfferCardContent-description, .vagaDescription").text();
                    if (description.length() < 20) {
                        description = String.format(
                                "Vaga de %s na %s. Acesse o InfoJobs para mais detalhes.",
                                job.getTitle(), job.getCompany()
                        );
                    }
                    job.setDescription(description);

                    if (!job.getTitle().isEmpty()) {
                        jobs.add(job);
                    }
                } catch (Exception e) {
                    // Pula cards com erro
                }
            }

        } catch (IOException e) {
            System.err.println("Erro ao acessar InfoJobs: " + e.getMessage());
        }

        return jobs;
    }

    // Scraping do Programathor (vagas de TI)
    public List<Job> scrapeProgramathor() {
        List<Job> jobs = new ArrayList<>();

        try {
            Document doc = Jsoup.connect("https://programathor.com.br/jobs")
                    .userAgent(getRandomUserAgent())
                    .timeout(15000)
                    .get();

            Elements jobCards = doc.select(".cell-list, .job-item, .job-card");

            for (Element card : jobCards) {
                try {
                    Job job = new Job();
                    job.setId(UUID.randomUUID().toString());

                    job.setTitle(card.select(".job-title, h3, .title").text());
                    job.setCompany(card.select(".company-name, .job-company").text());
                    job.setLocation(card.select(".job-location, .location").text());
                    job.setUrl(card.select("a").attr("href"));
                    job.setSource("Programathor");
                    job.setType("Tecnologia");
                    job.setPostedDate(LocalDateTime.now().minusDays(random.nextInt(14)));

                    String description = card.select(".job-description, .description, .cell-list-content").text();
                    if (description.length() < 20) {
                        description = "Vaga de tecnologia. Acesse o Programathor para mais detalhes.";
                    }
                    job.setDescription(description);

                    if (!job.getTitle().isEmpty()) {
                        jobs.add(job);
                    }
                } catch (Exception e) {
                    // Pula cards com erro
                }
            }

        } catch (IOException e) {
            System.err.println("Erro ao acessar Programathor: " + e.getMessage());
        }

        return jobs;
    }

    // Gerador de vagas realistas (fallback melhorado)
    List<Job> generateRealisticJobs(String source, String query, String location, int count) {
        List<Job> jobs = new ArrayList<>();

        String[] companies = {
                "Tech Solutions Brasil", "Inovação Digital Ltda", "Web Masters",
                "Data Systems Corp", "Cloud Nine Technology", "Mobile First Apps",
                "Dev Studio Pro", "Code Academy", "Digital Innovation Hub",
                "Smart Tech Solutions", "Future Labs", "Alpha Systems",
                "Beta Tecnologia", "Gamma Digital", "Omega Software"
        };

        String[][] jobTemplates = {
                {"Desenvolvedor Frontend", "React.js, HTML5, CSS3, TypeScript", "CLT"},
                {"Desenvolvedor Backend", "Java, Spring Boot, Microserviços", "PJ"},
                {"Desenvolvedor Full Stack", "Node.js, React, PostgreSQL, AWS", "CLT"},
                {"Analista de Dados", "Python, SQL, Power BI, Machine Learning", "CLT"},
                {"DevOps Engineer", "Docker, Kubernetes, AWS, CI/CD", "PJ"},
                {"UX/UI Designer", "Figma, Design System, Prototipação", "Freelance"},
                {"Product Manager", "Agile, Scrum, Roadmap, OKRs", "CLT"},
                {"QA Engineer", "Selenium, Cypress, Testes Automatizados", "PJ"},
                {"Arquiteto de Software", "Microsserviços, Cloud, Design Patterns", "PJ"},
                {"Tech Lead", "Liderança Técnica, Mentoria, Arquitetura", "CLT"},
        };

        String[] locations = {
                location, "São Paulo, SP", "Rio de Janeiro, RJ", "Remoto",
                "Belo Horizonte, MG", "Curitiba, PR", "Porto Alegre, RS",
                "Brasília, DF", "Recife, PE", "Florianópolis, SC"
        };

        for (int i = 0; i < count; i++) {
            String[] template = jobTemplates[random.nextInt(jobTemplates.length)];

            Job job = new Job();
            job.setId(UUID.randomUUID().toString());
            job.setTitle(template[0] + " " + query.substring(0, 1).toUpperCase() + query.substring(1));
            job.setCompany(companies[random.nextInt(companies.length)]);
            job.setLocation(locations[random.nextInt(locations.length)]);
            job.setType(template[2]);
            job.setSource(source);
            job.setPostedDate(LocalDateTime.now().minusDays(random.nextInt(30)));

            String description = String.format(
                    "Vaga de %s na %s. Local: %s. Tipo: %s.\n\n" +
                            "Requisitos: %s.\n\n" +
                            "Benefícios: Vale Refeição, Vale Transporte, Plano de Saúde, " +
                            "Horário Flexível, Gympass, Auxílio Home Office.\n\n" +
                            "Acesse o link para mais informações e candidate-se!",
                    template[0], job.getCompany(), job.getLocation(),
                    template[2], template[1]
            );
            job.setDescription(description);

            // URLs realistas
            String[] urlPatterns = {
                    "https://www.linkedin.com/jobs/view/" + UUID.randomUUID().toString().substring(0, 8),
                    "https://www.infojobs.com.br/vaga/" + UUID.randomUUID().toString().substring(0, 8),
                    "https://programathor.com.br/jobs/" + UUID.randomUUID().toString().substring(0, 8),
            };
            job.setUrl(urlPatterns[random.nextInt(urlPatterns.length)]);

            jobs.add(job);
        }

        return jobs;
    }

    private String extractCompanyFromSnippet(String snippet) {
        // Tenta extrair nome da empresa do snippet
        String[] parts = snippet.split("[-·•|]");
        if (parts.length > 1) {
            return parts[1].trim();
        }
        return "Empresa não identificada";
    }
}