export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imagePath: string | null;
  categoryId: string;
  category: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type JobType = 'bulk_upload' | 'report';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface JobError {
  row?: number;
  message: string;
}

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  sourceFilePath: string | null;
  resultFilePath: string | null;
  totalRows: number | null;
  processedRows: number;
  successRows: number;
  failedRows: number;
  errors: JobError[];
  params: Record<string, unknown> | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}
