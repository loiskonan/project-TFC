import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export interface UserFile {
  id: number;
  name: string;
  originalName: string;
  description: string;
  deposantNom: string;
  deposantEmail: string;
  deposantBanque: string;
  fileSize: number;
  fileType: string;
  downloadCount: number;
  uploadedAt: string;
  uploadedByName?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const useUserFiles = () => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banques, setBanques] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    searchTerm: '',
    fileType: 'all',
    banque: 'all'
  });

  const fetchUserFiles = async (page: number = 1) => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('dataflow_token');
      
      let endpoint = '';
      
      // Construire les paramètres de requête avec filtres
      const queryParams = new URLSearchParams({
        page: page.toString(),
        search: filters.searchTerm,
        fileType: filters.fileType
      });
      
      // Ajouter le filtre banque pour les admins/nsia_vie
      if (currentUser.role === 'admin' || currentUser.role === 'nsia_vie') {
        queryParams.append('banque', filters.banque);
      }
      
      // Choisir l'endpoint selon le rôle
      if (currentUser.role === 'user') {
        // Pour les utilisateurs : récupérer leurs propres fichiers
        endpoint = `http://localhost:5000/api/user-uploads/my-deposits?${queryParams.toString()}`;
      } else if (currentUser.role === 'admin' || currentUser.role === 'nsia_vie') {
        // Pour admin/nsia_vie : récupérer tous les fichiers
        endpoint = `http://localhost:5000/api/user-uploads/all-deposits?${queryParams.toString()}`;
      } else {
        setError('Rôle non reconnu');
        setIsLoading(false);
        return;
      }

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setFiles(response.data.deposits);
        setPagination(response.data.pagination);
      } else {
        setError(response.data.message || 'Erreur lors de la récupération des fichiers');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (fileId: number) => {
    try {
      const token = localStorage.getItem('dataflow_token');
      const response = await axios.get(`http://localhost:5000/api/files/download/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Récupérer le nom original du fichier depuis les headers
      const contentDisposition = response.headers['content-disposition'];
      let filename = `file-${fileId}`;
      
      if (contentDisposition) {
        // Essayer plusieurs formats de content-disposition
        let filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (!filenameMatch) {
          filenameMatch = contentDisposition.match(/filename=([^;]+)/);
        }
        if (!filenameMatch) {
          filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
        }
        
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }
      
      // Si on n'a pas trouvé le nom dans les headers, essayer de le récupérer depuis la liste des fichiers
      if (filename === `file-${fileId}`) {
        const file = files.find(f => f.id === fileId);
        if (file && file.originalName) {
          filename = file.originalName;
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Mettre à jour le compteur de téléchargements
      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { ...file, downloadCount: file.downloadCount + 1 }
          : file
      ));

    } catch (error: any) {
      alert('Erreur lors du téléchargement du fichier');
    }
  };

  const deleteFile = async (fileId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('dataflow_token');
      const response = await axios.delete(`http://localhost:5000/api/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Retirer le fichier de la liste
        setFiles(prev => prev.filter(file => file.id !== fileId));
      } else {
        alert('Erreur lors de la suppression du fichier');
      }
    } catch (error: any) {
      alert('Erreur lors de la suppression du fichier');
    }
  };

  // Charger les fichiers seulement au montage du composant
  useEffect(() => {
    if (currentUser) {
      fetchUserFiles();
      fetchBanques();
    }
  }, []); // Dépendances vides = chargement unique au montage

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const fetchBanques = async () => {
    try {
      const token = localStorage.getItem('dataflow_token');
      const response = await axios.get('http://localhost:5000/api/user-uploads/banques', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setBanques(response.data.banques);
      }
    } catch (error: any) {
    }
  };

  const applyFilters = () => {
    fetchUserFiles(1); // Retourner à la première page lors du filtrage
  };

  return {
    files,
    pagination,
    isLoading,
    error,
    filters,
    banques,
    updateFilters,
    applyFilters,
    downloadFile,
    deleteFile,
    refreshFiles: fetchUserFiles
  };
};
