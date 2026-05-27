// Serviço de IA para análise inteligente de vagas
class AIService {
  constructor() {
    this.skillWeights = {
      technical: 0.4,
      soft: 0.2,
      experience: 0.25,
      education: 0.15,
    };

    this.technicalSkills = [
      'javascript', 'typescript', 'python', 'java', 'c#', '.net', 'php',
      'ruby', 'go', 'rust', 'swift', 'kotlin', 'dart', 'scala',
      'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt',
      'node.js', 'express', 'django', 'flask', 'spring', 'laravel',
      'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform',
      'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
      'git', 'ci/cd', 'jenkins', 'github actions', 'gitlab ci',
      'html', 'css', 'sass', 'tailwind', 'bootstrap',
      'react native', 'flutter', 'ionic', 'electron',
      'graphql', 'rest', 'grpc', 'websocket',
      'linux', 'bash', 'powershell', 'nginx', 'apache',
    ];

    this.softSkills = [
      'comunicação', 'liderança', 'trabalho em equipe', 'proatividade',
      'resolução de problemas', 'pensamento crítico', 'criatividade',
      'adaptabilidade', 'empatia', 'organização', 'gestão de tempo',
      'inglês', 'espanhol', 'flexibilidade', 'autonomia',
      'colaboração', 'mentoria', 'apresentação', 'negociação',
    ];
  }

  // Análise completa de match entre perfil e vaga
  analyzeJobMatch(profile, job) {
    const skillsAnalysis = this.analyzeSkills(profile, job);
    const experienceAnalysis = this.analyzeExperience(profile, job);
    const educationAnalysis = this.analyzeEducation(profile, job);
    const locationAnalysis = this.analyzeLocation(profile, job);
    const seniorityAnalysis = this.analyzeSeniority(profile, job);

    const weights = {
      skills: 0.35,
      experience: 0.25,
      education: 0.15,
      location: 0.10,
      seniority: 0.15,
    };

    const totalScore = Math.round(
      skillsAnalysis.score * weights.skills +
      experienceAnalysis.score * weights.experience +
      educationAnalysis.score * weights.education +
      locationAnalysis.score * weights.location +
      seniorityAnalysis.score * weights.seniority
    );

    return {
      score: totalScore,
      level: this.getMatchLevel(totalScore),
      color: this.getMatchColor(totalScore),
      recommendation: this.generateRecommendation(totalScore),
      details: {
        skills: skillsAnalysis,
        experience: experienceAnalysis,
        education: educationAnalysis,
        location: locationAnalysis,
        seniority: seniorityAnalysis,
      },
      matchingHighlights: this.getMatchingHighlights(profile, job),
      missingSkills: skillsAnalysis.missing,
      tips: this.generateTips(totalScore, skillsAnalysis),
    };
  }

  // Análise detalhada de skills
  analyzeSkills(profile, job) {
    const description = (job.description || '').toLowerCase();
    const title = (job.title || '').toLowerCase();
    const fullText = `${description} ${title}`;
    
    const candidateSkills = this.extractCandidateSkills(profile);
    const requiredSkills = this.extractRequiredSkills(fullText);
    
    // Encontrar matches e missing
    const matching = candidateSkills.filter(skill => 
      requiredSkills.some(req => req.toLowerCase().includes(skill.toLowerCase()))
    );
    
    const missing = requiredSkills.filter(req => 
      !candidateSkills.some(skill => req.toLowerCase().includes(skill.toLowerCase()))
    );

    // Calcular score ponderado
    const technicalMatch = matching.filter(s => this.technicalSkills.includes(s)).length;
    const softMatch = matching.filter(s => this.softSkills.includes(s)).length;
    
    const totalRequired = requiredSkills.length || 1;
    const matchCount = matching.length;
    
    const score = Math.min(100, Math.round((matchCount / totalRequired) * 100));
    
    return {
      score,
      matching,
      missing,
      totalRequired,
      matchCount,
      details: {
        technical: technicalMatch,
        soft: softMatch,
      }
    };
  }

  // Análise de experiência
  analyzeExperience(profile, job) {
    const description = (job.description || '').toLowerCase();
    const experience = (profile.experience || '').toLowerCase();
    
    // Extrair anos de experiência
    const requiredYears = this.extractYears(description);
    const candidateYears = this.extractYears(experience);
    
    let score = 70; // Score base
    
    if (requiredYears && candidateYears) {
      if (candidateYears >= requiredYears) {
        score = 100;
      } else {
        score = Math.round((candidateYears / requiredYears) * 100);
      }
    } else if (requiredYears && !candidateYears) {
      score = 30;
    } else if (!requiredYears && candidateYears) {
      score = 90;
    }
    
    return {
      score,
      requiredYears: requiredYears || 'Não especificado',
      candidateYears: candidateYears || 'Não especificado',
      level: this.getExperienceLevel(candidateYears || 0),
    };
  }

  // Análise de educação
  analyzeEducation(profile, job) {
    const description = (job.description || '').toLowerCase();
    const education = (profile.education || '').toLowerCase();
    
    const levels = {
      'fundamental': 1,
      'médio': 2,
      'técnico': 3,
      'tecnólogo': 4,
      'graduação': 5,
      'bacharel': 5,
      'licenciatura': 5,
      'pós-graduação': 6,
      'especialização': 6,
      'mba': 7,
      'mestrado': 8,
      'doutorado': 9,
      'phd': 9,
    };
    
    let requiredLevel = 0;
    let candidateLevel = 0;
    
    Object.entries(levels).forEach(([key, value]) => {
      if (description.includes(key)) requiredLevel = Math.max(requiredLevel, value);
      if (education.includes(key)) candidateLevel = Math.max(candidateLevel, value);
    });
    
    if (requiredLevel === 0) requiredLevel = 3; // Nível técnico como padrão
    if (candidateLevel === 0) candidateLevel = 3;
    
    const score = candidateLevel >= requiredLevel ? 100 : 
                  Math.round((candidateLevel / requiredLevel) * 100);
    
    return {
      score,
      requiredLevel: this.getEducationName(requiredLevel),
      candidateLevel: this.getEducationName(candidateLevel),
    };
  }

  // Análise de localização
  analyzeLocation(profile, job) {
    const candidateLocation = (profile.location || '').toLowerCase();
    const jobLocation = (job.location || '').toLowerCase();
    
    if (!candidateLocation || !jobLocation) return { score: 70 };
    
    // Vaga remota é match perfeito
    if (jobLocation.includes('remoto') || jobLocation.includes('remote')) {
      return { score: 100, type: 'Remoto' };
    }
    
    // Verificar mesma cidade/estado
    if (candidateLocation === jobLocation) {
      return { score: 100, type: 'Mesma localização' };
    }
    
    const candidateCity = candidateLocation.split(',')[0].trim();
    const jobCity = jobLocation.split(',')[0].trim();
    
    if (candidateCity === jobCity) {
      return { score: 95, type: 'Mesma cidade' };
    }
    
    return { score: 40, type: 'Localizações diferentes' };
  }

  // Análise de senioridade
  analyzeSeniority(profile, job) {
    const title = (job.title || '').toLowerCase();
    const experience = profile.experience || '';
    
    const levels = {
      'estágio': { min: 0, max: 1 },
      'estagiário': { min: 0, max: 1 },
      'junior': { min: 0, max: 2 },
      'júnior': { min: 0, max: 2 },
      'pleno': { min: 2, max: 5 },
      'senior': { min: 5, max: 8 },
      'sênior': { min: 5, max: 8 },
      'especialista': { min: 7, max: 10 },
      'tech lead': { min: 7, max: 12 },
      'gerente': { min: 6, max: 15 },
      'diretor': { min: 10, max: 20 },
    };
    
    const candidateYears = this.extractYears(experience) || 1;
    let requiredLevel = null;
    
    Object.entries(levels).forEach(([key, value]) => {
      if (title.includes(key)) {
        requiredLevel = { title: key, ...value };
      }
    });
    
    if (!requiredLevel) {
      return { score: 80, match: 'Nível não especificado' };
    }
    
    if (candidateYears >= requiredLevel.min) {
      return { score: 100, match: 'Senioridade compatível' };
    } else {
      const score = Math.round((candidateYears / requiredLevel.min) * 100);
      return { score, match: `Abaixo do esperado (${requiredLevel.title})` };
    }
  }

  // Funções auxiliares
  extractCandidateSkills(profile) {
    const skills = [];
    
    if (profile.skills) {
      skills.push(...profile.skills.toLowerCase().split(',').map(s => s.trim()));
    }
    
    if (profile.experience) {
      this.technicalSkills.forEach(skill => {
        if (profile.experience.toLowerCase().includes(skill)) {
          skills.push(skill);
        }
      });
    }
    
    return [...new Set(skills)]; // Remove duplicatas
  }

  extractRequiredSkills(text) {
    const skills = [];
    
    this.technicalSkills.forEach(skill => {
      if (text.includes(skill)) {
        skills.push(skill);
      }
    });
    
    this.softSkills.forEach(skill => {
      if (text.includes(skill)) {
        skills.push(skill);
      }
    });
    
    return [...new Set(skills)];
  }

  extractYears(text) {
    const patterns = [
      /(\d+)\+?\s*anos? de experiência/i,
      /(\d+)\+?\s*years? of experience/i,
      /experiência de (\d+)\+?\s*anos?/i,
      /(\d+)\+?\s*anos?/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    
    return null;
  }

  getMatchLevel(score) {
    if (score >= 90) return 'Match Perfeito';
    if (score >= 75) return 'Excelente Match';
    if (score >= 60) return 'Bom Match';
    if (score >= 40) return 'Match Regular';
    return 'Match Baixo';
  }

  getMatchColor(score) {
    if (score >= 90) return '#10b981'; // Verde
    if (score >= 75) return '#3b82f6'; // Azul
    if (score >= 60) return '#f59e0b'; // Amarelo
    if (score >= 40) return '#f97316'; // Laranja
    return '#ef4444'; // Vermelho
  }

  getExperienceLevel(years) {
    if (years >= 8) return 'Sênior';
    if (years >= 5) return 'Pleno/Sênior';
    if (years >= 2) return 'Pleno';
    if (years >= 1) return 'Júnior';
    return 'Iniciante';
  }

  getEducationName(level) {
    const names = {
      1: 'Fundamental', 2: 'Médio', 3: 'Técnico',
      4: 'Tecnólogo', 5: 'Graduação', 6: 'Pós-graduação',
      7: 'MBA', 8: 'Mestrado', 9: 'Doutorado',
    };
    return names[level] || 'Não especificado';
  }

  getMatchingHighlights(profile, job) {
    const highlights = [];
    const skills = this.analyzeSkills(profile, job);
    
    if (skills.matching.length > 0) {
      highlights.push(`✅ ${skills.matching.length} skills compatíveis: ${skills.matching.slice(0, 3).join(', ')}`);
    }
    
    if (skills.missing.length > 0) {
      highlights.push(`📚 ${skills.missing.length} skills para desenvolver: ${skills.missing.slice(0, 3).join(', ')}`);
    }
    
    return highlights;
  }

  generateRecommendation(score) {
    if (score >= 90) {
      return '🎯 Perfil excepcionalmente compatível! Candidate-se imediatamente e destaque seus pontos fortes.';
    }
    if (score >= 75) {
      return '👍 Ótima compatibilidade! Suas habilidades são muito relevantes para esta vaga.';
    }
    if (score >= 60) {
      return '📈 Boa oportunidade! Vale a pena se candidatar e destacar suas qualificações.';
    }
    if (score >= 40) {
      return '🤔 Oportunidade de crescimento! Considere desenvolver as skills faltantes.';
    }
    return '📚 Vaga desafiadora! Excelente para aprendizado, mas prepare-se bem para a entrevista.';
  }

  generateTips(score, skillsAnalysis) {
    const tips = [];
    
    if (score < 60) {
      tips.push('💡 Invista em cursos para desenvolver as skills faltantes');
      tips.push('📚 Considere projetos práticos para ganhar experiência');
    }
    
    if (skillsAnalysis.missing.length > 3) {
      tips.push('🎯 Priorize aprender: ' + skillsAnalysis.missing.slice(0, 3).join(', '));
    }
    
    if (score >= 60 && score < 80) {
      tips.push('📝 Destaque projetos relevantes no seu currículo');
      tips.push('🤝 Faça networking com pessoas da empresa');
    }
    
    if (score >= 80) {
      tips.push('✨ Você tem o perfil ideal! Prepare-se bem para a entrevista');
      tips.push('📊 Apresente cases e resultados quantificáveis');
    }
    
    return tips;
  }

  // Ordenar vagas por match
  sortJobsByMatch(profile, jobs) {
    return jobs
      .map(job => ({
        ...job,
        matchScore: this.analyzeJobMatch(profile, job).score,
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }
}

export const aiService = new AIService();