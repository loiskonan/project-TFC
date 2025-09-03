import React from 'react';
import { BarChart3, TrendingUp, Download, Upload, HardDrive } from 'lucide-react';
import StatsCard from '../Dashboard/StatsCard';

const UserReports: React.FC = () => {
  // Données simulées pour les rapports utilisateur
  const userStats = {
    totalFiles: 12,
    totalSize: '45.2 MB',
    totalDownloads: 156,
    totalUploads: 12,
    storageUsed: '45.2 MB / 1 GB'
  };

  const monthlyData = [
    { month: 'Jan', uploads: 2, downloads: 15 },
    { month: 'Fév', uploads: 4, downloads: 23 },
    { month: 'Mar', uploads: 1, downloads: 18 },
    { month: 'Avr', uploads: 3, downloads: 32 },
    { month: 'Mai', uploads: 2, downloads: 28 },
    { month: 'Juin', uploads: 0, downloads: 40 }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Mes statistiques</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total des fichiers"
            value={userStats.totalFiles}
            icon={BarChart3}
            color="blue"
            trend={{ value: 15, isPositive: true }}
          />
          <StatsCard
            title="Téléchargements"
            value={userStats.totalDownloads}
            icon={Download}
            color="green"
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Uploads"
            value={userStats.totalUploads}
            icon={Upload}
            color="orange"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Stockage utilisé"
            value={userStats.storageUsed}
            icon={HardDrive}
            color="purple"
          />
        </div>

        <div className="bg-gray-50 p-6 rounded-xl">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Activité mensuelle
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {monthlyData.map((data, index) => (
              <div key={index} className="bg-white p-4 rounded-lg text-center">
                <p className="text-sm font-medium text-gray-600 mb-2">{data.month}</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-green-600">{data.uploads}</p>
                  <p className="text-xs text-gray-500">uploads</p>
                  <p className="text-lg font-bold text-blue-600">{data.downloads}</p>
                  <p className="text-xs text-gray-500">downloads</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserReports;