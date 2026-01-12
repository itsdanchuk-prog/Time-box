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
    history: {
        date: string;
        focusScore: number;
        deepBlocks: number;
        shallowBlocks: number;
    }[];
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
    saveSession: () => void;
    finalizedTimebox: { grid: Record<string, string>; tasks: Task[]; date: string } | null;
    finalizeTimebox: () => void;
}

const useStore = create<StoreState>((set) => ({
    tasks: [],
    history: [],
    stage: -2,

    saveSession: () =>
        set((state) => {
            // Calculate Stats
            const totalSlots = Object.keys(state.grid).length;
            const completedCount = state.completedSlots.length;
            const focusScore = totalSlots > 0 ? Math.round((completedCount / totalSlots) * 100) : 0;

            // Simple heuristic for Deep vs Shallow: Tasks > 30m are Deep
            let deepBlocks = 0;
            let shallowBlocks = 0;

            // We need to look at the tasks that were in the grid
            const scheduledTaskIds = new Set(Object.values(state.grid));
            state.tasks.forEach(t => {
                if (scheduledTaskIds.has(t.id)) {
                    // Count blocks for this task
                    const blocks = Math.ceil(t.duration / 15);
                    if (t.duration > 30) {
                        // Check if this specific task was completed? or just count 'planned' deep blocks?
                        // Prompt says "ratio of Deep vs. Shallow work from the history data."
                        // Let's count *completed* blocks of deep/shallow work.
                        // But we only track completed *slots* (time), not tasks.
                        // Approximate: If a slot belongs to a >30m task, it's a deep block.
                    }
                }
            });

            // Better approximation based on slots
            state.completedSlots.forEach(time => {
                const taskId = state.grid[time];
                const task = state.tasks.find(t => t.id === taskId);
                if (task) {
                    if (task.duration > 30) deepBlocks++;
                    else shallowBlocks++;
                }
            });

            const newEntry = {
                date: new Date().toISOString(), // In real app, format properly or store ISO
                focusScore,
                deepBlocks,
                shallowBlocks
            };

            return {
                history: [newEntry, ...state.history],
                stage: -2,
                tasks: [],
                grid: {},
                completedSlots: []
            };
        }),

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

    // Finalized Timebox
    finalizedTimebox: null,
    finalizeTimebox: () =>
        set((state) => ({
            finalizedTimebox: {
                grid: { ...state.grid },
                tasks: [...state.tasks],
                date: new Date().toISOString()
            },
            stage: -2 // Navigate to Home
        })),
}));

export default useStore;
