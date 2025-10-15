import React from 'react';
import { FileText, Download, Upload, TrendingUp, Activity, Building2, AlertCircle, Send, Inbox } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useFilesStats } from '../../hooks/useFilesStats';
import StatsCard from './StatsCard';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { stats: sendStats, loading: sendLoading, error: sendError } = useDashboardStats();
  const { stats: receiveStats, loading: receiveLoading, error: receiveError } = useFilesStats();
  const isAdmin = currentUser?.role === 'admin';
  const isNsiaVie = currentUser?.role === 'nsia_vie';

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈';
    return '📁';
  };

  const handleDownload = async (fileId: number, fileName: string) => {
    try {
      const token = localStorage.getItem('dataflow_token');
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}:5000/api/files/download/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      // Créer un blob à partir de la réponse
      const blob = await response.blob();
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Rafraîchir les statistiques pour mettre à jour le compteur
      if (receiveStats) {
        // Recharger les données
        window.location.reload();
      }
    } catch (error) {
      alert('Erreur lors du téléchargement du fichier');
    }
  };

  const loading = sendLoading || receiveLoading;
  const error = sendError || receiveError;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 text-red-600">
            <AlertCircle className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          </div>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête principal */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {isAdmin ? 'Vue d\'ensemble - Administration' : 
           isNsiaVie ? 'Vue d\'ensemble - NSIA Vie' : 
           `Mon tableau de bord - ${currentUser?.banque || 'Ma banque'}`}
        </h3>
      </div>

      {/* Section des Envois */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Send className="h-6 w-6 mr-3 text-blue-600" />
          {isAdmin || isNsiaVie ? 'Section des Envois' : 'Mes Envois'}
        </h4>
        
        {sendStats ? (
          <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
                title={isAdmin ? "Fichiers envoyés (30j)" : isNsiaVie ? "Fichiers NSIA envoyés (30j)" : "Mes fichiers envoyés (30j)"}
                value={sendStats.totalFiles}
            icon={FileText}
                color="white"
                trend={{ value: sendStats.recentUploads, isPositive: true }}
          />
          <StatsCard
                title="Téléchargements (30j)"
                value={sendStats.totalDownloads}
            icon={Download}
            color="green"
                trend={{ value: sendStats.filesByStatus?.downloaded || 0, isPositive: true }}
              />
              <StatsCard
                title="Envois récents (7j)"
                value={sendStats.recentUploads}
                icon={Upload}
                color="orange"
                trend={{ value: sendStats.filesByStatus?.sent || 0, isPositive: true }}
              />
              <StatsCard
                title={isAdmin ? "Stockage envoyé (30j)" : isNsiaVie ? "Stockage NSIA envoyé (30j)" : "Mon stockage envoyé (30j)"}
                value={formatFileSize(sendStats.totalSize)}
                icon={Activity}
                color="purple"
                trend={{ value: sendStats.filesByStatus?.sent || 0, isPositive: true }}
              />
            </div>

            {/* Statistiques par statut pour admin/nsia_vie */}
            {(isAdmin || isNsiaVie) && (
              <div className="mb-8">
                <h5 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Répartition par statut des envois
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{sendStats.totalFiles}</div>
                    <div className="text-sm text-blue-800">Total envoyés (30j)</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{sendStats.filesByStatus?.downloaded || 0}</div>
                    <div className="text-sm text-purple-800">Téléchargés (30j)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Répartition par banque pour admin/nsia_vie */}
            {(isAdmin || isNsiaVie) && sendStats.filesByBank && (
              <div className="mb-8">
                <h5 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-green-600" />
                  Répartition par banque destinataire
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(sendStats.filesByBank).map(([bank, count], index) => {
                    // Génération dynamique de couleurs pour supporter un nombre illimité de banques
                    const colorSchemes = [
                      { border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-800' },
                      { border: 'border-green-300', bg: 'bg-green-50', text: 'text-green-800' },
                      { border: 'border-purple-300', bg: 'bg-purple-50', text: 'text-purple-800' },
                      { border: 'border-orange-300', bg: 'bg-orange-50', text: 'text-orange-800' },
                      { border: 'border-pink-300', bg: 'bg-pink-50', text: 'text-pink-800' },
                      { border: 'border-indigo-300', bg: 'bg-indigo-50', text: 'text-indigo-800' },
                      { border: 'border-red-300', bg: 'bg-red-50', text: 'text-red-800' },
                      { border: 'border-yellow-300', bg: 'bg-yellow-50', text: 'text-yellow-800' },
                      { border: 'border-teal-300', bg: 'bg-teal-50', text: 'text-teal-800' },
                      { border: 'border-cyan-300', bg: 'bg-cyan-50', text: 'text-cyan-800' },
                      { border: 'border-lime-300', bg: 'bg-lime-50', text: 'text-lime-800' },
                      { border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-800' },
                      { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-800' },
                      { border: 'border-violet-300', bg: 'bg-violet-50', text: 'text-violet-800' },
                      { border: 'border-fuchsia-300', bg: 'bg-fuchsia-50', text: 'text-fuchsia-800' },
                      { border: 'border-rose-300', bg: 'bg-rose-50', text: 'text-rose-800' },
                      { border: 'border-sky-300', bg: 'bg-sky-50', text: 'text-sky-800' },
                      { border: 'border-stone-300', bg: 'bg-stone-50', text: 'text-stone-800' },
                      { border: 'border-slate-300', bg: 'bg-slate-50', text: 'text-slate-800' },
                      { border: 'border-zinc-300', bg: 'bg-zinc-50', text: 'text-zinc-800' }
                    ];
                    
                    const colorScheme = colorSchemes[index % colorSchemes.length];
                    const colorClass = `${colorScheme.border} ${colorScheme.text}`;
                    
                    return (
                      <div key={bank} className={`bg-white p-6 rounded-xl border-2 ${colorClass} shadow-sm hover:shadow-md transition-shadow duration-200`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-lg font-semibold truncate" title={bank}>{bank}</div>
                          <Building2 className="h-5 w-5 opacity-60 flex-shrink-0 ml-2" />
                        </div>
                        <div className="text-3xl font-bold mb-1">{count}</div>
                        <div className="text-sm opacity-75">fichiers envoyés</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Send className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Aucune donnée d'envoi disponible</p>
          </div>
        )}
      </div>

      {/* Section des Réceptions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Inbox className="h-6 w-6 mr-3 text-green-600" />
          {isAdmin || isNsiaVie ? 'Section des Réceptions' : 'Mes Réceptions'}
        </h4>
        
        {receiveStats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title={isAdmin ? "Fichiers reçus (30j)" : isNsiaVie ? "Fichiers NSIA reçus (30j)" : "Mes fichiers reçus (30j)"}
                value={receiveStats.totalFiles}
                icon={FileText}
                color="green"
                trend={{ value: receiveStats.recentUploads, isPositive: true }}
              />
              <StatsCard
                title="Téléchargements (30j)"
                value={receiveStats.totalDownloads}
                icon={Download}
                color="white-green"
                trend={{ value: receiveStats.totalDownloads, isPositive: true }}
          />
          <StatsCard
                title="Réceptions récentes (7j)"
                value={receiveStats.recentUploads}
            icon={Upload}
            color="orange"
                trend={{ value: receiveStats.recentUploads, isPositive: true }}
          />
          <StatsCard
                title={isAdmin ? "Stockage reçu (30j)" : isNsiaVie ? "Stockage NSIA reçu (30j)" : "Mon stockage reçu (30j)"}
                value={formatFileSize(receiveStats.totalSize)}
            icon={Activity}
            color="purple"
                trend={{ value: receiveStats.totalSize, isPositive: true }}
          />
        </div>

            {/* Répartition par banque pour admin/nsia_vie */}
            {(isAdmin || isNsiaVie) && receiveStats.filesByBank && (
              <div className="mb-8">
                <h5 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-green-600" />
                  Répartition par banque expéditrice
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(receiveStats.filesByBank).map(([bank, count], index) => {
                    // Génération dynamique de couleurs pour supporter un nombre illimité de banques
                    const colorSchemes = [
                      { border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-800' },
                      { border: 'border-teal-300', bg: 'bg-teal-50', text: 'text-teal-800' },
                      { border: 'border-cyan-300', bg: 'bg-cyan-50', text: 'text-cyan-800' },
                      { border: 'border-lime-300', bg: 'bg-lime-50', text: 'text-lime-800' },
                      { border: 'border-yellow-300', bg: 'bg-yellow-50', text: 'text-yellow-800' },
                      { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-800' },
                      { border: 'border-green-300', bg: 'bg-green-50', text: 'text-green-800' },
                      { border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-800' },
                      { border: 'border-indigo-300', bg: 'bg-indigo-50', text: 'text-indigo-800' },
                      { border: 'border-purple-300', bg: 'bg-purple-50', text: 'text-purple-800' },
                      { border: 'border-pink-300', bg: 'bg-pink-50', text: 'text-pink-800' },
                      { border: 'border-rose-300', bg: 'bg-rose-50', text: 'text-rose-800' },
                      { border: 'border-orange-300', bg: 'bg-orange-50', text: 'text-orange-800' },
                      { border: 'border-red-300', bg: 'bg-red-50', text: 'text-red-800' },
                      { border: 'border-violet-300', bg: 'bg-violet-50', text: 'text-violet-800' },
                      { border: 'border-fuchsia-300', bg: 'bg-fuchsia-50', text: 'text-fuchsia-800' },
                      { border: 'border-sky-300', bg: 'bg-sky-50', text: 'text-sky-800' },
                      { border: 'border-stone-300', bg: 'bg-stone-50', text: 'text-stone-800' },
                      { border: 'border-slate-300', bg: 'bg-slate-50', text: 'text-slate-800' },
                      { border: 'border-zinc-300', bg: 'bg-zinc-50', text: 'text-zinc-800' }
                    ];
                    
                    const colorScheme = colorSchemes[index % colorSchemes.length];
                    const colorClass = `${colorScheme.border} ${colorScheme.text}`;
                    
                    return (
                      <div key={bank} className={`bg-white p-6 rounded-xl border-2 ${colorClass} shadow-sm hover:shadow-md transition-shadow duration-200`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-lg font-semibold truncate" title={bank}>{bank}</div>
                          <Building2 className="h-5 w-5 opacity-60 flex-shrink-0 ml-2" />
                        </div>
                        <div className="text-3xl font-bold mb-1">{count}</div>
                        <div className="text-sm opacity-75">fichiers reçus</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fichiers récents reçus */}
          <div className="bg-gray-50 p-6 rounded-xl">
              <h5 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Fichiers récents reçus
              </h5>
            <div className="space-y-3">
                {receiveStats.recentFiles && receiveStats.recentFiles.length > 0 ? (
                  receiveStats.recentFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-3">
                        <span className="text-xl">{getFileIcon(file.file_type)}</span>
                    <div>
                          <p className="font-medium text-gray-900">{file.original_name}</p>
                      <p className="text-sm text-gray-500">
                            {formatFileSize(file.file_size)} • {file.download_count} téléchargements
                            {(isAdmin || isNsiaVie) && ` • ${file.deposant_banque}`}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDownload(file.id, file.original_name)}
                    className="p-2 text-primary-blue hover:bg-primary-blue-lighter rounded-lg transition-colors"
                    title="Télécharger le fichier"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Aucun fichier récent reçu</p>
                  </div>
                )}
                </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Inbox className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Aucune donnée de réception disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;