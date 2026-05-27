import { useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import ProfileModal from './ProfileModal';
import './ProfileButton.css';

function ProfileButton() {
  const [showModal, setShowModal] = useState(false);
  const { isProfileComplete } = useProfile();

  return (
    <>
      <button 
        className="profile-btn" 
        onClick={() => setShowModal(true)}
        title={isProfileComplete ? 'Perfil Completo ✅' : 'Preencha seu perfil para candidatura rápida'}
      >
        <span className="profile-icon">
          {isProfileComplete ? '👤✨' : '👤'}
        </span>
        <span className="profile-text">
          {isProfileComplete ? 'Perfil OK' : 'Criar Perfil'}
        </span>
        <span className={`profile-status ${isProfileComplete ? 'complete' : 'incomplete'}`} />
      </button>

      {showModal && (
        <ProfileModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
}

export default ProfileButton;