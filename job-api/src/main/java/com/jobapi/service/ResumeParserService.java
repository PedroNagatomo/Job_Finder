package com.jobapi.service;

import com.jobapi.model.Resume;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ResumeParserService {

    // Lista de tecnologias comuns para identificar
    private static final List<String> TECH_KEYWORDS = Arrays.asList(
            "java", "python", "javascript", "typescript", "react", "angular", "vue",
            "node.js", "nodejs", "spring", "django", "flask", "express", "next.js",
            "docker", "kubernetes", "aws", "azure", "gcp", "cloud",
            "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
            "git", "github", "gitlab", "ci/cd", "jenkins", "terraform",
            "html", "css", "sass", "less", "bootstrap", "tailwind",
            "android", "ios", "flutter", "react native", "kotlin", "swift",
            "machine learning", "data science", "artificial intelligence", "ai",
            "devops", "agile", "scrum", "kanban", "jira",
            "rest", "graphql", "api", "microservices", "serverless"
    );

    // Lista de habilidades não técnicas
    private static final List<String> SOFT_SKILLS = Arrays.asList(
            "liderança", "comunicação", "trabalho em equipe", "proatividade",
            "resolução de problemas", "pensamento crítico", "criatividade",
            "gestão de tempo", "adaptabilidade", "inglês", "espanhol"
    );

    // Lista de cargos para identificar
    private static final Map<String, String> ROLE_PATTERNS = new HashMap<>();
    static {
        ROLE_PATTERNS.put("desenvolvedor|developer|programador|programmer|engenheiro de software|software engineer", "Desenvolvedor");
        ROLE_PATTERNS.put("frontend|front-end|front end", "Frontend Developer");
        ROLE_PATTERNS.put("backend|back-end|back end", "Backend Developer");
        ROLE_PATTERNS.put("fullstack|full-stack|full stack", "Full Stack Developer");
        ROLE_PATTERNS.put("devops|infraestrutura|infrastructure", "DevOps Engineer");
        ROLE_PATTERNS.put("dados|data|analista|analyst|cientista|scientist", "Data Analyst");
        ROLE_PATTERNS.put("designer|ux|ui|user experience|user interface", "UX/UI Designer");
        ROLE_PATTERNS.put("product manager|product owner|gerente de produto", "Product Manager");
        ROLE_PATTERNS.put("qa|teste|test|quality assurance", "QA Engineer");
        ROLE_PATTERNS.put("mobile|android|ios", "Mobile Developer");
    }

    public Resume parseResume(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        String text = extractText(file);

        Resume resume = new Resume(fileName, text);
        resume.setTechnologies(extractTechnologies(text));
        resume.setSkills(extractSkills(text));
        resume.setExperienceLevel(detectExperienceLevel(text));
        resume.setDesiredRole(detectRole(text));
        resume.setKeywords(extractKeywords(text));
        resume.setWordFrequency(calculateWordFrequency(text));

        return resume;
    }

    private String extractText(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename().toLowerCase();

        if (fileName.endsWith(".pdf")) {
            return extractTextFromPDF(file.getInputStream());
        } else if (fileName.endsWith(".docx")) {
            return extractTextFromDOCX(file.getInputStream());
        } else if (fileName.endsWith(".txt")) {
            return new String(file.getBytes());
        } else {
            throw new IllegalArgumentException("Formato de arquivo não suportado. Use PDF, DOCX ou TXT.");
        }
    }

    private String extractTextFromPDF(InputStream inputStream) throws IOException {
        try (PDDocument document = PDDocument.load(inputStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractTextFromDOCX(InputStream inputStream) throws IOException {
        try (XWPFDocument document = new XWPFDocument(inputStream)) {
            XWPFWordExtractor extractor = new XWPFWordExtractor(document);
            return extractor.getText();
        }
    }

    private List<String> extractTechnologies(String text) {
        String lowerText = text.toLowerCase();
        return TECH_KEYWORDS.stream()
                .filter(tech -> lowerText.contains(tech.toLowerCase()))
                .distinct()
                .collect(Collectors.toList());
    }

    private List<String> extractSkills(String text) {
        String lowerText = text.toLowerCase();
        List<String> skills = new ArrayList<>();

        // Extrai habilidades técnicas
        skills.addAll(extractTechnologies(text));

        // Extrai soft skills
        skills.addAll(SOFT_SKILLS.stream()
                .filter(skill -> lowerText.contains(skill.toLowerCase()))
                .collect(Collectors.toList()));

        return skills;
    }

    private String detectExperienceLevel(String text) {
        String lowerText = text.toLowerCase();

        // Procura por anos de experiência
        Pattern pattern = Pattern.compile("(\\d+)\\s*(anos|years).*?(experiência|experience)");
        Matcher matcher = pattern.matcher(lowerText);

        if (matcher.find()) {
            int years = Integer.parseInt(matcher.group(1));
            if (years <= 2) return "Júnior";
            if (years <= 5) return "Pleno";
            return "Sênior";
        }

        // Verifica por palavras-chave
        if (lowerText.contains("sênior") || lowerText.contains("senior") ||
                lowerText.contains("líder") || lowerText.contains("lead")) {
            return "Sênior";
        }
        if (lowerText.contains("pleno") || lowerText.contains("mid-level") ||
                lowerText.contains("intermediário")) {
            return "Pleno";
        }
        if (lowerText.contains("júnior") || lowerText.contains("junior") ||
                lowerText.contains("estágio") || lowerText.contains("intern")) {
            return "Júnior";
        }

        return "Não especificado";
    }

    private String detectRole(String text) {
        String lowerText = text.toLowerCase();

        for (Map.Entry<String, String> entry : ROLE_PATTERNS.entrySet()) {
            Pattern pattern = Pattern.compile(entry.getKey(), Pattern.CASE_INSENSITIVE);
            if (pattern.matcher(lowerText).find()) {
                return entry.getValue();
            }
        }

        return "Desenvolvedor";
    }

    private List<String> extractKeywords(String text) {
        // Remove stop words e pega as palavras mais frequentes
        Set<String> stopWords = new HashSet<>(Arrays.asList(
                "de", "da", "do", "em", "no", "na", "para", "com", "que", "os", "as",
                "um", "uma", "e", "o", "a", "se", "não", "por", "mais", "the", "of",
                "and", "in", "to", "a", "is", "for", "on", "with"
        ));

        String[] words = text.toLowerCase().replaceAll("[^a-záàâãéèêíïóôõöúçñ0-9\\s]", " ").split("\\s+");

        Map<String, Integer> frequency = new HashMap<>();
        for (String word : words) {
            if (word.length() > 3 && !stopWords.contains(word)) {
                frequency.merge(word, 1, Integer::sum);
            }
        }

        return frequency.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(20)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private Map<String, Integer> calculateWordFrequency(String text) {
        String[] words = text.toLowerCase().replaceAll("[^a-záàâãéèêíïóôõöúçñ0-9\\s]", " ").split("\\s+");

        Map<String, Integer> frequency = new HashMap<>();
        for (String word : words) {
            if (word.length() > 3) {
                frequency.merge(word, 1, Integer::sum);
            }
        }

        return frequency;
    }

    // Gera query de busca baseada no currículo
    public String generateSearchQuery(Resume resume) {
        StringBuilder query = new StringBuilder();

        // Adiciona o cargo detectado
        if (resume.getDesiredRole() != null && !resume.getDesiredRole().equals("Desenvolvedor")) {
            query.append(resume.getDesiredRole()).append(" ");
        }

        // Adiciona as principais tecnologias
        if (resume.getTechnologies() != null && !resume.getTechnologies().isEmpty()) {
            query.append(resume.getTechnologies().stream()
                    .limit(3)
                    .collect(Collectors.joining(" ")));
        }

        // Adiciona nível de experiência
        if (resume.getExperienceLevel() != null && !resume.getExperienceLevel().equals("Não especificado")) {
            query.append(" ").append(resume.getExperienceLevel().toLowerCase());
        }

        return query.toString().trim();
    }

    // Gera localização baseada no currículo
    public String extractLocation(String text) {
        String[] cities = {
                "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Brasília",
                "Salvador", "Fortaleza", "Curitiba", "Recife", "Porto Alegre",
                "Manaus", "Florianópolis", "Goiânia", "Campinas"
        };

        for (String city : cities) {
            if (text.toLowerCase().contains(city.toLowerCase())) {
                return city;
            }
        }

        return "Brasil";
    }

    // Adicione no final da classe ResumeParserService

    /**
     * Extrai anos de experiência com mais precisão
     */
    public int extractExperienceYears(String text) {
        String lowerText = text.toLowerCase();

        // Padrões de regex para encontrar anos de experiência
        List<Pattern> patterns = Arrays.asList(
                Pattern.compile("(\\d+)\\s*\\+?\\s*anos?\\s*(de\\s*)?experiência"),
                Pattern.compile("experiência\\s*(de\\s*)?(\\d+)\\s*\\+?\\s*anos?"),
                Pattern.compile("(\\d+)\\s*\\+?\\s*years?"),
                Pattern.compile("(\\d+)\\s*anos?\\s*(de\\s*)?(experiência|atuação|trabalho)"),
                Pattern.compile("atua(ndo|ção)\\s*(há|a)\\s*(\\d+)\\s*anos?")
        );

        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(lowerText);
            if (matcher.find()) {
                for (int i = 1; i <= matcher.groupCount(); i++) {
                    try {
                        return Integer.parseInt(matcher.group(i));
                    } catch (NumberFormatException ignored) {}
                }
            }
        }

        return 0;
    }

    /**
     * Detecta nível de senioridade com mais precisão
     */
    public String detectExperienceLevelEnhanced(String text) {
        int years = extractExperienceYears(text);
        String lowerText = text.toLowerCase();

        // Verifica por títulos específicos
        if (lowerText.contains("especialista") || lowerText.contains("architect") ||
                lowerText.contains("arquiteto") || years >= 8) {
            return "Especialista";
        }
        if (lowerText.contains("sênior") || lowerText.contains("senior") ||
                lowerText.contains("líder") || lowerText.contains("lead") || years >= 5) {
            return "Sênior";
        }
        if (lowerText.contains("pleno") || lowerText.contains("mid-level") ||
                lowerText.contains("intermediário") || years >= 2) {
            return "Pleno";
        }
        if (lowerText.contains("júnior") || lowerText.contains("junior") ||
                lowerText.contains("estágio") || lowerText.contains("intern") || years < 2) {
            return "Júnior";
        }

        return "Não especificado";
    }

    /**
     * Extrai habilidades com categorização
     */
    public Map<String, List<String>> extractCategorizedSkills(String text) {
        Map<String, List<String>> categorized = new HashMap<>();
        String lowerText = text.toLowerCase();

        // Categorias de skills
        Map<String, List<String>> skillCategories = new HashMap<>();
        skillCategories.put("Frontend", Arrays.asList("react", "angular", "vue", "html", "css", "javascript", "typescript", "sass", "bootstrap", "tailwind", "jquery"));
        skillCategories.put("Backend", Arrays.asList("java", "python", "node", "php", "ruby", "go", "c#", ".net", "spring", "django", "express", "laravel"));
        skillCategories.put("Database", Arrays.asList("sql", "mysql", "postgresql", "mongodb", "redis", "oracle", "elasticsearch", "dynamodb", "cassandra"));
        skillCategories.put("DevOps", Arrays.asList("docker", "kubernetes", "jenkins", "git", "ci/cd", "terraform", "ansible", "aws", "azure", "gcp", "linux"));
        skillCategories.put("Mobile", Arrays.asList("android", "ios", "flutter", "react native", "swift", "kotlin", "xamarin", "ionic"));
        skillCategories.put("Testing", Arrays.asList("jest", "selenium", "cypress", "junit", "mocha", "testes", "qa", "tdd", "bdd"));
        skillCategories.put("Data", Arrays.asList("python", "r", "sql", "machine learning", "deep learning", "tensorflow", "pytorch", "pandas", "numpy", "spark", "hadoop"));
        skillCategories.put("Soft Skills", Arrays.asList("liderança", "comunicação", "inglês", "espanhol", "trabalho em equipe", "scrum", "agile", "kanban"));

        for (Map.Entry<String, List<String>> category : skillCategories.entrySet()) {
            List<String> found = category.getValue().stream()
                    .filter(skill -> lowerText.contains(skill.toLowerCase()))
                    .collect(Collectors.toList());

            if (!found.isEmpty()) {
                categorized.put(category.getKey(), found);
            }
        }

        return categorized;
    }

    /**
     * Detecta o cargo desejado com mais precisão
     */
    public String detectRoleEnhanced(String text) {
        String lowerText = text.toLowerCase();

        // Mapa de padrões de cargo com pesos
        Map<String, Integer> roleScores = new HashMap<>();

        // Padrões com pesos (mais específico = maior peso)
        Map<String, List<String>> rolePatterns = new LinkedHashMap<>();
        rolePatterns.put("Full Stack Developer", Arrays.asList("fullstack", "full-stack", "full stack"));
        rolePatterns.put("Frontend Developer", Arrays.asList("frontend", "front-end", "front end", "react developer", "angular developer", "vue developer"));
        rolePatterns.put("Backend Developer", Arrays.asList("backend", "back-end", "back end", "java developer", "python developer", "node developer"));
        rolePatterns.put("DevOps Engineer", Arrays.asList("devops", "infraestrutura", "infrastructure", "cloud engineer", "sre", "platform engineer"));
        rolePatterns.put("Data Scientist", Arrays.asList("cientista de dados", "data scientist", "machine learning engineer", "ml engineer"));
        rolePatterns.put("Data Analyst", Arrays.asList("analista de dados", "data analyst", "analytics", "bi analyst"));
        rolePatterns.put("Mobile Developer", Arrays.asList("mobile developer", "android developer", "ios developer", "flutter developer", "react native developer"));
        rolePatterns.put("QA Engineer", Arrays.asList("qa engineer", "test engineer", "quality assurance", "analista de testes", "automação de testes"));
        rolePatterns.put("UX/UI Designer", Arrays.asList("ux designer", "ui designer", "product designer", "design system"));
        rolePatterns.put("Product Manager", Arrays.asList("product manager", "product owner", "gerente de produto"));
        rolePatterns.put("Tech Lead", Arrays.asList("tech lead", "líder técnico", "technical lead", "engineering manager"));
        rolePatterns.put("Software Engineer", Arrays.asList("software engineer", "engenheiro de software", "developer", "desenvolvedor", "programmer", "programador"));

        for (Map.Entry<String, List<String>> entry : rolePatterns.entrySet()) {
            for (String pattern : entry.getValue()) {
                if (lowerText.contains(pattern.toLowerCase())) {
                    roleScores.merge(entry.getKey(), 1, Integer::sum);
                }
            }
        }

        // Retorna o cargo com maior score
        if (!roleScores.isEmpty()) {
            return roleScores.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("Desenvolvedor");
        }

        // Fallback: procurar no título do currículo (primeiras linhas)
        String firstLines = text.length() > 200 ? text.substring(0, 200).toLowerCase() : lowerText;
        for (Map.Entry<String, List<String>> entry : rolePatterns.entrySet()) {
            for (String pattern : entry.getValue()) {
                if (firstLines.contains(pattern.toLowerCase())) {
                    return entry.getKey();
                }
            }
        }

        return "Desenvolvedor";
    }

    /**
     * Gera múltiplas queries de busca para cobrir diferentes aspectos do perfil
     */
    public List<String> generateSearchQueries(Resume resume) {
        List<String> queries = new ArrayList<>();

        // Query 1: Cargo principal + top skills
        String primaryQuery = resume.getDesiredRole();
        if (resume.getTechnologies() != null && !resume.getTechnologies().isEmpty()) {
            primaryQuery += " " + resume.getTechnologies().stream()
                    .limit(3)
                    .collect(Collectors.joining(" "));
        }
        queries.add(primaryQuery.trim());

        // Query 2: Skills alternativas (se houver muitas)
        if (resume.getTechnologies() != null && resume.getTechnologies().size() > 3) {
            String altQuery = resume.getTechnologies().stream()
                    .skip(3)
                    .limit(3)
                    .collect(Collectors.joining(" "));
            if (!altQuery.isEmpty()) {
                queries.add(altQuery.trim());
            }
        }

        // Query 3: Cargo + nível de experiência
        if (resume.getExperienceLevel() != null && !resume.getExperienceLevel().equals("Não especificado")) {
            queries.add(resume.getDesiredRole() + " " + resume.getExperienceLevel().toLowerCase());
        }

        return queries.stream()
                .filter(q -> !q.isEmpty())
                .distinct()
                .collect(Collectors.toList());
    }
}