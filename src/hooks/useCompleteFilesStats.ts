import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface CompleteFilesStats {
  totalFiles: number;
  totalDownloads: number;
  totalSize: number;
  recentUploads: number;
  filesByBank?: { [key: string]: number };
  recentFiles: Array<{
    id: number;
    original_name: string;
    file_size: number;
    file_type: string;
    deposant_nom: string;
    deposant_banque: string;
    created_at: string;
    download_count: number;
  }>;
}

export const useCompleteFilesStats = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<CompleteFilesStats | null>(null);
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
        endpoint = `${import.meta.env.VITE_BASE_URL}:5000/api/user-uploads/stats-complete`;
      } else {
        endpoint = `${import.meta.env.VITE_BASE_URL}:5000/api/user-uploads/stats-user-complete`;
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
          filesByBank: data.filesByBank || {},
          recentFiles: data.recentFiles || []
        });
      } else {
        setError('Erreur lors du chargement des statistiques complètes de réception');
      }
    } catch (error: any) {
      setError('Erreur lors du chargement des statistiques complètes de réception');
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
