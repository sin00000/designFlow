export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  username: string | null;
  bio: string | null;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reference {
  id: string;
  userId: string;
  imageUrl: string;
  sourceUrl: string | null;
  title: string;
  tags: string[];
  notes: string | null;
  linkedProjectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  linkedProject?: Project | null;
  user?: User;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  deadline: Date | null;
  progress: number;
  status: ProjectStatus;
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date;
  references?: Reference[];
  tasks?: Task[];
  communityPosts?: CommunityPost[];
  portfolioItem?: Portfolio | null;
  workImages?: WorkImage[];
  user?: User;
  _count?: {
    references: number;
    tasks: number;
  };
}

export interface WorkImage {
  id: string;
  projectId: string;
  imageUrl: string;
  caption: string | null;
  createdAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityPost {
  id: string;
  userId: string;
  projectId: string | null;
  imageUrl: string;
  title: string;
  description: string | null;
  tags: string[];
  isAnonymous: boolean;
  averageRating: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  project?: Project | null;
  comments?: Comment[];
  ratings?: Rating[];
  _count?: {
    comments: number;
    ratings: number;
  };
}

export interface Rating {
  id: string;
  postId: string;
  userId: string;
  value: number;
  createdAt: Date;
  user?: User;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface Portfolio {
  id: string;
  userId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  tags: string[];
  isPublic: boolean;
  publicSlug: string | null;
  layout: string;
  coverColor: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  project?: Project | null;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form types
export interface CreateReferenceInput {
  imageUrl: string;
  sourceUrl?: string;
  title: string;
  tags?: string[];
  notes?: string;
  linkedProjectId?: string;
}

export interface UpdateReferenceInput {
  title?: string;
  tags?: string[];
  notes?: string;
  linkedProjectId?: string | null;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  deadline?: string;
  coverImage?: string;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  deadline?: string;
  progress?: number;
  status?: ProjectStatus;
  coverImage?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string | null;
}

export interface CreateCommunityPostInput {
  imageUrl: string;
  title: string;
  description?: string;
  tags?: string[];
  isAnonymous?: boolean;
  projectId?: string;
}

export interface CreatePortfolioInput {
  title: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
  isPublic?: boolean;
  layout?: string;
  coverColor?: string;
  projectId?: string;
}

export interface UpdatePortfolioInput {
  title?: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
  isPublic?: boolean;
  layout?: string;
  coverColor?: string;
}

// Dashboard stats
export interface DashboardStats {
  projectsCount: number;
  referencesCount: number;
  communityPostsCount: number;
  portfolioItemsCount: number;
}

export interface UpcomingDeadline {
  id: string;
  title: string;
  deadline: Date;
  progress: number;
  status: ProjectStatus;
}
