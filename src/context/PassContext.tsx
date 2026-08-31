import React, { createContext, useContext, useState, useEffect } from 'react';

export interface PassInfo {
  isActive: boolean;
  planId?: string;
  planName?: string;
  activatedAt?: string;
  expiresAt?: string;
  userId?: string;
}

interface PassContextType {
  hasPass: boolean;
  passInfo: PassInfo;
  activatePass: (planId?: string) => void;
  deactivatePass: () => void;
  requestFeature: (featureName: 'chronology' | 'recommendations' | 'image_search' | string) => boolean;
  isPassRequiredModalOpen: boolean;
  lockedFeatureName: string;
  closePassRequiredModal: () => void;
  openPassModal: () => void;
}

const PassContext = createContext<PassContextType | undefined>(undefined);

export const PassProvider: React.FC<{
  children: React.ReactNode;
  onOpenPassModal?: () => void;
}> = ({ children, onOpenPassModal }) => {
  const [hasPass, setHasPass] = useState<boolean>(() => {
    try {
      return localStorage.getItem('animem_pass_active') === 'true';
    } catch {
      return false;
    }
  });

  const [passInfo, setPassInfo] = useState<PassInfo>(() => {
    try {
      const saved = localStorage.getItem('animem_pass_info');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      isActive: false,
    };
  });

  const [isPassRequiredModalOpen, setIsPassRequiredModalOpen] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('animem_pass_active', hasPass ? 'true' : 'false');
      localStorage.setItem(
        'animem_pass_info',
        JSON.stringify({
          ...passInfo,
          isActive: hasPass,
        })
      );
    } catch (e) {
      console.error(e);
    }
  }, [hasPass, passInfo]);

  const activatePass = (planId: string = '1m') => {
    const planNames: Record<string, string> = {
      '1m': '1 Oylik Animem Pass',
      '2m': '2 Oylik Animem Pass',
      '3m': '3 Oylik Animem Pass',
      '6m': '6 Oylik Animem Pass',
      '1y': '1 Yillik Animem VIP Pass',
    };

    const now = new Date();
    const expiry = new Date();
    if (planId === '1y') expiry.setFullYear(now.getFullYear() + 1);
    else if (planId === '6m') expiry.setMonth(now.getMonth() + 6);
    else if (planId === '3m') expiry.setMonth(now.getMonth() + 3);
    else if (planId === '2m') expiry.setMonth(now.getMonth() + 2);
    else expiry.setMonth(now.getMonth() + 1);

    const newInfo: PassInfo = {
      isActive: true,
      planId,
      planName: planNames[planId] || 'Animem Pass VIP',
      activatedAt: now.toISOString(),
      expiresAt: expiry.toLocaleDateString('uz-UZ'),
      userId: `PASS-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    setPassInfo(newInfo);
    setHasPass(true);
    setIsPassRequiredModalOpen(false);
  };

  const deactivatePass = () => {
    setHasPass(false);
    setPassInfo({ isActive: false });
  };

  const requestFeature = (featureName: string): boolean => {
    if (hasPass) {
      return true;
    }
    setLockedFeatureName(featureName);
    setIsPassRequiredModalOpen(true);
    return false;
  };

  const closePassRequiredModal = () => {
    setIsPassRequiredModalOpen(false);
  };

  const openPassModal = () => {
    setIsPassRequiredModalOpen(false);
    if (onOpenPassModal) {
      onOpenPassModal();
    }
  };

  return (
    <PassContext.Provider
      value={{
        hasPass,
        passInfo,
        activatePass,
        deactivatePass,
        requestFeature,
        isPassRequiredModalOpen,
        lockedFeatureName,
        closePassRequiredModal,
        openPassModal,
      }}
    >
      {children}
    </PassContext.Provider>
  );
};

export const usePass = () => {
  const context = useContext(PassContext);
  if (!context) {
    throw new Error('usePass must be used within a PassProvider');
  }
  return context;
};
