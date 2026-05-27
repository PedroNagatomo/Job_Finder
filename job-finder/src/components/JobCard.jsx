import { useState, useRef } from 'react';
import { useProfile } from '../context/ProfileContext';
import MatchScore from './MatchScore';
import InterviewSimulator from './InterviewSimulator';
import './JobCard.css';

function JobCard({ job }) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showQuickApply, setShowQuickApply] = useState(false);
  const [showInterview, setShowInterview] = useState(false);
  const { isProfileComplete } = useProfile();
  const cardRef = useRef(null);

  const handleCardClick = () => {
    if (job.url) {
      window.open(job.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleQuickApply = (e) => {
    e.stopPropagation();
    if (isProfileComplete) {
      // Scroll até o card antes de abrir
      scrollToCard();
      setTimeout(() => setShowQuickApply(true), 200);
    } else {
      alert('📋 Preencha seu perfil primeiro para usar a candidatura rápida!\n\nClique no botão "Perfil" no topo da página para cadastrar seus dados.');
      window.open(job.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleInterviewSimulation = (e) => {
    e.stopPropagation();
    if (isProfileComplete) {
      // Scroll suave até o card antes de abrir o modal
      scrollToCard();
      // Pequeno delay para o scroll terminar antes de abrir o modal
      setTimeout(() => setShowInterview(true), 300);
    } else {
      alert('📋 Preencha seu perfil primeiro para usar o simulador de entrevista!');
    }
  };

  const scrollToCard = () => {
    if (cardRef.current) {
      cardRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recém publicada';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Hoje';
      if (diffDays === 1) return 'Ontem';
      if (diffDays < 7) return `Há ${diffDays} dias`;
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const getSourceIcon = (source) => {
    const icons = {
      'LinkedIn': '💼',
      'Indeed': '🔍',
      'Google Jobs': '🌐',
      'Programathor': '💻',
      'InfoJobs': '📋',
      'Jobs Aggregator': '🎯'
    };
    return icons[source] || '📌';
  };

  return (
    <>
      <div className="job-card" onClick={handleCardClick} ref={cardRef}>
        <div className="job-card-header">
          <div className="company-logo-placeholder">
            {job.logoUrl ? (
              <img 
                src={job.logoUrl} 
                alt={`${job.company} logo`}
                className="company-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.querySelector('.company-initial').style.display = 'flex';
                }}
              />
            ) : null}
            <span className="company-initial" style={{ display: job.logoUrl ? 'none' : 'flex' }}>
              {job.company?.charAt(0) || 'C'}
            </span>
          </div>
          <div className="company-info">
            <h3 className="job-title">{job.title || 'Título não disponível'}</h3>
            <p className="company-name">{job.company || 'Empresa não informada'}</p>
          </div>
          <span className="source-badge" title={`Fonte: ${job.source}`}>
            {getSourceIcon(job.source)} {job.source}
          </span>
        </div>
        
        <div className="job-details">
          {job.location && (
            <span className="job-location">📍 {job.location}</span>
          )}
          {job.type && (
            <span className="job-type">💼 {job.type}</span>
          )}
        </div>
        
        <div className="job-description-container">
          <p className="job-description">
            {showFullDescription 
              ? job.description 
              : job.description?.substring(0, 150) + (job.description?.length > 150 ? '...' : '')
            }
          </p>
          {job.description?.length > 150 && (
            <button 
              className="show-more-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullDescription(!showFullDescription);
              }}
            >
              {showFullDescription ? 'Ver menos' : 'Ver mais'}
            </button>
          )}
        </div>

        {/* Features de IA */}
        {isProfileComplete && (
          <div className="ai-features">
            <MatchScore job={job} compact />
          
          </div>
        )}
        
        <div className="job-footer">
          <div className="job-actions">
            <button className="apply-button" onClick={(e) => {
              e.stopPropagation();
              window.open(job.url, '_blank', 'noopener,noreferrer');
            }}>
              Ver Vaga →
            </button>
          </div>
        </div>
      </div>

      {showQuickApply && (
        <QuickApply 
          job={job} 
          onClose={() => setShowQuickApply(false)} 
        />
      )}
      
      {showInterview && (
        <InterviewSimulator 
          job={job}
          isOpen={showInterview}
          onClose={() => setShowInterview(false)}
        />
      )}
    </>
  );
}

export default JobCard;