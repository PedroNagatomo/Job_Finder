import { createContext, useContext, useState, useEffect } from 'react';

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile deve ser usado dentro de ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(() => {
    const savedProfile = localStorage.getItem('candidateProfile');
    return savedProfile ? JSON.parse(savedProfile) : getDefaultProfile();
  });

  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    const requiredFields = ['name', 'email', 'phone', 'linkedin'];
    const complete = requiredFields.every(field => profile[field]?.trim());
    setIsProfileComplete(complete);
    localStorage.setItem('candidateProfile', JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (updates) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const resetProfile = () => {
    setProfile(getDefaultProfile());
    localStorage.removeItem('candidateProfile');
  };

  // ❌ REMOVER: getApplicationData, quickApplyEnabled, toggleQuickApply

  return (
    <ProfileContext.Provider value={{
      profile,
      updateProfile,
      isProfileComplete,
      resetProfile,
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

function getDefaultProfile() {
  return {
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    portfolio: '',
    summary: '',
    skills: '',
    experience: '',
    education: '',
    languages: '',
    availability: 'Imediata',
    salaryExpectation: '',
    location: '',
  };
}