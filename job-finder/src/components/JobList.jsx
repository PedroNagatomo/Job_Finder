import JobCard from './JobCard';
import './JobList.css';

function JobList({ jobs, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="job-list-status">
        <div className="loading-spinner"></div>
        <p>Buscando vagas em múltiplas fontes...</p>
        <p className="loading-subtitle">Isso pode levar alguns segundos</p>
      </div>
    );
  }

  if (error && !jobs?.length) {
    return (
      <div className="job-list-status error">
        <div className="error-icon">⚠️</div>
        <p className="error-message">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="retry-button">
            🔄 Tentar Novamente
          </button>
        )}
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="job-list-status">
        <div className="empty-icon">🔍</div>
        <p>Nenhuma vaga encontrada</p>
        <p className="empty-subtitle">Tente outros termos de busca ou atualize a página</p>
      </div>
    );
  }

  return (
    <div className="job-list">
      <div className="job-list-header">
        <p className="results-count">
          {jobs.length} {jobs.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
        </p>
      </div>
      <div className="jobs-grid">
        {jobs.map((job, index) => (
          <JobCard key={job.id || index} job={job} />
        ))}
      </div>
    </div>
  );
}

export default JobList;