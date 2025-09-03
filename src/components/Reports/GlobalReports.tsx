import React, { useState } from 'react';
import { BarChart3, Users, HardDrive, Activity, TrendingUp, Download } from 'lucide-react';
import StatsCard from '../Dashboard/StatsCard';

const GlobalReports: React.FC = () => {
  const [timeRange, setTimeRange] = useState('month');

  const globalStats = {
    totalUsers: 156,
    totalFiles: 2340,
    totalStorage: '12.4 GB',
    totalDownloads: 5680,
    activeUsers: 89,
    storageUsed: '12.4 GB / 100 GB'
  };

  const topUsers = [
    { name: 'Marie Dubois', files: 45, downloads: 234, storage: '2.1 GB' },
    { name: 'Pierre Martin', files: 38, downloads: 189, storage: '1.8 GB' },
    { name: 'Julie Bernard', files: 32, downloads: 156, storage: '1.5 GB' },
    { name: 'Lucas Moreau', files: 28, downloads: 134, storage: '1.2 GB' },
    { name: 'Sophie Leroy', files: 25, downloads: 98, storage: '0.9 GB' }
  ];

  const systemHealth = [
    { metric: 'Utilisation CPU', value: '45%', status: 'good' },
    { metric: 'Utilisation mémoire', value: '68%', status: 'warning' },
    { metric: 'Espace disque', value: '12%', status: 'good' },
    { metric: 'Bande passante', value: '234 MB/s', status: 'good' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Rapports globaux
          </h3>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Utilisateurs totaux"
            value={globalStats.totalUsers}
            icon={Users}
            color="blue"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Fichiers totaux"
            value={globalStats.totalFiles}
            icon={BarChart3}
            color="green"
            trend={{ value: 23, isPositive: true }}
          />
          <StatsCard
            title="Stockage total"
            value={globalStats.totalStorage}
            icon={HardDrive}
            color="purple"
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Téléchargements"
            value={globalStats.totalDownloads}
            icon={Download}
            color="orange"
            trend={{ value: 15, isPositive: true }}
          />
          <StatsCard
            title="Utilisateurs actifs"
            value={globalStats.activeUsers}
            icon={Activity}
            color="green"
            trend={{ value: 5, isPositive: true }}
          />
          <StatsCard
            title="Taux d'utilisation"
            value="12.4%"
            icon={TrendingUp}
            color="blue"
            trend={{ value: 2, isPositive: true }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-xl">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Top utilisateurs</h4>
            <div className="space-y-3">
              {topUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-blue-lighter rounded-full flex items-center justify-center">
                                              <span className="text-sm font-bold text-primary-blue">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.files} fichiers • {user.storage}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.downloads}</p>
                    <p className="text-xs text-gray-500">téléchargements</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl">
            <h4 className="text-md font-semibold text-gray-900 mb-4">État du système</h4>
            <div className="space-y-3">
              {systemHealth.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <p className="font-medium text-gray-700">{item.metric}</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalReports;