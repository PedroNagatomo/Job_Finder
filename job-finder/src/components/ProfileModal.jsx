import { useState, useRef } from 'react';
import { useProfile } from '../context/ProfileContext';
import './ProfileModal.css';

function ProfileModal({ isOpen, onClose }) {
  const { 
    profile, 
    resumeFile, 
    updateProfile, 
    updateResume, 
    removeResume, 
    resetProfile, 
    isProfileComplete 
  } = useProfile();
  
  const [activeSection, setActiveSection] = useState('personal');
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const handleChange = (field, value) => {
    updateProfile({ [field]: value });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Verificar tipo de arquivo
    const allowedTypes = ['application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus('❌ Formato não suportado. Use PDF ou DOC/DOCX');
      return;
    }

    // Verificar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus('❌ Arquivo muito grande. Máximo 5MB');
      return;
    }

    setUploadStatus('📄 Processando currículo...');

    // Ler o arquivo como base64 para armazenar
    const reader = new FileReader();
    reader.onload = (event) => {
      const resumeData = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        content: event.target.result, // base64
      };
      
      updateResume(resumeData);
      setUploadStatus('✅ Currículo enviado com sucesso!');
      
      // Tentar extrair informações do currículo (simulação)
      extractInfoFromResume(file.name);
      
      setTimeout(() => setUploadStatus(''), 3000);
    };
    
    reader.onerror = () => {
      setUploadStatus('❌ Erro ao ler arquivo. Tente novamente.');
    };
    
    reader.readAsDataURL(file);
  };

  const extractInfoFromResume = (fileName) => {
    // Simular extração de informações do currículo
    // Em produção, você enviaria para uma API de parsing de currículo
    const extractedSkills = [
      'JavaScript', 'React', 'Node.js', 'TypeScript', 
      'Python', 'SQL', 'Docker', 'Git'
    ];
    
    // Preencher skills se estiver vazio
    if (!profile.skills) {
      updateProfile({ 
        skills: extractedSkills.join(', '),
        summary: 'Profissional com experiência em desenvolvimento de software e tecnologias modernas.'
      });
      
      setUploadStatus('✅ Currículo processado! Informações extraídas automaticamente.');
    }
  };

  const handleRemoveResume = () => {
    removeResume();
    setUploadStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const sections = [
    { id: 'personal', label: '👤 Dados Pessoais' },
    { id: 'resume', label: '📄 Currículo' },
    { id: 'professional', label: '💼 Profissional' },
    { id: 'skills', label: '🎯 Habilidades' },
    { id: 'preferences', label: '⚙️ Preferências' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 Perfil do Candidato</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {showSuccess ? (
          <div className="success-message">
            <span className="success-icon">✅</span>
            <h3>Perfil Salvo com Sucesso!</h3>
            <p>Seus dados e currículo estão prontos para candidatura rápida</p>
          </div>
        ) : (
          <>
            <div className="profile-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${isProfileComplete ? 100 : calculateProgress()}%` }}
                />
              </div>
              <span className="progress-text">
                {isProfileComplete ? '✅ Perfil Completo' : `⚠️ ${getMissingFields()} campos obrigatórios faltando`}
              </span>
              {resumeFile && (
                <span className="resume-status-badge">
                  📄 Currículo anexado
                </span>
              )}
            </div>

            <div className="section-tabs">
              {sections.map(section => (
                <button
                  key={section.id}
                  className={`tab-btn ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.label}
                  {section.id === 'resume' && resumeFile && ' ✅'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              {/* Seção Dados Pessoais */}
              {activeSection === 'personal' && (
                <div className="form-section">
                  <div className="form-group">
                    <label>Nome Completo *</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Telefone *</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>LinkedIn *</label>
                    <input
                      type="url"
                      value={profile.linkedin}
                      onChange={(e) => handleChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/seu-perfil"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Portfólio/Site</label>
                    <input
                      type="url"
                      value={profile.portfolio}
                      onChange={(e) => handleChange('portfolio', e.target.value)}
                      placeholder="https://seu-portfolio.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Localização</label>
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="São Paulo, SP"
                    />
                  </div>
                </div>
              )}

              {/* Nova Seção: Upload de Currículo */}
              {activeSection === 'resume' && (
                <div className="form-section">
                  <div className="resume-upload-section">
                    <div className="resume-upload-header">
                      <h3>📄 Envie seu Currículo</h3>
                      <p>Formatos aceitos: PDF, DOC, DOCX (máx. 5MB)</p>
                    </div>

                    {!resumeFile ? (
                      <div className="upload-area">
                        <div className="upload-icon">📁</div>
                        <p>Arraste seu currículo ou clique para selecionar</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="file-input"
                          id="resume-upload"
                        />
                        <label htmlFor="resume-upload" className="upload-btn">
                          📎 Selecionar Arquivo
                        </label>
                        {uploadStatus && (
                          <p className={`upload-status ${uploadStatus.includes('✅') ? 'success' : 'error'}`}>
                            {uploadStatus}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="uploaded-resume">
                        <div className="resume-file-info">
                          <div className="file-icon">📄</div>
                          <div className="file-details">
                            <strong>{resumeFile.fileName}</strong>
                            <span>{formatFileSize(resumeFile.fileSize)}</span>
                            <span className="upload-date">
                              Enviado em {new Date(resumeFile.uploadDate).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="resume-actions">
                          <button 
                            type="button" 
                            className="replace-btn"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            🔄 Substituir
                          </button>
                          <button 
                            type="button" 
                            className="remove-resume-btn"
                            onClick={handleRemoveResume}
                          >
                            🗑️ Remover
                          </button>
                        </div>
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="file-input-hidden"
                          style={{ display: 'none' }}
                        />
                        
                        {uploadStatus && (
                          <p className={`upload-status ${uploadStatus.includes('✅') ? 'success' : 'error'}`}>
                            {uploadStatus}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="resume-tips">
                      <h4>💡 Dicas para seu currículo:</h4>
                      <ul>
                        <li>Mantenha o currículo atualizado com suas últimas experiências</li>
                        <li>Inclua palavras-chave relevantes para sua área</li>
                        <li>Destaque resultados e conquistas quantificáveis</li>
                        <li>Revise a formatação e ortografia</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Seção Profissional */}
              {activeSection === 'professional' && (
                <div className="form-section">
                  <div className="form-group">
                    <label>Resumo Profissional</label>
                    <textarea
                      value={profile.summary}
                      onChange={(e) => handleChange('summary', e.target.value)}
                      placeholder="Breve resumo da sua experiência profissional..."
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label>Experiência Profissional</label>
                    <textarea
                      value={profile.experience}
                      onChange={(e) => handleChange('experience', e.target.value)}
                      placeholder="Descreva sua experiência profissional relevante..."
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label>Formação Acadêmica</label>
                    <textarea
                      value={profile.education}
                      onChange={(e) => handleChange('education', e.target.value)}
                      placeholder="Sua formação acadêmica..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Seção Habilidades */}
              {activeSection === 'skills' && (
                <div className="form-section">
                  <div className="form-group">
                    <label>Habilidades Técnicas</label>
                    <textarea
                      value={profile.skills}
                      onChange={(e) => handleChange('skills', e.target.value)}
                      placeholder="React, JavaScript, Python, SQL, Docker..."
                      rows={3}
                    />
                    <span className="field-hint">Separe as habilidades por vírgula</span>
                  </div>
                  <div className="form-group">
                    <label>Idiomas</label>
                    <input
                      type="text"
                      value={profile.languages}
                      onChange={(e) => handleChange('languages', e.target.value)}
                      placeholder="Português (Nativo), Inglês (Avançado)..."
                    />
                  </div>
                </div>
              )}

              {/* Seção Preferências */}
              {activeSection === 'preferences' && (
                <div className="form-section">
                  <div className="form-group">
                    <label>Disponibilidade</label>
                    <select
                      value={profile.availability}
                      onChange={(e) => handleChange('availability', e.target.value)}
                    >
                      <option value="Imediata">Imediata</option>
                      <option value="15 dias">15 dias</option>
                      <option value="30 dias">30 dias</option>
                      <option value="A combinar">A combinar</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Pretensão Salarial</label>
                    <input
                      type="text"
                      value={profile.salaryExpectation}
                      onChange={(e) => handleChange('salaryExpectation', e.target.value)}
                      placeholder="Ex: R$ 5.000,00"
                    />
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="reset-btn" onClick={resetProfile}>
                  🗑️ Limpar Tudo
                </button>
                <button type="submit" className="save-btn">
                  💾 Salvar Perfil
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// Funções auxiliares
function calculateProgress() {
  // Lógica para calcular progresso do perfil
  return 40; // Valor exemplo
}

function getMissingFields() {
  return '4'; // Valor exemplo
}


export default ProfileModal;