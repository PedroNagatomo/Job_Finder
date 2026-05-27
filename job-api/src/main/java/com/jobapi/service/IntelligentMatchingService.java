package com.jobapi.service;

import com.jobapi.model.Job;
import com.jobapi.model.MatchResult;
import com.jobapi.model.Resume;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class IntelligentMatchingService {

    // Pesos para cada critério (ajustáveis)
    private static final double SKILL_WEIGHT = 0.35;
    private static final double EXPERIENCE_WEIGHT = 0.25;
    private static final double ROLE_WEIGHT = 0.20;
    private static final double EDUCATION_WEIGHT = 0.10;
    private static final double LOCATION_WEIGHT = 0.10;

    // Sinônimos e variações de skills (para matching semântico)
    private static final Map<String, List<String>> SKILL_SYNONYMS = new HashMap<>();
    static {
        SKILL_SYNONYMS.put("react", Arrays.asList("react.js", "reactjs", "react native"));
        SKILL_SYNONYMS.put("angular", Arrays.asList("angular.js", "angularjs", "angular 2+"));
        SKILL_SYNONYMS.put("vue", Arrays.asList("vue.js", "vuejs", "nuxt"));
        SKILL_SYNONYMS.put("node", Arrays.asList("node.js", "nodejs", "express"));
        SKILL_SYNONYMS.put("python", Arrays.asList("django", "flask", "fastapi"));
        SKILL_SYNONYMS.put("java", Arrays.asList("spring", "spring boot", "j2ee", "jakarta"));
        SKILL_SYNONYMS.put("javascript", Arrays.asList("js", "ecmascript", "es6", "typescript"));
        SKILL_SYNONYMS.put("cloud", Arrays.asList("aws", "azure", "gcp", "google cloud"));
        SKILL_SYNONYMS.put("devops", Arrays.asList("docker", "kubernetes", "jenkins", "ci/cd"));
        SKILL_SYNONYMS.put("database", Arrays.asList("sql", "mysql", "postgresql", "mongodb", "nosql"));
        SKILL_SYNONYMS.put("mobile", Arrays.asList("android", "ios", "flutter", "react native", "swift", "kotlin"));
        SKILL_SYNONYMS.put("testing", Arrays.asList("qa", "testes", "jest", "selenium", "cypress", "junit"));
        SKILL_SYNONYMS.put("agile", Arrays.asList("scrum", "kanban", "metodologias ágeis"));
        SKILL_SYNONYMS.put("frontend", Arrays.asList("html", "css", "sass", "ui", "ux"));
        SKILL_SYNONYMS.put("backend", Arrays.asList("api", "rest", "graphql", "microservices", "serverless"));
    }

    // Mapa de senioridade com faixas de experiência
    private static final Map<String, int[]> SENIORITY_LEVELS = new HashMap<>();
    static {
        SENIORITY_LEVELS.put("estágio", new int[]{0, 1});
        SENIORITY_LEVELS.put("estagiário", new int[]{0, 1});
        SENIORITY_LEVELS.put("trainee", new int[]{0, 1});
        SENIORITY_LEVELS.put("junior", new int[]{0, 3});
        SENIORITY_LEVELS.put("júnior", new int[]{0, 3});
        SENIORITY_LEVELS.put("pleno", new int[]{2, 6});
        SENIORITY_LEVELS.put("senior", new int[]{5, 10});
        SENIORITY_LEVELS.put("sênior", new int[]{5, 10});
        SENIORITY_LEVELS.put("especialista", new int[]{7, 15});
        SENIORITY_LEVELS.put("tech lead", new int[]{6, 12});
        SENIORITY_LEVELS.put("líder técnico", new int[]{6, 12});
        SENIORITY_LEVELS.put("gerente", new int[]{5, 15});
        SENIORITY_LEVELS.put("manager", new int[]{5, 15});
        SENIORITY_LEVELS.put("arquiteto", new int[]{8, 20});
        SENIORITY_LEVELS.put("architect", new int[]{8, 20});
    }

    /**
     * Realiza o matching completo de um currículo com uma lista de vagas
     */
    public List<MatchResult> matchResumeWithJobs(Resume resume, List<Job> jobs) {
        List<MatchResult> results = new ArrayList<>();

        for (Job job : jobs) {
            MatchResult match = calculateMatch(resume, job);
            results.add(match);
        }

        // Ordenar por score total (maior primeiro)
        results.sort((a, b) -> Double.compare(b.getTotalScore(), a.getTotalScore()));

        // Atribuir níveis de match
        assignMatchLevels(results);

        return results;
    }

    /**
     * Calcula o match entre um currículo e uma vaga específica
     */
    public MatchResult calculateMatch(Resume resume, Job job) {
        MatchResult result = new MatchResult(job);

        // 1. Match de Skills Técnicas (35%)
        double skillScore = calculateSkillMatch(resume, job);
        result.setSkillMatchScore(skillScore);

        // 2. Match de Experiência (25%)
        double expScore = calculateExperienceMatch(resume, job);
        result.setExperienceScore(expScore);

        // 3. Match de Cargo/Role (20%)
        double roleScore = calculateRoleMatch(resume, job);
        result.setRoleScore(roleScore);

        // 4. Match de Educação (10%)
        double eduScore = calculateEducationMatch(resume, job);
        result.setEducationScore(eduScore);

        // 5. Match de Localização (10%)
        double locScore = calculateLocationMatch(resume, job);
        result.setLocationScore(locScore);

        // Calcular score total ponderado
        double totalScore =
                skillScore * SKILL_WEIGHT +
                        expScore * EXPERIENCE_WEIGHT +
                        roleScore * ROLE_WEIGHT +
                        eduScore * EDUCATION_WEIGHT +
                        locScore * LOCATION_WEIGHT;

        result.setTotalScore(Math.min(100, Math.round(totalScore * 100.0) / 100.0));
        result.setRecommendation(generateRecommendation(result));
        result.setMatchingHighlights(generateHighlights(result));

        return result;
    }

    /**
     * Calcula match de habilidades com sinônimos e variações
     */
    private double calculateSkillMatch(Resume resume, Job job) {
        List<String> resumeSkills = expandSkills(resume.getTechnologies());
        List<String> jobSkills = extractSkillsFromJob(job);

        if (jobSkills.isEmpty()) return 70.0; // Score médio se não detectar skills

        List<String> matching = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        for (String jobSkill : jobSkills) {
            if (isSkillMatching(jobSkill, resumeSkills)) {
                matching.add(jobSkill);
            } else {
                missing.add(jobSkill);
            }
        }

        // Calcular score baseado na proporção de match
        double matchRatio = (double) matching.size() / jobSkills.size();

        // Bônus por skills críticas (primeiras 3 skills da vaga são mais importantes)
        double criticalMatch = 0;
        int criticalCount = Math.min(3, jobSkills.size());
        for (int i = 0; i < criticalCount; i++) {
            if (matching.contains(jobSkills.get(i))) {
                criticalMatch++;
            }
        }
        double criticalBonus = (criticalMatch / criticalCount) * 20; // Até 20% de bônus

        double score = (matchRatio * 80) + criticalBonus;

        // Armazenar resultados
        ((MatchResult) null).setMatchingSkills(matching); // Será setado no MatchResult
        ((MatchResult) null).setMissingSkills(missing);

        return Math.min(100, score);
    }

    /**
     * Expande skills com sinônimos
     */
    private List<String> expandSkills(List<String> skills) {
        Set<String> expanded = new HashSet<>();
        if (skills == null) return new ArrayList<>();

        for (String skill : skills) {
            expanded.add(skill.toLowerCase().trim());

            // Adicionar sinônimos
            for (Map.Entry<String, List<String>> entry : SKILL_SYNONYMS.entrySet()) {
                if (entry.getKey().equals(skill.toLowerCase()) ||
                        entry.getValue().contains(skill.toLowerCase())) {
                    expanded.add(entry.getKey());
                    expanded.addAll(entry.getValue());
                }
            }
        }

        return new ArrayList<>(expanded);
    }

    /**
     * Extrai skills da descrição e título da vaga
     */
    private List<String> extractSkillsFromJob(Job job) {
        Set<String> skills = new LinkedHashSet<>(); // LinkedHashSet mantém ordem
        String text = (job.getTitle() + " " + job.getDescription()).toLowerCase();

        // Procurar por todas as skills conhecidas
        for (String skill : SKILL_SYNONYMS.keySet()) {
            if (text.contains(skill.toLowerCase())) {
                skills.add(skill);
            }
        }

        // Procurar por variações
        for (Map.Entry<String, List<String>> entry : SKILL_SYNONYMS.entrySet()) {
            for (String synonym : entry.getValue()) {
                if (text.contains(synonym.toLowerCase())) {
                    skills.add(entry.getKey());
                }
            }
        }

        // Extrair skills do título com mais peso (adiciona no início)
        String titleText = job.getTitle().toLowerCase();
        for (String skill : SKILL_SYNONYMS.keySet()) {
            if (titleText.contains(skill.toLowerCase()) && !skills.contains(skill)) {
                // Adiciona no início para dar prioridade
                Set<String> reordered = new LinkedHashSet<>();
                reordered.add(skill);
                reordered.addAll(skills);
                skills = reordered;
            }
        }

        return new ArrayList<>(skills);
    }

    /**
     * Verifica se uma skill da vaga combina com as skills do candidato
     */
    private boolean isSkillMatching(String jobSkill, List<String> resumeSkills) {
        String normalizedJob = jobSkill.toLowerCase().trim();

        // Match direto
        if (resumeSkills.contains(normalizedJob)) {
            return true;
        }

        // Match por sinônimo
        List<String> synonyms = SKILL_SYNONYMS.getOrDefault(normalizedJob, Arrays.asList());
        for (String synonym : synonyms) {
            if (resumeSkills.contains(synonym.toLowerCase())) {
                return true;
            }
        }

        // Match parcial (contém)
        for (String resumeSkill : resumeSkills) {
            if (resumeSkill.contains(normalizedJob) || normalizedJob.contains(resumeSkill)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calcula match de experiência
     */
    private double calculateExperienceMatch(Resume resume, Job job) {
        int candidateYears = extractExperienceYears(resume.getFullText());
        int requiredYears = extractExperienceYears(job.getDescription());
        String seniority = detectJobSeniority(job);

        // Se a vaga não especifica experiência, score alto
        if (requiredYears == 0 && seniority == null) {
            return 80.0;
        }

        // Se tem senioridade definida
        if (seniority != null) {
            int[] range = SENIORITY_LEVELS.get(seniority.toLowerCase());
            if (range != null) {
                requiredYears = Math.max(requiredYears, range[0]);
            }
        }

        // Se candidato tem mais experiência que o requerido
        if (candidateYears >= requiredYears) {
            // Bônus por ter mais experiência, mas limitado
            double bonus = Math.min(20, (candidateYears - requiredYears) * 3);
            return Math.min(100, 80 + bonus);
        }

        // Se tem menos experiência, score proporcional
        if (requiredYears > 0) {
            return Math.max(10, ((double) candidateYears / requiredYears) * 70);
        }

        return 70.0;
    }

    /**
     * Calcula match de cargo
     */
    private double calculateRoleMatch(Resume resume, Job job) {
        String desiredRole = resume.getDesiredRole() != null ?
                resume.getDesiredRole().toLowerCase() : "";
        String jobTitle = job.getTitle().toLowerCase();

        // Match exato
        if (desiredRole.equals(jobTitle)) {
            return 100.0;
        }

        // Verificar correspondências parciais
        Map<String, String[]> roleCategories = new HashMap<>();
        roleCategories.put("frontend", new String[]{"frontend", "front-end", "front end", "react", "angular", "vue", "ui"});
        roleCategories.put("backend", new String[]{"backend", "back-end", "back end", "java", "python", "node", "api"});
        roleCategories.put("fullstack", new String[]{"fullstack", "full-stack", "full stack"});
        roleCategories.put("devops", new String[]{"devops", "infraestrutura", "cloud", "aws", "azure", "docker"});
        roleCategories.put("data", new String[]{"dados", "data", "analytics", "machine learning", "big data"});
        roleCategories.put("mobile", new String[]{"mobile", "android", "ios", "flutter", "react native"});
        roleCategories.put("qa", new String[]{"qa", "teste", "test", "quality assurance", "automação"});
        roleCategories.put("design", new String[]{"design", "ux", "ui", "user experience", "figma"});
        roleCategories.put("management", new String[]{"manager", "gerente", "product owner", "scrum master", "tech lead"});

        String resumeCategory = null;
        String jobCategory = null;

        for (Map.Entry<String, String[]> entry : roleCategories.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (desiredRole.contains(keyword)) resumeCategory = entry.getKey();
                if (jobTitle.contains(keyword)) jobCategory = entry.getKey();
            }
        }

        // Mesma categoria
        if (resumeCategory != null && resumeCategory.equals(jobCategory)) {
            return 85.0;
        }

        // Categorias relacionadas
        if (resumeCategory != null && jobCategory != null) {
            if ((resumeCategory.equals("frontend") || resumeCategory.equals("backend")) &&
                    jobCategory.equals("fullstack")) {
                return 75.0;
            }
            if (resumeCategory.equals("backend") && jobCategory.equals("devops")) {
                return 70.0;
            }
        }

        // Match parcial por palavras
        String[] desiredWords = desiredRole.split("\\s+");
        String[] jobWords = jobTitle.split("\\s+");
        int matchCount = 0;

        for (String dw : desiredWords) {
            if (dw.length() > 3) {
                for (String jw : jobWords) {
                    if (jw.contains(dw) || dw.contains(jw)) {
                        matchCount++;
                        break;
                    }
                }
            }
        }

        double wordMatchScore = desiredWords.length > 0 ?
                ((double) matchCount / Math.max(desiredWords.length, jobWords.length)) * 60 : 40;

        return Math.max(30, wordMatchScore);
    }

    /**
     * Calcula match de educação
     */
    private double calculateEducationMatch(Resume resume, Job job) {
        String resumeText = resume.getFullText().toLowerCase();
        String jobText = job.getDescription().toLowerCase();

        Map<String, Integer> educationLevels = new HashMap<>();
        educationLevels.put("fundamental", 1);
        educationLevels.put("médio", 2);
        educationLevels.put("técnico", 3);
        educationLevels.put("tecnólogo", 3);
        educationLevels.put("graduação", 4);
        educationLevels.put("bacharel", 4);
        educationLevels.put("licenciatura", 4);
        educationLevels.put("pós-graduação", 5);
        educationLevels.put("especialização", 5);
        educationLevels.put("mba", 6);
        educationLevels.put("mestrado", 7);
        educationLevels.put("doutorado", 8);
        educationLevels.put("phd", 8);

        int candidateLevel = 0;
        int requiredLevel = 0;

        for (Map.Entry<String, Integer> entry : educationLevels.entrySet()) {
            if (resumeText.contains(entry.getKey())) {
                candidateLevel = Math.max(candidateLevel, entry.getValue());
            }
            if (jobText.contains(entry.getKey())) {
                requiredLevel = Math.max(requiredLevel, entry.getValue());
            }
        }

        if (requiredLevel == 0) return 80.0; // Vaga não especifica
        if (candidateLevel == 0) return 50.0; // Não detectou educação

        if (candidateLevel >= requiredLevel) return 100.0;
        return ((double) candidateLevel / requiredLevel) * 80;
    }

    /**
     * Calcula match de localização
     */
    private double calculateLocationMatch(Resume resume, Job job) {
        String resumeLocation = resume.getFullText().toLowerCase();
        String jobLocation = (job.getLocation() != null ? job.getLocation() : "").toLowerCase();

        // Vaga remota
        if (jobLocation.contains("remoto") || jobLocation.contains("remote") ||
                jobLocation.contains("home office")) {
            return 100.0;
        }

        // Sem localização definida
        if (jobLocation.isEmpty()) return 80.0;

        // Extrair cidades
        String[] cities = {
                "são paulo", "rio de janeiro", "belo horizonte", "brasília",
                "salvador", "fortaleza", "curitiba", "recife", "porto alegre",
                "manaus", "florianópolis", "goiânia", "campinas", "santos"
        };

        String resumeCity = null;
        String jobCity = null;

        for (String city : cities) {
            if (resumeLocation.contains(city)) resumeCity = city;
            if (jobLocation.contains(city)) jobCity = city;
        }

        if (resumeCity != null && jobCity != null) {
            if (resumeCity.equals(jobCity)) return 100.0;
            // Mesmo estado? Verificar cidades próximas
            return 60.0;
        }

        // Match parcial
        if (resumeCity != null && jobLocation.contains(resumeCity.substring(0, 5))) {
            return 75.0;
        }

        return 50.0;
    }

    /**
     * Extrai anos de experiência do texto
     */
    private int extractExperienceYears(String text) {
        if (text == null) return 0;
        String lowerText = text.toLowerCase();

        Pattern[] patterns = {
                Pattern.compile("(\\d+)\\s*\\+?\\s*anos?\\s*(de\\s*)?experiência"),
                Pattern.compile("experiência\\s*(de\\s*)?(\\d+)\\s*\\+?\\s*anos?"),
                Pattern.compile("(\\d+)\\s*\\+?\\s*years?\\s*(of\\s*)?experience"),
                Pattern.compile("experience\\s*(of\\s*)?(\\d+)\\s*\\+?\\s*years?"),
                Pattern.compile("(\\d+)\\s*\\+?\\s*anos?"),
        };

        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(lowerText);
            if (matcher.find()) {
                try {
                    int years = Integer.parseInt(matcher.group(1));
                    return Math.min(years, 30); // Limitar a 30 anos
                } catch (NumberFormatException e) {
                    // tenta o grupo 2
                    try {
                        int years = Integer.parseInt(matcher.group(2));
                        return Math.min(years, 30);
                    } catch (Exception ignored) {}
                }
            }
        }

        return 0;
    }

    /**
     * Detecta senioridade da vaga
     */
    private String detectJobSeniority(Job job) {
        String text = (job.getTitle() + " " + job.getDescription()).toLowerCase();

        for (String level : SENIORITY_LEVELS.keySet()) {
            if (text.contains(level.toLowerCase())) {
                return level;
            }
        }

        return null;
    }

    /**
     * Gera recomendação baseada no score
     */
    private String generateRecommendation(MatchResult result) {
        double score = result.getTotalScore();

        if (score >= 90) {
            return "🎯 Perfil ideal! Match excepcional com a vaga. Candidate-se imediatamente!";
        } else if (score >= 75) {
            return "👍 Excelente compatibilidade! Suas habilidades são muito relevantes.";
        } else if (score >= 60) {
            return "📈 Boa oportunidade! Vale a pena se candidatar e destacar suas qualificações.";
        } else if (score >= 40) {
            return "🤔 Oportunidade de crescimento! Considere desenvolver as skills faltantes.";
        } else {
            return "📚 Vaga desafiadora! Pode ser uma boa oportunidade de aprendizado.";
        }
    }

    /**
     * Gera destaques do match
     */
    private List<String> generateHighlights(MatchResult result) {
        List<String> highlights = new ArrayList<>();

        if (result.getSkillMatchScore() >= 80) {
            highlights.add("✅ Alta compatibilidade de habilidades técnicas");
        }
        if (result.getRoleScore() >= 80) {
            highlights.add("✅ Cargo compatível com seu perfil");
        }
        if (result.getLocationScore() >= 90) {
            highlights.add("✅ Localização compatível");
        }
        if (result.getExperienceScore() >= 80) {
            highlights.add("✅ Experiência adequada para a vaga");
        }
        if (result.getMissingSkills() != null && !result.getMissingSkills().isEmpty()) {
            highlights.add("📚 Skills para desenvolver: " +
                    result.getMissingSkills().stream().limit(3).collect(Collectors.joining(", ")));
        }

        if (highlights.isEmpty()) {
            highlights.add("📊 Analise os detalhes da vaga para mais informações");
        }

        return highlights;
    }

    /**
     * Atribui níveis de match
     */
    private void assignMatchLevels(List<MatchResult> results) {
        for (MatchResult result : results) {
            double score = result.getTotalScore();
            if (score >= 90) result.setMatchLevel("PERFECT");
            else if (score >= 75) result.setMatchLevel("EXCELLENT");
            else if (score >= 60) result.setMatchLevel("GOOD");
            else if (score >= 40) result.setMatchLevel("FAIR");
            else result.setMatchLevel("LOW");
        }
    }
}