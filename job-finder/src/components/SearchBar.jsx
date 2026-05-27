import { useState } from 'react';
import './SearchBar.css';

function SearchBar({ onSearch, onRefresh, hasSearched, loading }) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [lastLocation, setLastLocation] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLastQuery(query);
    setLastLocation(location);
    onSearch(query, location);
  };

  const handleRefresh = () => {
    if (lastQuery || lastLocation) {
      onRefresh(lastQuery, lastLocation);
    }
  };

  return (
    <div className="search-container">
      <form className="search-bar" onSubmit={handleSubmit}>
        <div className="search-inputs">
          <input
            type="text"
            placeholder="Cargo, palavra-chave ou empresa"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
          <input
            type="text"
            placeholder="Localização (ex: São Paulo, Remoto)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? '🔍 Buscando...' : '🔍 Buscar Vagas'}
          </button>
        </div>
      </form>
      
      {hasSearched && (
        <div className="refresh-container">
          <button 
            onClick={handleRefresh} 
            className="refresh-button"
            disabled={loading}
            title="Atualizar vagas com a mesma busca"
          >
            <span className="refresh-icon">🔄</span>
            {loading ? 'Atualizando...' : 'Atualizar Vagas'}
          </button>
          <span className="refresh-hint">
            Busca atual: {lastQuery || 'Todos'} {lastLocation ? `em ${lastLocation}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}

export default SearchBar;