import React, { useState } from 'react';
import { Clock, Download, Upload, Trash2, Search, Calendar } from 'lucide-react';
import { useFileManagement } from '../../hooks/useFileManagement';

const ActionHistory: React.FC = () => {
  const { actions } = useFileManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const filteredActions = actions.filter(action => {
    const matchesSearch = action.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || action.type === filterType;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const actionDate = new Date(action.timestamp);
      const now = new Date();
      const diffTime = now.getTime() - actionDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today':
          matchesDate = diffDays <= 1;
          break;
        case 'week':
          matchesDate = diffDays <= 7;
          break;
        case 'month':
          matchesDate = diffDays <= 30;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'upload': return <Upload className="h-4 w-4 text-green-600" />;
      case 'download': return <Download className="h-4 w-4 text-blue-600" />;
      case 'delete': return <Trash2 className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'upload': return 'bg-green-100 text-green-800';
      case 'download': return 'bg-primary-blue-lighter text-primary-blue';
      case 'delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Historique des actions</h3>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher dans l'historique..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Toutes les actions</option>
            <option value="upload">Uploads</option>
            <option value="download">Téléchargements</option>
            <option value="delete">Suppressions</option>
          </select>
          
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredActions.map((action) => (
            <div key={action.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm">
                  {getActionIcon(action.type)}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{action.fileName}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(action.type)}`}>
                      {action.type === 'upload' ? 'Uploadé' : 
                       action.type === 'download' ? 'Téléchargé' : 'Supprimé'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    par {action.userName} • {formatDate(action.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredActions.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucune action trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionHistory;