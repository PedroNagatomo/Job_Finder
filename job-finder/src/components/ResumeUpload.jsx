import { useState, useRef } from 'react';
import './ResumeUpload.css';

function ResumeUpload({ onResumeProcessed, loading }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    const allowedExtensions = ['.pdf', '.docx', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      alert('Formato de arquivo não suportado. Use PDF, DOCX ou TXT.');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('Arquivo muito grande. Tamanho máximo: 10MB.');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    // Simula progresso de upload
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 90) {
        clearInterval(interval);
      }
    }, 200);
    
    onResumeProcessed(selectedFile, () => {
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(0);
        setSelectedFile(null);
      }, 1000);
    });
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="resume-upload">
      <div className="upload-header">
        <h3>📄 Encontrar vagas compatíveis com seu currículo</h3>
        <p>Faça upload do seu currículo e encontraremos as melhores vagas para você</p>
      </div>
      
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {!selectedFile ? (
          <div className="upload-placeholder">
            <div className="upload-icon">📁</div>
            <p className="upload-text">
              Arraste seu currículo aqui ou <span className="browse-link">clique para selecionar</span>
            </p>
            <p className="upload-formats">Formatos aceitos: PDF, DOCX, TXT (máx. 10MB)</p>
          </div>
        ) : (
          <div className="file-preview">
            <div className="file-info">
              <div className="file-icon">
                {selectedFile.name.endsWith('.pdf') ? '📕' : 
                 selectedFile.name.endsWith('.docx') ? '📘' : '📄'}
              </div>
              <div className="file-details">
                <p className="file-name">{selectedFile.name}</p>
                <p className="file-size">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button 
                className="remove-file-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                disabled={loading}
              >
                ✕
              </button>
            </div>
            
            {uploadProgress > 0 && (
              <div className="upload-progress">
                <div 
                  className="progress-bar" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            
            <button
              className="upload-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleUpload();
              }}
              disabled={loading || uploadProgress > 0}
            >
              {loading ? (
                <>
                  <span className="loading-spinner-small"></span>
                  Processando...
                </>
              ) : uploadProgress === 100 ? (
                '✅ Processado!'
              ) : (
                '🔍 Buscar Vagas Compatíveis'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeUpload;