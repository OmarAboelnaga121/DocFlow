export type IngestionStatus =
  | "PENDING"
  | "CLONING"
  | "EMBEDDING"
  | "ANALYZING"
  | "COMPLETED"
  | "FAILED";

export interface RepoFile {
  id: string;
  repoId: string;
  path: string;
  language?: string | null;
  contentHash?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  role: "USER" | "AI";
  content: string;
  context?: any;
  createdAt: string;
}

export interface Chat {
  id: string;
  title?: string | null;
  userId: string;
  repoId: string;
  repo: Repo;
  messages?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiItem {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "ALL" | string;
  endpoint: string;
  description: string;
  file: string;
}

export interface PageItem {
  route: string;
  description: string;
  file: string;
}

export interface RepoAnalysis {
  id: string;
  repoId: string;
  apis?: ApiItem[];
  pages?: PageItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Repo {
  id: string;
  name: string;
  userId: string;
  url: string;
  branch: string;
  latestCommitHash?: string | null;
  status: IngestionStatus;
  createdAt: string;
  updatedAt: string;
  files?: RepoFile[];
  chats?: Chat[];
  analysis?: RepoAnalysis | null;
}

export interface CreateRepoData {
  url: string;
  name: string;
  branch?: string;
}

