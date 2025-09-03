import { useState, useEffect } from 'react';
import { FileItem, Action } from '../types';

export const useFileManagement = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Données simulées
  useEffect(() => {
    const mockFiles: FileItem[] = [
      {
        id: '1',
        name: 'presentation.pdf',
        size: 2048000,
        type: 'application/pdf',
        uploadedAt: '2024-12-18T10:30:00Z',
        uploadedBy: 'user@example.com',
        downloadCount: 15,
        url: '#'
      },
      {
        id: '2',
        name: 'image.jpg',
        size: 1024000,
        type: 'image/jpeg',
        uploadedAt: '2024-12-19T14:20:00Z',
        uploadedBy: 'admin@example.com',
        downloadCount: 8,
        url: '#'
      },
      {
        id: '3',
        name: 'document.docx',
        size: 512000,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadedAt: '2024-12-20T09:15:00Z',
        uploadedBy: 'user@example.com',
        downloadCount: 3,
        url: '#'
      }
    ];

    const mockActions: Action[] = [
      {
        id: '1',
        type: 'upload',
        fileName: 'presentation.pdf',
        fileId: '1',
        userId: '2',
        userName: 'Regular User',
        timestamp: '2024-12-18T10:30:00Z'
      },
      {
        id: '2',
        type: 'download',
        fileName: 'presentation.pdf',
        fileId: '1',
        userId: '1',
        userName: 'Admin User',
        timestamp: '2024-12-18T11:15:00Z'
      },
      {
        id: '3',
        type: 'upload',
        fileName: 'image.jpg',
        fileId: '2',
        userId: '1',
        userName: 'Admin User',
        timestamp: '2024-12-19T14:20:00Z'
      }
    ];

    setFiles(mockFiles);
    setActions(mockActions);
  }, []);

  const uploadFile = async (file: File): Promise<void> => {
    setIsLoading(true);
    
    // Simulation d'upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newFile: FileItem = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'current-user@example.com',
      downloadCount: 0,
      url: '#'
    };

    const newAction: Action = {
      id: Date.now().toString(),
      type: 'upload',
      fileName: file.name,
      fileId: newFile.id,
      userId: '1',
      userName: 'Current User',
      timestamp: new Date().toISOString()
    };

    setFiles(prev => [newFile, ...prev]);
    setActions(prev => [newAction, ...prev]);
    setIsLoading(false);
  };

  const downloadFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      const newAction: Action = {
        id: Date.now().toString(),
        type: 'download',
        fileName: file.name,
        fileId: file.id,
        userId: '1',
        userName: 'Current User',
        timestamp: new Date().toISOString()
      };

      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, downloadCount: f.downloadCount + 1 }
          : f
      ));
      setActions(prev => [newAction, ...prev]);
    }
  };

  const deleteFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      const newAction: Action = {
        id: Date.now().toString(),
        type: 'delete',
        fileName: file.name,
        fileId: file.id,
        userId: '1',
        userName: 'Current User',
        timestamp: new Date().toISOString()
      };

      setFiles(prev => prev.filter(f => f.id !== fileId));
      setActions(prev => [newAction, ...prev]);
    }
  };

  return {
    files,
    actions,
    isLoading,
    uploadFile,
    downloadFile,
    deleteFile
  };
};