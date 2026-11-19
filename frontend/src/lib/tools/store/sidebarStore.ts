import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SidebarState = {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    setIsCollapsed: (collapsed: boolean) => void;
};

export const useSidebarStore = create<SidebarState>()(
    persist(
        (set) => ({
            isCollapsed: false,
            toggleSidebar: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
            setIsCollapsed: (isCollapsed: boolean) => set({ isCollapsed }),
        }),
        {
            name: "ltc_sidebar_collapsed",
            storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : {
                getItem: () => null,
                setItem: () => {},
                removeItem: () => {}
            })),
        }
    )
);
