"use client";

import React from "react";
import { useSidebarStore } from "@/lib/tools/store/sidebarStore";

export default function MainContentWrapper({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebarStore();

    return (
        <main
            className={`min-h-screen pt-16 sm:pt-20 transition-all duration-300 ${
                isCollapsed ? "md:ml-20" : "md:ml-80"
            }`}
        >
            <div className="p-4 sm:p-6 lg:p-8">
                {children}
            </div>
        </main>
    );
}
