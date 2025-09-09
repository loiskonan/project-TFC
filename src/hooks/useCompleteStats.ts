import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface CompleteStats {
  totalFiles: number;
  totalDownloads: number;
  totalSize: number;
  recentUploads: number;
  filesByStatus: {
    sent: number;
    delivered: number;
    read: number;
    downloaded: number;
  };
  filesByBank?: { [key: string]: number };
  recentFiles: Array<{
    id: number;
    originalName: string;
    fileSize: number;
    fileType: string;
    deposantNom: string;
    banqueDestinataire: string;
    created_at: string;
    downloadCount: number;
  }>;
}

export const useCompleteStats = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<CompleteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchStats = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('dataflow_token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      let endpoint = '';
      
      // Déterminer l'endpoint selon le rôle
      if (currentUser.role === 'admin' || currentUser.role === 'nsia_vie') {
        endpoint = 'http://localhost:5000/api/file-send/stats-complete';
      } else {
        endpoint = 'http://localhost:5000/api/file-send/stats-user-complete';
      }

      const response = await axios.get(endpoint, { headers });

      if (response.data.success) {
        // S'assurer que les données ont la structure attendue
        const data = response.data.data;
        setStats({
          totalFiles: data.totalFiles || 0,
          totalDownloads: data.totalDownloads || 0,
          totalSize: data.totalSize || 0,
          recentUploads: data.recentUploads || 0,
          filesByStatus: data.filesByStatus || {
            sent: 0,
            delivered: 0,
            read: 0,
            downloaded: 0
          },
          filesByBank: data.filesByBank || {},
          recentFiles: data.recentFiles || []
        });
      } else {
        setError('Erreur lors du chargement des statistiques complètes');
      }
    } catch (error: any) {
      setError('Erreur lors du chargement des statistiques complètes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentUser]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};
