import React, { useState } from 'react';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import loginBg from '../../assets/login.png';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Email ou mot de passe incorrect');
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage('');
    
    if (!resetEmail) {
      setResetMessage('Veuillez entrer votre adresse email');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (data.success) {
        setResetMessage('Un email de récupération a été envoyé à votre adresse email.');
      } else {
        setResetMessage(data.message || 'Erreur lors de l\'envoi de l\'email');
      }
    } catch (error) {
      setResetMessage('Erreur de connexion au serveur');
    }
  };



  return (
    <div className="min-h-screen flex">
      {/* Section gauche - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url(${loginBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Overlay pour améliorer la lisibilité du texte */}
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          
          {/* Contenu de la section image */}
          <div className="relative z-10 h-full flex flex-col justify-center items-center text-white p-12">
            <div className="text-center max-w-md">
              <div className="flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 backdrop-blur-sm rounded-full mx-auto mb-6 shadow-lg border border-white border-opacity-30">
                <LogIn className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4 drop-shadow-lg"><span style={{ color: 'rgb(225,225,225)' }}>Data</span>
              <span style={{ color: 'rgb(215, 153, 14)' }}>Flow</span></h1>
              <p className="text-xl text-white text-opacity-90 drop-shadow-md mb-6">
                Gestion de fichiers simplifiée et sécurisée
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: 'rgb(16,16,92)' }}>
                <LogIn className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold">
                <span style={{ color: 'rgb(16,16,92)' }}>Data</span>
                <span style={{ color: 'rgb(215, 153, 14)' }}>Flow</span>
              </h2>
            </div>
            <p className="text-gray-600">Connectez-vous à votre espace</p>
          </div>

          {/* Formulaire */}
          {!isForgotPassword ? (
            <form className="space-y-6 bg-white p-8 rounded-xl shadow-lg border border-gray-200" onSubmit={handleSubmit}>
              <div className="text-center ">
                <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ color: 'rgb(215, 153, 14)' }}>Connexion</h2>
                <p className="text-gray-600">Accédez à votre espace personnel</p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="votre.email@exemple.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Votre mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-primary-blue hover:text-primary-blue-hover transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-blue hover:bg-primary-blue-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Connexion...</span>
                  </div>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>
          ) : (
            <form className="space-y-6 bg-white p-8 rounded-xl shadow-lg border border-gray-200" onSubmit={handleResetPassword}>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ color: 'rgb(215, 153, 14)' }}>Mot de passe oublié</h2>
                <p className="text-gray-600">Entrez votre email pour recevoir un lien de récupération</p>
              </div>

              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="votre.email@exemple.com"
                />
              </div>

              {resetMessage && (
                <div className={`px-4 py-3 rounded-lg ${
                  resetMessage.includes('envoyé') 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {resetMessage}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetEmail('');
                    setResetMessage('');
                  }}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-blue hover:bg-primary-blue-hover transition-colors"
                >
                  Envoyer
                </button>
              </div>
            </form>
          )}



        </div>
      </div>
    </div>
  );
};

export default LoginForm;