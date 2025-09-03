export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'nsia_vie';
  banque?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  downloadCount: number;
  url: string;
}

export interface Action {
  id: string;
  type: 'upload' | 'download' | 'delete';
  fileName: string;
  fileId: string;
  userId: string;
  userName: string;
  timestamp: string;
  details?: string;
}

export interface Report {
  totalFiles: number;
  totalSize: number;
  totalDownloads: number;
  totalUploads: number;
  activeUsers: number;
  storageUsed: string;
  popularFiles: FileItem[];
  recentActivity: Action[];
}

export interface UserReport extends Report {
  userId: string;
  userName: string;
}