import { useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { aiService } from '../services/aiService';
import './MatchScore.css';

function MatchScore({ job, compact = false }) {
  const { profile, isProfileComplete } = useProfile();
  const [showDetails, setShowDetails] = useState(false);
  
  if (!isProfileComplete) return null;
  
  const match = aiService.analyzeJobMatch(profile, job);
  
  if (compact) {
    return (
      <div 
        className="match-score-compact"
        style={{ '--match-color': match.color }}
        onClick={() => setShowDetails(!showDetails)}
        title={match.recommendation}
      >
        <div className="mini-score-circle">
          <svg viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9155" fill="none" 
                    stroke="#f0ede8" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9155" fill="none" 
                    stroke={match.color} strokeWidth="3"
                    strokeDasharray={`${match.score}, 100`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)" />
            <text x="18" y="20" textAnchor="middle" 
                  fill="currentColor" fontSize="8" fontWeight="bold">
              {match.score}%
            </text>
          </svg>
        </div>
        <span className="match-label-compact">{match.level}</span>
        
        {showDetails && (
          <div className="match-details-popup">
            <MatchDetails match={match} />
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="match-score-full">
      <div className="match-header">
        <div className="score-circle-large">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" 
                    stroke="#f0ede8" strokeWidth="8" />
            <circle cx="50" cy="50" r="45" fill="none" 
                    stroke={match.color} strokeWidth="8"
                    strokeDasharray={`${match.score * 2.83}, 283`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)" />
            <text x="50" y="45" textAnchor="middle" 
                  fill="currentColor" fontSize="24" fontWeight="bold">
              {match.score}%
            </text>
            <text x="50" y="62" textAnchor="middle" 
                  fill="#8a8780" fontSize="10">
              {match.level}
            </text>
          </svg>
        </div>
        <p className="match-recommendation">{match.recommendation}</p>
      </div>
      
      <MatchDetails match={match} />
    </div>
  );
}

function MatchDetails({ match }) {
  return (
    <div className="match-details">
      <div className="detail-section">
        <h4>🎯 Skills</h4>
        <div className="detail-bar">
          <div className="bar-fill" style={{ width: `${match.details.skills.score}%` }} />
          <span>{match.details.skills.score}%</span>
        </div>
        <div className="skills-list">
          {match.details.skills.matching.slice(0, 5).map((skill, i) => (
            <span key={i} className="skill-tag matching">✅ {skill}</span>
          ))}
          {match.details.skills.missing.slice(0, 3).map((skill, i) => (
            <span key={i} className="skill-tag missing">⚠️ {skill}</span>
          ))}
        </div>
      </div>
      
      <div className="detail-section">
        <h4>💼 Experiência</h4>
        <div className="detail-bar">
          <div className="bar-fill" style={{ width: `${match.details.experience.score}%` }} />
          <span>{match.details.experience.score}%</span>
        </div>
        <p className="detail-text">
          Requerida: {match.details.experience.requiredYears} anos | 
          Você: {match.details.experience.candidateYears} anos
        </p>
      </div>
      
      <div className="detail-section">
        <h4>🎓 Educação</h4>
        <div className="detail-bar">
          <div className="bar-fill" style={{ width: `${match.details.education.score}%` }} />
          <span>{match.details.education.score}%</span>
        </div>
        <p className="detail-text">
          Requerida: {match.details.education.requiredLevel} | 
          Você: {match.details.education.candidateLevel}
        </p>
      </div>
      
      <div className="detail-section">
        <h4>📍 Localização</h4>
        <div className="detail-bar">
          <div className="bar-fill" style={{ width: `${match.details.location.score}%` }} />
          <span>{match.details.location.score}%</span>
        </div>
        <p className="detail-text">{match.details.location.type || 'Analisando...'}</p>
      </div>
      
      {match.tips.length > 0 && (
        <div className="detail-section tips">
          <h4>💡 Dicas Personalizadas</h4>
          <ul>
            {match.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MatchScore;