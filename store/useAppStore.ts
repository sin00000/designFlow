import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface ModalState {
  addReference: boolean;
  addProject: boolean;
  addTask: boolean;
  shareCommunity: boolean;
  convertPortfolio: boolean;
  quickAdd: boolean;
}

interface AppState {
  // User
  currentUser: Partial<User> | null;
  setCurrentUser: (user: Partial<User> | null) => void;

  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;

  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Modals
  modals: ModalState;
  openModal: (modal: keyof ModalState) => void;
  closeModal: (modal: keyof ModalState) => void;
  closeAllModals: () => void;

  // Selected items
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;

  selectedReferenceId: string | null;
  setSelectedReferenceId: (id: string | null) => void;

  // Filters
  communityFilter: string;
  setCommunityFilter: (filter: string) => void;

  referenceSearchQuery: string;
  setReferenceSearchQuery: (query: string) => void;

  referenceTagFilter: string[];
  setReferenceTagFilter: (tags: string[]) => void;

  // View preferences
  projectsView: 'kanban' | 'calendar';
  setProjectsView: (view: 'kanban' | 'calendar') => void;
}

const initialModals: ModalState = {
  addReference: false,
  addProject: false,
  addTask: false,
  shareCommunity: false,
  convertPortfolio: false,
  quickAdd: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // User
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),

      // Theme
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      // Navigation
      activeTab: 'home',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Modals
      modals: initialModals,
      openModal: (modal) =>
        set((state) => ({
          modals: { ...state.modals, [modal]: true },
        })),
      closeModal: (modal) =>
        set((state) => ({
          modals: { ...state.modals, [modal]: false },
        })),
      closeAllModals: () => set({ modals: initialModals }),

      // Selected items
      selectedProjectId: null,
      setSelectedProjectId: (id) => set({ selectedProjectId: id }),

      selectedReferenceId: null,
      setSelectedReferenceId: (id) => set({ selectedReferenceId: id }),

      // Filters
      communityFilter: 'All',
      setCommunityFilter: (filter) => set({ communityFilter: filter }),

      referenceSearchQuery: '',
      setReferenceSearchQuery: (query) => set({ referenceSearchQuery: query }),

      referenceTagFilter: [],
      setReferenceTagFilter: (tags) => set({ referenceTagFilter: tags }),

      // View preferences
      projectsView: 'kanban',
      setProjectsView: (view) => set({ projectsView: view }),
    }),
    {
      name: 'designflow-storage',
      partialize: (state) => ({
        theme: state.theme,
        projectsView: state.projectsView,
        activeTab: state.activeTab,
      }),
    }
  )
);

export default useAppStore;
