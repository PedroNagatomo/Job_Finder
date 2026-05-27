import { useState, useEffect, useRef } from 'react';
import { useProfile } from '../context/ProfileContext';
import { interviewService } from '../services/interviewService';
import './InterviewSimulator.css';

function InterviewSimulator({ job, isOpen, onClose }) {
  const { profile } = useProfile();
  const [step, setStep] = useState('intro');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [report, setReport] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  
  const modalRef = useRef(null);
  const questionRef = useRef(null);
  const feedbackRef = useRef(null);
  const reportRef = useRef(null);

  // Efeito para scroll quando o modal abre
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Pequeno delay para garantir que o modal está renderizado
      setTimeout(() => {
        modalRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        // Focar no modal para acessibilidade
        modalRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Scroll para a pergunta atual
  useEffect(() => {
    if (step === 'interview' && questionRef.current) {
      setTimeout(() => {
        questionRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }, 200);
    }
  }, [currentQuestion, step]);

  // Scroll para o feedback quando aparece
  useEffect(() => {
    if (feedback && feedbackRef.current) {
      setTimeout(() => {
        feedbackRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }, 300);
    }
  }, [feedback]);

  // Scroll para o relatório final
  useEffect(() => {
    if (step === 'report' && reportRef.current) {
      setTimeout(() => {
        reportRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }, 200);
    }
  }, [step]);

  if (!isOpen) return null;

  const startInterview = () => {
    const generatedQuestions = interviewService.generateQuestions(job);
    setQuestions(generatedQuestions);
    setStep('interview');
    setCurrentQuestion(0);
    setResponses([]);
    setFeedback(null);
  };

  const handleResponse = () => {
    if (!currentResponse.trim()) return;
    
    setIsThinking(true);
    
    // Simular análise da IA
    setTimeout(() => {
      const question = questions[currentQuestion];
      const analysis = interviewService.analyzeResponse(
        question,
        currentResponse,
        question.type
      );
      
      setFeedback(analysis);
      setResponses([...responses, { ...analysis, question: question.question }]);
      setIsThinking(false);
    }, 1500);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setCurrentResponse('');
      setFeedback(null);
    } else {
      // Finalizar entrevista
      const finalReport = interviewService.generateFinalReport(questions, responses);
      setReport(finalReport);
      setStep('report');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="interview-modal" 
        onClick={e => e.stopPropagation()}
        ref={modalRef}
        tabIndex={-1}
      >
        <div className="interview-header">
          <h3>🎤 Entrevista Simulada com IA</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {step === 'intro' && (
          <div className="interview-intro">
            <div className="intro-icon">🤖</div>
            <h4>Simulador de Entrevista Inteligente</h4>
            <p>Pratique para a vaga de <strong>{job.title}</strong> na <strong>{job.company}</strong></p>
            
            <div className="intro-info">
              <div className="info-card">
                <span>📝</span>
                <strong>5-6 Perguntas</strong>
                <p>Técnicas e comportamentais</p>
              </div>
              <div className="info-card">
                <span>🤖</span>
                <strong>Feedback IA</strong>
                <p>Análise em tempo real</p>
              </div>
              <div className="info-card">
                <span>📊</span>
                <strong>Relatório Final</strong>
                <p>Pontos fortes e melhorias</p>
              </div>
            </div>

            <button className="start-btn" onClick={startInterview}>
              🚀 Iniciar Simulação
            </button>
          </div>
        )}

        {step === 'interview' && (
          <div className="interview-session">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentQuestion + (feedback ? 1 : 0)) / questions.length) * 100}%` }}
              />
              <span>{currentQuestion + 1} / {questions.length}</span>
            </div>

            <div className="question-card" ref={questionRef}>
              <div className="question-header">
                <span className={`question-type ${questions[currentQuestion].type}`}>
                  {questions[currentQuestion].type === 'technical' ? '💻 Técnica' : '🗣️ Comportamental'}
                </span>
                {questions[currentQuestion].difficulty && (
                  <span 
                    className="difficulty-badge"
                    style={{ background: getDifficultyColor(questions[currentQuestion].difficulty) }}
                  >
                    {questions[currentQuestion].difficulty}
                  </span>
                )}
              </div>
              
              <p className="question-text">{questions[currentQuestion].question}</p>
              
              {questions[currentQuestion].expectedTopics && (
                <div className="expected-topics">
                  <span>Tópicos esperados:</span>
                  {questions[currentQuestion].expectedTopics.map((topic, i) => (
                    <span key={i} className="topic-tag">{topic}</span>
                  ))}
                </div>
              )}
            </div>

            {!feedback ? (
              <div className="response-area">
                <textarea
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  placeholder="Digite sua resposta como se estivesse em uma entrevista real..."
                  rows={5}
                  disabled={isThinking}
                  autoFocus
                />
                <div className="response-actions">
                  <span className="char-count">{currentResponse.length} caracteres</span>
                  <button 
                    className="submit-btn"
                    onClick={handleResponse}
                    disabled={!currentResponse.trim() || isThinking}
                  >
                    {isThinking ? (
                      <>
                        <span className="spinner"></span>
                        Analisando...
                      </>
                    ) : (
                      '📤 Enviar Resposta'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="feedback-area" ref={feedbackRef}>
                <div className={`feedback-card ${feedback.level}`}>
                  <div className="feedback-score">
                    <div className="score-circle" style={{ '--score': feedback.score }}>
                      <svg viewBox="0 0 60 60">
                        <circle cx="30" cy="30" r="25" fill="none" 
                                stroke="#f0ede8" strokeWidth="5" />
                        <circle cx="30" cy="30" r="25" fill="none" 
                                stroke={feedback.score >= 70 ? '#10b981' : 
                                        feedback.score >= 50 ? '#f59e0b' : '#ef4444'}
                                strokeWidth="5"
                                strokeDasharray={`${feedback.score * 1.57}, 157`}
                                strokeLinecap="round"
                                transform="rotate(-90 30 30)" />
                        <text x="30" y="32" textAnchor="middle" 
                              fill="currentColor" fontSize="14" fontWeight="bold">
                          {feedback.score}%
                        </text>
                      </svg>
                    </div>
                    <h4>{feedback.feedback}</h4>
                  </div>
                  
                  {feedback.details?.length > 0 && (
                    <ul className="feedback-details">
                      {feedback.details.map((detail, i) => (
                        <li key={i}>{detail}</li>
                      ))}
                    </ul>
                  )}
                  
                  {feedback.suggestions?.length > 0 && (
                    <div className="suggestions">
                      <strong>Sugestões de melhoria:</strong>
                      <ul>
                        {feedback.suggestions.map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <button className="next-btn" onClick={nextQuestion}>
                  {currentQuestion < questions.length - 1 ? '▶️ Próxima Pergunta' : '📊 Ver Resultado Final'}
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'report' && report && (
          <div className="interview-report" ref={reportRef}>
            <div className="report-header">
              <span className="report-icon">📊</span>
              <h3>Relatório de Desempenho</h3>
            </div>
            
            <div className="report-scores">
              <div className="total-score">
                <span className="score-number">{report.totalScore}%</span>
                <span className="score-label">{report.level}</span>
              </div>
              
              <div className="score-breakdown">
                <div className="breakdown-item">
                  <span>💻 Técnico</span>
                  <div className="mini-bar">
                    <div className="mini-fill" style={{ width: `${report.technicalScore}%` }} />
                  </div>
                  <span>{report.technicalScore}%</span>
                </div>
                <div className="breakdown-item">
                  <span>🗣️ Comportamental</span>
                  <div className="mini-bar">
                    <div className="mini-fill" style={{ width: `${report.behavioralScore}%` }} />
                  </div>
                  <span>{report.behavioralScore}%</span>
                </div>
              </div>
            </div>
            
            {report.strengths.length > 0 && (
              <div className="report-section">
                <h4>💪 Pontos Fortes</h4>
                <ul>
                  {report.strengths.map((strength, i) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {report.improvements.length > 0 && (
              <div className="report-section">
                <h4>📈 Áreas de Melhoria</h4>
                <ul>
                  {report.improvements.map((improvement, i) => (
                    <li key={i}>{improvement}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="report-section">
              <h4>🎯 Próximos Passos</h4>
              <ul>
                {report.nextSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
            
            <div className="report-actions">
              <button className="retry-btn" onClick={startInterview}>
                🔄 Refazer Entrevista
              </button>
              <button className="close-report-btn" onClick={onClose}>
                ✅ Concluir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InterviewSimulator;