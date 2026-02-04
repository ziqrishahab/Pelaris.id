import { create } from 'zustand';

interface FilterState {
  // Search & filters
  search: string;
  startDate: string;
  endDate: string;
  selectedChannel: string;
  selectedStatus: string;
  selectedBranch: string;
  
  // Actions
  setSearch: (search: string) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setSelectedChannel: (channelId: string) => void;
  setSelectedStatus: (status: string) => void;
  setSelectedBranch: (branchId: string) => void;
  resetFilters: () => void;
  
  // Helper to get filter params for API
  getFilterParams: () => Record<string, string | undefined>;
}

const initialState = {
  search: '',
  startDate: '',
  endDate: '',
  selectedChannel: '',
  selectedStatus: '',
  selectedBranch: '',
};

export const useFilterStore = create<FilterState>()((set, get) => ({
  ...initialState,
  
  setSearch: (search) => set({ search }),
  setStartDate: (startDate) => set({ startDate }),
  setEndDate: (endDate) => set({ endDate }),
  setSelectedChannel: (selectedChannel) => set({ selectedChannel }),
  setSelectedStatus: (selectedStatus) => set({ selectedStatus }),
  setSelectedBranch: (selectedBranch) => set({ selectedBranch }),
  
  resetFilters: () => set(initialState),
  
  getFilterParams: () => {
    const state = get();
    return {
      search: state.search || undefined,
      startDate: state.startDate || undefined,
      endDate: state.endDate || undefined,
      channelId: state.selectedChannel || undefined,
      status: state.selectedStatus || undefined,
      cabangId: state.selectedBranch || undefined,
    };
  },
}));

