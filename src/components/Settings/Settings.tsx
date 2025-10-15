import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Settings: React.FC = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [defaultPasswordMessage, setDefaultPasswordMessage] = useState('');
  const [defaultPasswordError, setDefaultPasswordError] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('');
  const [confirmDefaultPassword, setConfirmDefaultPassword] = useState('');
  const [showDefaultPassword, setShowDefaultPassword] = useState(false);
  const [showConfirmDefaultPassword, setShowConfirmDefaultPassword] = useState(false);
  const [isDefaultPasswordConfigured, setIsDefaultPasswordConfigured] = useState(false);

  // États pour le formulaire de changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // États pour la visibilité des mots de passe
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Charger le statut du mot de passe par défaut au montage du composant
  React.useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadDefaultPasswordStatus();
    }
  }, [currentUser?.role]);

  const loadDefaultPasswordStatus = async () => {
    try {
      const token = localStorage.getItem('dataflow_token');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}:5000/api/system/default-password`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setIsDefaultPasswordConfigured(response.data.isConfigured);
      }
    } catch (error) {
    }
  };

  const handleDefaultPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setDefaultPasswordMessage('');
    setDefaultPasswordError('');

    if (!defaultPassword || defaultPassword.length < 6) {
      setDefaultPasswordError('Le mot de passe par défaut doit contenir au moins 6 caractères');
      setIsLoading(false);
      return;
    }

    if (defaultPassword !== confirmDefaultPassword) {
      setDefaultPasswordError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('dataflow_token');
      await axios.put(`${import.meta.env.VITE_BASE_URL}:5000/api/system/default-password`, {
        newPassword: defaultPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setDefaultPasswordMessage('Mot de passe par défaut mis à jour avec succès');
      setDefaultPassword('');
      setConfirmDefaultPassword('');
      setShowDefaultPassword(false);
      setShowConfirmDefaultPassword(false);
    } catch (error: any) {
      setDefaultPasswordError(error.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe par défaut');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Tous les champs sont requis');
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('dataflow_token');
      await axios.post(`${import.meta.env.VITE_BASE_URL}:5000/api/auth/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setMessage('Mot de passe modifié avec succès');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Paramètres</h2>
        <p className="text-gray-600">Gérez vos paramètres de compte et votre profil</p>
      </div>

      {/* Section Profil */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-blue-lighter mr-4">
            <User className="h-6 w-6 text-primary-blue" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Profil</h3>
            <p className="text-gray-600">Informations de votre compte</p>
          </div>
        </div>

        {/* Informations du profil */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet
            </label>
            <input
              type="text"
              value={currentUser?.name || ''}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email
            </label>
            <input
              type="email"
              value={currentUser?.email || ''}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rôle
            </label>
            <input
              type="text"
              value={
                currentUser?.role === 'admin' 
                  ? 'Administrateur' 
                  : currentUser?.role === 'nsia_vie'
                  ? 'NSIA Vie'
                  : 'Utilisateur'
              }
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          {(currentUser?.role === 'user' || currentUser?.role === 'admin') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banque
              </label>
              <input
                type="text"
                value={(currentUser as any)?.banque || 'Non assignée'}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Section Changement de mot de passe */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mr-4">
            <Lock className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Changer le mot de passe</h3>
            <p className="text-gray-600">Mettez à jour votre mot de passe pour sécuriser votre compte</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mot de passe actuel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe actuel *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  required
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  placeholder="Votre mot de passe actuel"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  required
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  placeholder="Au moins 6 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirmation du nouveau mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le nouveau mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  placeholder="Confirmez le nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </div>
        </form>
      </div>

      {/* Section Configuration système (Admin seulement) */}
      {currentUser?.role === 'admin' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mr-4">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Configuration système</h3>
              <p className="text-gray-600">Gérez les paramètres globaux du système</p>
            </div>
          </div>

          <form onSubmit={handleDefaultPasswordSubmit} className="space-y-6">
            {defaultPasswordMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 text-sm">{defaultPasswordMessage}</p>
              </div>
            )}

            {defaultPasswordError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{defaultPasswordError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe par défaut *
                </label>
                <div className="relative">
                  <input
                    type={showDefaultPassword ? 'text' : 'password'}
                    value={defaultPassword}
                    onChange={(e) => setDefaultPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    placeholder="Entrez le nouveau mot de passe par défaut"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDefaultPassword(!showDefaultPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showDefaultPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe par défaut *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmDefaultPassword ? 'text' : 'password'}
                    value={confirmDefaultPassword}
                    onChange={(e) => setConfirmDefaultPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    placeholder="Confirmez le nouveau mot de passe par défaut"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmDefaultPassword(!showConfirmDefaultPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmDefaultPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Ce mot de passe sera utilisé pour tous les nouveaux utilisateurs créés
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Modification...' : 'Modifier le mot de passe par défaut'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Settings;

