import React from 'react';
import { FileText, Download, Upload, Users, TrendingUp, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFileManagement } from '../../hooks/useFileManagement';
import StatsCard from './StatsCard';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { files, actions } = useFileManagement();
  const isAdmin = currentUser?.role === 'admin';
  const isNsiaVie = currentUser?.role === 'nsia_vie';

  const userStats = {
    totalFiles: files.length,
    totalDownloads: files.reduce((sum, file) => sum + file.downloadCount, 0),
    recentUploads: actions.filter(a => a.type === 'upload').length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0)
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const recentFiles = files.slice(0, 5);
  const recentActions = actions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {isAdmin ? 'Vue d\'ensemble - Administration' : isNsiaVie ? 'Vue d\'ensemble - NSIA Vie' : 'Mon tableau de bord'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title={isAdmin ? "Fichiers système" : isNsiaVie ? "Fichiers NSIA" : "Mes fichiers"}
            value={userStats.totalFiles}
            icon={FileText}
            color="blue"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Téléchargements"
            value={userStats.totalDownloads}
            icon={Download}
            color="green"
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Uploads récents"
            value={userStats.recentUploads}
            icon={Upload}
            color="orange"
            trend={{ value: 15, isPositive: true }}
          />
          <StatsCard
            title={isAdmin ? "Stockage total" : isNsiaVie ? "Stockage NSIA" : "Mon stockage"}
            value={formatFileSize(userStats.totalSize)}
            icon={Activity}
            color="purple"
            trend={{ value: 5, isPositive: true }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-xl">
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Fichiers récents
            </h4>
            <div className="space-y-3">
              {recentFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">📄</span>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {file.downloadCount} téléchargements
                      </p>
                    </div>
                  </div>
                  <button className="p-2 text-primary-blue hover:bg-primary-blue-lighter rounded-lg transition-colors">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl">
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Activité récente
            </h4>
            <div className="space-y-3">
              {recentActions.map((action) => (
                <div key={action.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                  <div className={`p-2 rounded-full ${
                    action.type === 'upload' ? 'bg-green-100' :
                    action.type === 'download' ? 'bg-primary-blue-lighter' : 'bg-red-100'
                  }`}>
                    {action.type === 'upload' && <Upload className="h-4 w-4 text-green-600" />}
                    {action.type === 'download' && <Download className="h-4 w-4 text-primary-blue" />}
                    {action.type === 'delete' && <Activity className="h-4 w-4 text-red-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{action.fileName}</p>
                    <p className="text-sm text-gray-500">
                      {action.type === 'upload' ? 'Uploadé' : 
                       action.type === 'download' ? 'Téléchargé' : 'Supprimé'} 
                      par {action.userName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;