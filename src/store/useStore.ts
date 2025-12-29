import { create } from 'zustand';

interface Task {
    id: string;
    title: string;
    selected: boolean;
    duration: number; // minutes
    description: string;
    location: string;
}

interface StoreState {
    tasks: Task[];
    stage: number;
    addTask: (title: string, duration: number, description: string, location: string) => void;
    removeTask: (id: string) => void;
    toggleTask: (id: string) => void;
    grid: Record<string, string>;
    assignTaskToGrid: (time: string, taskId: string) => void;
    removeTaskFromGrid: (time: string) => void;
    removeTaskInstance: (taskId: string) => void;
    updateTask: (id: string, title: string, duration: number, description: string, location: string) => void;
    completedSlots: string[];
    toggleSlotCompletion: (time: string) => void;
    resetGrid: () => void;
    setStage: (val: number) => void;
    resetTasks: () => void;
    language: 'en' | 'he';
    setLanguage: (lang: 'en' | 'he') => void;
}

const useStore = create<StoreState>((set) => ({
    tasks: [],
    stage: -1,

    addTask: (title, duration, description, location) =>
        set((state) => ({
            tasks: [
                ...state.tasks,
                {
                    id: Date.now().toString(),
                    title,
                    selected: false,
                    duration,
                    description,
                    location
                },
            ],
        })),

    removeTask: (id) =>
        set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
        })),

    toggleTask: (id) =>
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id ? { ...t, selected: !t.selected } : t
            ),
        })),

    // Grid Logic
    grid: {}, // time -> taskId
    assignTaskToGrid: (time, taskId) =>
        set((state) => ({
            grid: { ...state.grid, [time]: taskId },
        })),

    removeTaskFromGrid: (time) =>
        set((state) => {
            const newGrid = { ...state.grid };
            delete newGrid[time];
            return { grid: newGrid };
        }),

    removeTaskInstance: (taskId) =>
        set((state) => {
            const newGrid = { ...state.grid };
            Object.keys(newGrid).forEach(key => {
                if (newGrid[key] === taskId) {
                    delete newGrid[key];
                }
            });
            return { grid: newGrid };
        }),

    updateTask: (id, title, duration, description, location) =>
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id
                    ? { ...t, title, duration, description, location }
                    : t
            ),
        })),

    // Completion Logic
    completedSlots: [],
    toggleSlotCompletion: (time) =>
        set((state) => {
            const isCompleted = state.completedSlots.includes(time);
            return {
                completedSlots: isCompleted
                    ? state.completedSlots.filter((t) => t !== time)
                    : [...state.completedSlots, time],
            };
        }),

    resetGrid: () => set({ grid: {}, completedSlots: [], stage: 0 }),

    setStage: (val) => set({ stage: val }),

    resetTasks: () => set({ tasks: [], stage: 0 }),

    // Language
    language: 'en',
    setLanguage: (lang) => set({ language: lang }),
}));

export default useStore;
