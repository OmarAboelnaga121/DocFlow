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
  messages?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface RepoAnalysis {
  id: string;
  repoId: string;
  apis?: any;
  pages?: any;
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

