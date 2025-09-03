import React, { useCallback, useState } from 'react';
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Image,
  FileVideo,
  FileAudio,
  Database,
  Archive,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// Liste des mois
const MONTHS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' }
];

const FileUpload: React.FC = () => {
  const { currentUser } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [uploadStatus, setUploadStatus] = useState<{[key: string]: 'uploading' | 'success' | 'error'}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setUploadQueue(prev => [...prev, ...files]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      setUploadQueue(prev => [...prev, ...files]);
    }
  };

  const removeFromQueue = (index: number) => {
    setUploadQueue(prev => {
      const newQueue = prev.filter((_, i) => i !== index);
      // Nettoyer le statut du fichier supprimé
      const removedFile = prev[index];
      if (removedFile) {
        const fileKey = `${removedFile.name}-${removedFile.size}`;
        setUploadStatus(prevStatus => {
          const newStatus = { ...prevStatus };
          delete newStatus[fileKey];
          return newStatus;
        });
      }
      return newQueue;
    });
  };

  const clearBatchDescription = () => {
    setSelectedMonth('');
    setSelectedYear(new Date().getFullYear().toString());
  };

  // Générer la description à partir du mois et de l'année
  const generateDescription = () => {
    if (!selectedMonth || !selectedYear) return '';
    const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label;
    return `${monthLabel} ${selectedYear}`;
  };

  const processUploads = async () => {
    setError('');
    setSuccess('');
    
    // Vérifier que le mois et l'année sont fournis
    if (!selectedMonth || !selectedYear) {
      setError('Le mois et l\'année sont obligatoires');
      return;
    }

    const description = generateDescription();

    setIsLoading(true);

    try {
      const token = localStorage.getItem('dataflow_token');
      const formData = new FormData();
      
      // Ajouter tous les fichiers
      uploadQueue.forEach(file => {
        formData.append('files', file);
      });
      
      // Ajouter la description
      formData.append('description', description);

      const response = await axios.post('http://localhost:5000/api/user-uploads/upload-multiple', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Marquer tous les fichiers comme succès
        uploadQueue.forEach(file => {
          const fileKey = `${file.name}-${file.size}`;
          setUploadStatus(prev => ({ ...prev, [fileKey]: 'success' }));
        });

        setSuccess(response.data.message);
        
        // Nettoyer la queue après 2 secondes
        setTimeout(() => {
          setUploadQueue([]);
          setUploadStatus({});
          clearBatchDescription();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erreur upload:', error);
      
      if (error.response?.data?.errors) {
        // Erreurs détaillées pour certains fichiers
        const errorMessage = `Échec de l'upload:\n${error.response.data.errors.map((e: any) => `- ${e.fileName}: ${e.error}`).join('\n')}`;
        setError(errorMessage);
        
        // Marquer les fichiers en erreur
        if (error.response.data.failedFiles) {
          uploadQueue.forEach(file => {
            const fileKey = `${file.name}-${file.size}`;
            if (error.response.data.failedFiles.includes(file.name)) {
              setUploadStatus(prev => ({ ...prev, [fileKey]: 'error' }));
            }
          });
        }
      } else {
        // Erreur générale
        setError(error.response?.data?.message || 'Erreur lors de l\'upload');
        
        // Marquer tous les fichiers en erreur
        uploadQueue.forEach(file => {
          const fileKey = `${file.name}-${file.size}`;
          setUploadStatus(prev => ({ ...prev, [fileKey]: 'error' }));
        });
      }
    }

    setIsLoading(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Si l'utilisateur n'est pas un "user", afficher "Dépôt" suivi du rôle
  if (currentUser?.role !== 'user') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-center font-bold text-3xl mb-4">
            <span style={{ color: 'rgb(16,16,92)' }}>Dépôt</span> <span style={{ color: 'rgb(215, 153, 14)' }}>
              {currentUser?.role === 'admin' ? 'Administrateur' : 
               currentUser?.role === 'nsia_vie' ? 'NSIA Vie' : 
               currentUser?.role}
            </span>
          </h1>
        </div>
      </div>
    );
  }

  // Interface d'upload pour les utilisateurs
  return (
    <div className="space-y-6">
      {/* Titre conditionnel */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-center font-bold text-3xl mb-4">
          {currentUser?.banque ? (
            <>
              <span style={{ color: 'rgb(16,16,92)' }}>Dépôt</span> <span style={{ color: 'rgb(215, 153, 14)' }}>{currentUser.banque}</span>
            </>
          ) : (
            'Affichage non utilisateur'
          )}
        </h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload de fichiers</h3>
        
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
            dragActive
              ? 'border-primary-blue bg-primary-blue-lighter'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className={`h-12 w-12 mx-auto mb-4 ${
            dragActive ? 'text-blue-500' : 'text-gray-400'
          }`} />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Glissez-déposez vos fichiers ici
          </p>
          <p className="text-gray-500 mb-2">
            ou cliquez pour sélectionner des fichiers
          </p>
          <p className="text-sm text-gray-400 mb-2">
            Taille maximale par fichier : <span className="font-medium">50 MB</span>
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Types autorisés : PDF, Word, Excel, PowerPoint, Images, Archives, Médias
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover transition-colors cursor-pointer"
          >
            <Upload className="h-4 w-4 mr-2" />
            Sélectionner des fichiers
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {uploadQueue.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              Fichiers en attente ({uploadQueue.length})
            </h4>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setUploadQueue([]);
                  setUploadStatus({});
                }}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                title="Effacer tous les fichiers"
              >
                Effacer tout
              </button>
              <button
                onClick={processUploads}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Upload en cours...' : 'Uploader tous'}
              </button>
            </div>
          </div>

          {/* Sélection du mois et de l'année */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-3">Description du lot *</h5>
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Mois
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionnez un mois</option>
                  {MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Année
                </label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  placeholder="2024"
                  min="2000"
                  max="2100"
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={clearBatchDescription}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Effacer
                </button>
              </div>
            </div>
            {selectedMonth && selectedYear && (
              <div className="mt-3 p-2 bg-white rounded border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Description générée :</strong> {generateDescription()}
                </p>
              </div>
            )}
            
          </div>
          
          <div className="space-y-3">
            {uploadQueue.map((file, index) => {
              const fileKey = `${file.name}-${file.size}`;
              const status = uploadStatus[fileKey];
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      {status === 'uploading' && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      )}
                      {status === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      {!status && (
                        <div className="h-5 w-5 rounded-full bg-gray-300"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFromQueue(index)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Retirer le fichier"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;