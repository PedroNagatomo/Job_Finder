class InterviewService {
  constructor() {
    this.questionBank = {
      technical: {
        frontend: [
          'Explique o Virtual DOM e como o React o utiliza.',
          'Qual a diferença entre State e Props no React?',
          'Como funciona o useEffect e quando utilizá-lo?',
          'Explique o conceito de Context API e Redux.',
          'Como você otimizaria a performance de uma aplicação React?',
          'O que são Hooks customizados? Dê um exemplo.',
          'Explique Server-Side Rendering vs Client-Side Rendering.',
        ],
        backend: [
          'Explique o padrão REST e quando usar cada método HTTP.',
          'Como implementar autenticação JWT em uma API?',
          'Qual a diferença entre SQL e NoSQL? Quando usar cada?',
          'Explique o conceito de microsserviços vs monólito.',
          'Como garantir a segurança de uma API REST?',
          'O que são Design Patterns? Cite 3 que você usa.',
          'Explique como funciona o Docker e containerização.',
        ],
        general: [
          'Explique Programação Orientada a Objetos.',
          'O que são estruturas de dados? Cite exemplos.',
          'Explique o conceito de Clean Code.',
          'Como funciona o Git e controle de versão?',
          'O que é CI/CD e como implementar?',
          'Explique Testes Unitários e TDD.',
          'Como fazer deploy de uma aplicação?',
        ],
      },
      behavioral: [
        'Conte sobre um desafio técnico que você enfrentou e como resolveu.',
        'Como você lida com prazos apertados?',
        'Descreva uma situação onde você teve que aprender algo novo rapidamente.',
        'Como você lida com feedback negativo?',
        'Conte sobre um projeto que você liderou ou participou ativamente.',
        'Como você se mantém atualizado com novas tecnologias?',
        'Descreva seu processo de debugging.',
        'Como você prioriza tarefas em um projeto?',
        'Já teve conflitos com colegas? Como resolveu?',
        'Onde você se vê profissionalmente em 5 anos?',
      ],
    };
    
    this.feedbackTemplates = {
      excellent: 'Excelente resposta! Você demonstrou conhecimento profundo e clareza.',
      good: 'Boa resposta! Considere adicionar exemplos práticos.',
      average: 'Resposta adequada, mas poderia ser mais específica.',
      needsImprovement: 'Considere estudar mais este tópico e praticar com exemplos.',
    };
  }

  generateQuestions(job) {
    const questions = [];
    const title = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    
    // Determinar tipo de vaga
    let category = 'general';
    if (title.includes('front') || title.includes('react') || title.includes('ui')) {
      category = 'frontend';
    } else if (title.includes('back') || title.includes('api') || title.includes('node')) {
      category = 'backend';
    }
    
    // Selecionar perguntas técnicas relevantes
    const technicalPool = [
      ...this.questionBank.technical[category],
      ...this.questionBank.technical.general,
    ];
    
    // Embaralhar e selecionar 3-5 perguntas
    const shuffled = technicalPool.sort(() => Math.random() - 0.5);
    const selectedTechnical = shuffled.slice(0, 4);
    
    // Selecionar perguntas comportamentais
    const behavioralPool = [...this.questionBank.behavioral];
    const shuffledBehavioral = behavioralPool.sort(() => Math.random() - 0.5);
    const selectedBehavioral = shuffledBehavioral.slice(0, 2);
    
    // Criar estrutura das perguntas
    selectedTechnical.forEach((q, i) => {
      questions.push({
        id: `tech-${i}`,
        type: 'technical',
        category: category,
        question: q,
        expectedTopics: this.getExpectedTopics(q, description),
        difficulty: i < 2 ? 'medium' : 'hard',
      });
    });
    
    selectedBehavioral.forEach((q, i) => {
      questions.push({
        id: `behav-${i}`,
        type: 'behavioral',
        question: q,
        evaluationCriteria: [
          'Clareza na comunicação',
          'Exemplo concreto',
          'Resultado ou aprendizado',
        ],
      });
    });
    
    return questions;
  }
  
  getExpectedTopics(question, jobDescription) {
    const topics = [];
    
    if (question.toLowerCase().includes('react')) {
      topics.push('Virtual DOM', 'Componentes', 'Hooks', 'Estado');
    }
    if (question.toLowerCase().includes('api')) {
      topics.push('REST', 'HTTP', 'Autenticação', 'Endpoints');
    }
    if (question.toLowerCase().includes('performance')) {
      topics.push('Otimização', 'Lazy Loading', 'Caching', 'Code Splitting');
    }
    
    // Adicionar tópicos da descrição da vaga
    const skills = ['javascript', 'typescript', 'python', 'java', 'sql', 'aws', 'docker'];
    skills.forEach(skill => {
      if (jobDescription.includes(skill)) {
        topics.push(skill);
      }
    });
    
    return [...new Set(topics)].slice(0, 4);
  }
  
  analyzeResponse(question, response, type) {
    if (!response || response.length < 10) {
      return {
        score: 0,
        feedback: 'Resposta muito curta. Tente elaborar mais.',
        level: 'needsImprovement',
      };
    }
    
    let score = 50; // Score base
    const feedback = [];
    const analysis = {
      length: response.length,
      hasExample: false,
      hasTechnicalTerms: false,
      clarity: 0,
    };
    
    // Análise de comprimento
    if (response.length > 200) {
      score += 15;
      feedback.push('✅ Resposta detalhada');
      analysis.clarity += 30;
    } else if (response.length > 100) {
      score += 10;
      feedback.push('👍 Bom nível de detalhes');
      analysis.clarity += 20;
    }
    
    // Verificar exemplos
    const exampleIndicators = ['exemplo', 'projeto', 'caso', 'experiência', 'trabalhei', 'implementei'];
    const hasExample = exampleIndicators.some(word => response.toLowerCase().includes(word));
    if (hasExample) {
      score += 15;
      feedback.push('💡 Bons exemplos práticos');
      analysis.hasExample = true;
    }
    
    // Verificar termos técnicos
    const technicalTerms = [
      'react', 'angular', 'vue', 'node', 'api', 'rest', 'docker',
      'kubernetes', 'aws', 'sql', 'nosql', 'git', 'ci/cd',
      'javascript', 'typescript', 'python', 'java',
    ];
    const techCount = technicalTerms.filter(term => 
      response.toLowerCase().includes(term)
    ).length;
    
    if (techCount > 3) {
      score += 15;
      feedback.push('🔧 Excelente uso de termos técnicos');
      analysis.hasTechnicalTerms = true;
      analysis.clarity += 20;
    } else if (techCount > 1) {
      score += 5;
      feedback.push('👍 Bom vocabulário técnico');
      analysis.clarity += 10;
    }
    
    // Estrutura da resposta
    if (type === 'behavioral') {
      const hasStructure = ['situação', 'ação', 'resultado', 'aprendi'].some(
        word => response.toLowerCase().includes(word)
      );
      if (hasStructure) {
        score += 10;
        feedback.push('📋 Boa estrutura de resposta (STAR)');
        analysis.clarity += 20;
      }
    }
    
    // Limitar score
    score = Math.min(100, score);
    
    // Determinar nível
    let level;
    if (score >= 90) level = 'excellent';
    else if (score >= 70) level = 'good';
    else if (score >= 50) level = 'average';
    else level = 'needsImprovement';
    
    return {
      score,
      level,
      feedback: this.feedbackTemplates[level],
      details: feedback,
      analysis,
      suggestions: this.generateSuggestions(level, type, analysis),
    };
  }
  
  generateSuggestions(level, type, analysis) {
    const suggestions = [];
    
    if (!analysis.hasExample) {
      suggestions.push('📝 Adicione exemplos concretos de projetos ou experiências');
    }
    
    if (!analysis.hasTechnicalTerms && type === 'technical') {
      suggestions.push('🔧 Use terminologia técnica específica da área');
    }
    
    if (analysis.clarity < 50) {
      suggestions.push('💬 Estruture melhor sua resposta com introdução, desenvolvimento e conclusão');
    }
    
    if (level === 'needsImprovement') {
      suggestions.push('📚 Estude mais sobre o tópico e pratique explicar em voz alta');
      suggestions.push('🎯 Foque em entender os conceitos fundamentais primeiro');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('✨ Continue praticando e refinando suas respostas');
    }
    
    return suggestions;
  }
  
  generateFinalReport(questions, responses) {
    const totalScore = responses.reduce((sum, r) => sum + r.score, 0) / responses.length;
    const technicalScores = responses.filter((_, i) => questions[i].type === 'technical');
    const behavioralScores = responses.filter((_, i) => questions[i].type === 'behavioral');
    
    const avgTechnical = technicalScores.length > 0 
      ? technicalScores.reduce((s, r) => s + r.score, 0) / technicalScores.length 
      : 0;
    const avgBehavioral = behavioralScores.length > 0
      ? behavioralScores.reduce((s, r) => s + r.score, 0) / behavioralScores.length
      : 0;
    
    return {
      totalScore: Math.round(totalScore),
      technicalScore: Math.round(avgTechnical),
      behavioralScore: Math.round(avgBehavioral),
      level: this.getInterviewLevel(totalScore),
      strengths: this.identifyStrengths(responses),
      improvements: this.identifyImprovements(responses),
      nextSteps: this.generateNextSteps(totalScore),
    };
  }
  
  getInterviewLevel(score) {
    if (score >= 90) return 'Pronto para qualquer entrevista!';
    if (score >= 75) return 'Muito bem preparado';
    if (score >= 60) return 'Boa preparação';
    if (score >= 40) return 'Precisa praticar mais';
    return 'Recomendado estudar mais';
  }
  
  identifyStrengths(responses) {
    return responses
      .filter(r => r.score >= 70)
      .map(r => r.details?.join?.(', ') || 'Boa resposta')
      .slice(0, 3);
  }
  
  identifyImprovements(responses) {
    return responses
      .filter(r => r.score < 60)
      .flatMap(r => r.suggestions || [])
      .slice(0, 3);
  }
  
  generateNextSteps(score) {
    if (score >= 80) {
      return [
        '🎯 Agende entrevistas reais',
        '📊 Prepare cases e portfólio',
        '🤝 Faça networking com recrutadores',
      ];
    }
    if (score >= 60) {
      return [
        '📚 Estude os tópicos com menor pontuação',
        '🎤 Pratique entrevistas simuladas',
        '📝 Prepare exemplos específicos',
      ];
    }
    return [
      '📖 Reforce os fundamentos técnicos',
      '💻 Faça projetos práticos',
      '🗣️ Pratique explicar conceitos em voz alta',
    ];
  }
}

export const interviewService = new InterviewService();