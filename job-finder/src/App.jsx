import { useState, useEffect, useCallback, useMemo } from "react";
import SearchBar from "./components/SearchBar";
import JobList from "./components/JobList";
import ProfileButton from "./components/ProfileButton";
import ResumeUpload from "./components/ResumeUpload";
import InterviewSimulator from "./components/InterviewSimulator";
import {
  searchJobs,
  getAvailableSources,
  checkApiHealth,
  uploadResume,
} from "./services/api";
import "./App.css";
import { ProfileProvider } from "./context/ProfileContext";

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [apiStatus, setApiStatus] = useState("checking");
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchParams, setLastSearchParams] = useState({
    query: "",
    location: "",
  });
  const [refreshCount, setRefreshCount] = useState(0);
  const [resumeData, setResumeData] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showInterview, setShowInterview] = useState(false);
  const [selectedJobForInterview, setSelectedJobForInterview] = useState(null);

  // Novos estados para filtros
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month
  const [jobTypeFilter, setJobTypeFilter] = useState("all"); // all, remote, onsite, hybrid, clt, pj, freelance

  useEffect(() => {
    checkApiConnection();
    loadSources();
  }, []);

  const checkApiConnection = async () => {
    try {
      await checkApiHealth();
      setApiStatus("connected");
    } catch (err) {
      setApiStatus("disconnected");
      setError(
        "API não está disponível. Certifique-se de que o servidor Java está rodando na porta 8080.",
      );
    }
  };

  const loadSources = async () => {
    try {
      const availableSources = await getAvailableSources();
      setSources(availableSources);
    } catch (err) {
      console.error("Erro ao carregar fontes:", err);
    }
  };

  const handleResumeUpload = async (file, onComplete) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const result = await uploadResume(file);

      setResumeData(result.resume);
      setJobs(result.jobs);
      setLastSearchParams({
        query: result.searchQuery,
        location: result.location,
      });

      if (result.jobs.length === 0) {
        setError(
          "Nenhuma vaga compatível encontrada. Tente fazer uma busca manual.",
        );
      }

      onComplete?.();
    } catch (err) {
      setError(`Erro ao processar currículo: ${err.message}`);
      console.error("Erro no upload:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(
    async (query, location) => {
      if (apiStatus !== "connected") {
        setError("API não está conectada. Inicie o servidor Java primeiro.");
        return;
      }

      setLoading(true);
      setError(null);
      setHasSearched(true);
      setResumeData(null);
      setLastSearchParams({ query, location });

      try {
        const data = await searchJobs(query, location, selectedSource);
        setJobs(data);
        setRefreshCount(0);

        if (data.length === 0) {
          setError("Nenhuma vaga encontrada. Tente outros termos de busca.");
        }
      } catch (err) {
        setError(`Erro na busca: ${err.message}`);
        console.error("Erro na busca:", err);
      } finally {
        setLoading(false);
      }
    },
    [apiStatus, selectedSource],
  );

  const handleRefresh = useCallback(
    async (query, location) => {
      if (apiStatus !== "connected") {
        setError("API não está conectada. Inicie o servidor Java primeiro.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (resumeData && showUpload) {
          const result = await uploadResume(
            new File([], resumeData.fileName || "resume.pdf"),
          );
          setJobs(result.jobs);
        } else {
          const data = await searchJobs(query, location, selectedSource);
          const shuffledJobs = [...data].sort(() => Math.random() - 0.5);
          setJobs(shuffledJobs);
        }

        setRefreshCount((prev) => prev + 1);

        if (jobs.length === 0) {
          setError("Nenhuma vaga encontrada. Tente outros termos de busca.");
        }
      } catch (err) {
        setError(`Erro ao atualizar vagas: ${err.message}`);
        console.error("Erro no refresh:", err);
      } finally {
        setLoading(false);
      }
    },
    [apiStatus, selectedSource, resumeData, showUpload],
  );

  const handleSourceChange = (source) => {
    setSelectedSource(source);
    if (hasSearched && lastSearchParams.query) {
      handleSearch(lastSearchParams.query, lastSearchParams.location);
    }
  };

  const handleToggleMode = () => {
    setShowUpload(!showUpload);
    if (!showUpload) {
      setError(null);
    } else {
      setResumeData(null);
    }
  };

  const handleRetry = () => {
    if (resumeData && showUpload) {
      handleResumeUpload(new File([], "retry"));
    } else {
      handleRefresh(lastSearchParams.query, lastSearchParams.location);
    }
  };

  const handleOpenInterview = () => {
    // Se houver vagas carregadas, usa a primeira vaga como referência
    // ou cria um objeto de vaga genérico baseado na busca atual
    if (jobs.length > 0) {
      // Pega uma vaga aleatória para simular
      const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
      setSelectedJobForInterview(randomJob);
    } else {
      // Cria uma vaga genérica baseada na busca
      setSelectedJobForInterview({
        title: lastSearchParams.query || "Desenvolvedor",
        company: "Empresa (Simulação Geral)",
        location: lastSearchParams.location || "Brasil",
        description: `Vaga de ${lastSearchParams.query || "Desenvolvedor"} em ${lastSearchParams.location || "Brasil"}`,
        source: "Simulador de Entrevista",
      });
    }
    setShowInterview(true);
  };

  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    // Filtro por data
    const now = new Date();
    switch (dateFilter) {
      case "today":
        filtered = filtered.filter((job) => {
          if (!job.postedDate) return false;
          const jobDate = new Date(job.postedDate);
          return jobDate.toDateString() === now.toDateString();
        });
        break;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((job) => {
          if (!job.postedDate) return false;
          const jobDate = new Date(job.postedDate);
          return jobDate >= weekAgo;
        });
        break;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((job) => {
          if (!job.postedDate) return false;
          const jobDate = new Date(job.postedDate);
          return jobDate >= monthAgo;
        });
        break;
      default:
        break;
    }

    // Filtro por tipo de vaga
    switch (jobTypeFilter) {
      case "remote":
        filtered = filtered.filter(
          (job) =>
            job.location?.toLowerCase().includes("remoto") ||
            job.location?.toLowerCase().includes("remote") ||
            job.type?.toLowerCase().includes("remoto") ||
            job.type?.toLowerCase().includes("remote"),
        );
        break;
      case "onsite":
        filtered = filtered.filter(
          (job) =>
            !job.location?.toLowerCase().includes("remoto") &&
            !job.location?.toLowerCase().includes("remote") &&
            !job.type?.toLowerCase().includes("remoto") &&
            !job.type?.toLowerCase().includes("remote"),
        );
        break;
      case "hybrid":
        filtered = filtered.filter(
          (job) =>
            job.location?.toLowerCase().includes("híbrido") ||
            job.location?.toLowerCase().includes("hybrid") ||
            job.type?.toLowerCase().includes("híbrido") ||
            job.type?.toLowerCase().includes("hybrid"),
        );
        break;
      case "clt":
        filtered = filtered.filter(
          (job) =>
            job.type?.toLowerCase().includes("clt") ||
            job.description?.toLowerCase().includes("clt"),
        );
        break;
      case "pj":
        filtered = filtered.filter(
          (job) =>
            job.type?.toLowerCase().includes("pj") ||
            job.description?.toLowerCase().includes("pj") ||
            job.description?.toLowerCase().includes("pessoa jurídica"),
        );
        break;
      case "freelance":
        filtered = filtered.filter(
          (job) =>
            job.type?.toLowerCase().includes("freelance") ||
            job.type?.toLowerCase().includes("freela") ||
            job.description?.toLowerCase().includes("freelancer"),
        );
        break;
      default:
        break;
    }

    return filtered;
  }, [jobs, dateFilter, jobTypeFilter]);

  // Contar vagas por tipo
  const jobStats = useMemo(() => {
    if (!jobs.length) return null;

    return {
      total: jobs.length,
      remote: jobs.filter(
        (j) =>
          j.location?.toLowerCase().includes("remoto") ||
          j.type?.toLowerCase().includes("remoto"),
      ).length,
      today: jobs.filter((j) => {
        if (!j.postedDate) return false;
        return (
          new Date(j.postedDate).toDateString() === new Date().toDateString()
        );
      }).length,
      week: jobs.filter((j) => {
        if (!j.postedDate) return false;
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(j.postedDate) >= weekAgo;
      }).length,
    };
  }, [jobs]);

  return (
    <ProfileProvider>
      <div className="App">
        <header className="app-header">
          <div className="header-content">
            <div>
              <h1>
                💼 <em>Job</em> Finder
              </h1>
              <p>Encontre vagas e candidate-se com 1 clique</p>
            </div>
            <div className="header-actions">
              <ProfileButton />
              <div className={`api-status ${apiStatus}`}>
                <span className="status-dot"></span>
                {apiStatus === "connected"
                  ? "API Conectada"
                  : apiStatus === "checking"
                    ? "Verificando..."
                    : "API Desconectada"}
              </div>
            </div>
          </div>

          {refreshCount > 0 && (
            <div className="refresh-counter">🔄 Atualizado {refreshCount}x</div>
          )}
        </header>

        <main className="app-main">
          {/* Barra de ações principais */}
          <div className="main-actions">
            {/* Toggle Upload/Busca Manual */}
            <button
              className={`action-btn toggle-btn ${showUpload ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggleMode();
              }}
              title={
                showUpload
                  ? "Ir para busca manual"
                  : "Fazer upload de currículo"
              }
              type="button"
            >
              <span className="action-icon">{showUpload ? "📋" : "📄"}</span>
              <span className="action-text">
                {showUpload ? "Busca Manual" : "Upload de Currículo"}
              </span>
            </button>

            {/* Botão de Simular Entrevista */}
            <button
              className="action-btn interview-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOpenInterview();
              }}
              title="Simular uma entrevista de emprego com IA"
              type="button"
            >
              <span className="action-icon">🎤</span>
              <span className="action-text">Simular Entrevista</span>
              <span className="action-badge">IA</span>
            </button>
          </div>

          {!showUpload && sources.length > 0 && (
            <div className="source-filter">
              <label>Filtrar por fonte:</label>
              <select
                value={selectedSource}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="source-select"
              >
                <option value="">Todas as fontes</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtros avançados */}
          <div className="filters-container">
            <div className="filters-row">
              {/* Filtro por Fonte */}
              <div className="filter-group">
                <label className="filter-label">
                  <span className="filter-icon">🔍</span>
                  Fonte
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todas as fontes</option>
                  {sources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Data */}
              <div className="filter-group">
                <label className="filter-label">
                  <span className="filter-icon">📅</span>
                  Período
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Todos os períodos</option>
                  <option value="today">Hoje</option>
                  <option value="week">Últimos 7 dias</option>
                  <option value="month">Últimos 30 dias</option>
                </select>
              </div>

              {/* Filtro por Tipo de Vaga */}
              <div className="filter-group">
                <label className="filter-label">
                  <span className="filter-icon">💼</span>
                  Tipo de Vaga
                </label>
                <select
                  value={jobTypeFilter}
                  onChange={(e) => setJobTypeFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="remote">🏠 Remoto</option>
                  <option value="onsite">🏢 Presencial</option>
                  <option value="hybrid">🔄 Híbrido</option>
                  <option value="clt">📋 CLT</option>
                  <option value="pj">📄 PJ</option>
                  <option value="freelance">🎯 Freelance</option>
                </select>
              </div>

              {/* Botão Limpar Filtros */}
              {(selectedSource ||
                dateFilter !== "all" ||
                jobTypeFilter !== "all") && (
                <div className="filter-group filter-actions">
                  <button
                    className="clear-filters-btn"
                    onClick={() => {
                      setSelectedSource("");
                      setDateFilter("all");
                      setJobTypeFilter("all");
                    }}
                    title="Limpar todos os filtros"
                  >
                    ✕ Limpar Filtros
                  </button>
                </div>
              )}
            </div>

            {/* Estatísticas rápidas */}
            {jobStats && jobs.length > 0 && (
              <div className="filter-stats">
                <span className="stat-item">
                  Total: <strong>{filteredJobs.length}</strong> vagas
                </span>
                {jobStats.remote > 0 && (
                  <span className="stat-item">
                    🏠 <strong>{jobStats.remote}</strong> remotas
                  </span>
                )}
                {jobStats.today > 0 && (
                  <span className="stat-item">
                    🆕 <strong>{jobStats.today}</strong> hoje
                  </span>
                )}
                {jobStats.week > 0 && (
                  <span className="stat-item">
                    📅 <strong>{jobStats.week}</strong> esta semana
                  </span>
                )}
              </div>
            )}
          </div>

          {showUpload ? (
            <ResumeUpload
              onResumeProcessed={handleResumeUpload}
              loading={loading}
            />
          ) : (
            <SearchBar
              onSearch={handleSearch}
              onRefresh={handleRefresh}
              hasSearched={hasSearched}
              loading={loading}
            />
          )}

          {/* Informações do currículo processado */}
          {resumeData && (
            <div className="resume-info">
              <div className="resume-info-header">
                <span>🎯 Vagas compatíveis com seu perfil:</span>
                <strong>{resumeData.desiredRole}</strong>
                {resumeData.experienceLevel &&
                  resumeData.experienceLevel !== "Não especificado" && (
                    <span className="resume-level">
                      {resumeData.experienceLevel}
                    </span>
                  )}
              </div>
              {resumeData.technologies &&
                resumeData.technologies.length > 0 && (
                  <div className="resume-techs">
                    {resumeData.technologies.slice(0, 5).map((tech, index) => (
                      <span key={index} className="tech-tag">
                        {tech}
                      </span>
                    ))}
                    {resumeData.technologies.length > 5 && (
                      <span className="tech-tag more">
                        +{resumeData.technologies.length - 5}
                      </span>
                    )}
                  </div>
                )}
              {resumeData.keywords && resumeData.keywords.length > 0 && (
                <div className="resume-keywords">
                  <span className="keywords-label">🔑 Palavras-chave:</span>
                  {resumeData.keywords.slice(0, 8).map((keyword, index) => (
                    <span key={index} className="keyword-tag">
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <JobList
            jobs={jobs}
            loading={loading}
            error={error}
            onRetry={hasSearched ? handleRetry : null}
          />
        </main>

        <footer className="app-footer">
          <p>Desenvolvido com React ❤️ | Buscando vagas em tempo real</p>
          <p className="footer-sources">
            Fontes: {sources.join(", ") || "Carregando..."}
          </p>
          <div className="footer-features">
            <span>🔍 Busca Multi-fontes</span>
            <span>•</span>
            <span>⚡ Candidatura Rápida</span>
            <span>•</span>
            <span>📄 Upload de Currículo</span>
            <span>•</span>
            <span>🎤 Simulador de Entrevista</span>
          </div>
        </footer>

        {/* Modal de Entrevista (fora do fluxo normal) */}
        {showInterview && selectedJobForInterview && (
          <InterviewSimulator
            job={selectedJobForInterview}
            isOpen={showInterview}
            onClose={() => setShowInterview(false)}
          />
        )}
      </div>
    </ProfileProvider>
  );
}

export default App;
