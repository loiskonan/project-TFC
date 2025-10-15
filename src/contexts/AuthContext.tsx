import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  showDeactivatedModal: boolean;
  setShowDeactivatedModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);

  // Vérifier le token au chargement de l'app
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('dataflow_token');
      if (token) {
        try {
          const response = await fetch(`${import.meta.env.VITE_BASE_URL}:5000/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setCurrentUser(data.user);
            } else {
              localStorage.removeItem('dataflow_token');
            }
          } else if (response.status === 401) {
            // Token invalide ou expiré
            localStorage.removeItem('dataflow_token');
          } else {
            // Autre erreur HTTP, ne pas supprimer le token immédiatement
          }
        } catch (error) {
          // En cas d'erreur réseau, ne pas supprimer le token
          // L'utilisateur peut continuer à utiliser l'app
        }
      }
    };

    checkAuth();
  }, []);

  // Vérifier périodiquement le statut de l'utilisateur
  useEffect(() => {
    if (!currentUser) return;

    const checkUserStatus = async () => {
      const token = localStorage.getItem('dataflow_token');
      if (!token) return;

      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}:5000/api/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            
            // Vérifier en temps réel si le compte est inactif
            if (!data.user.isActive) {
              setShowDeactivatedModal(true);
            } else {
              // Mettre à jour l'utilisateur si le statut a changé
              setCurrentUser(data.user);
            }
          }
        } else if (response.status === 401) {
          // Token invalide, déconnecter l'utilisateur
          localStorage.removeItem('dataflow_token');
          setCurrentUser(null);
        }
      } catch (error) {
        // En cas d'erreur réseau, ne pas déconnecter automatiquement
        // L'utilisateur peut toujours utiliser l'app en mode hors ligne
      }
    };

    // Vérifier toutes les 30 secondes pour réduire la charge
    const interval = setInterval(checkUserStatus, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}:5000/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Stocker le token
        localStorage.setItem('dataflow_token', data.token);
        
        // Mettre à jour l'utilisateur
        setCurrentUser(data.user);
      } else {
        throw new Error(data.message || 'Erreur de connexion');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('dataflow_token');
    setCurrentUser(null);
  };

  const handleDeactivatedModalClose = () => {
    setShowDeactivatedModal(false);
    logout(); // Déconnecter l'utilisateur
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      login, 
      logout, 
      isLoading, 
      showDeactivatedModal, 
      setShowDeactivatedModal 
    }}>
      {children}
    </AuthContext.Provider>
  );
};