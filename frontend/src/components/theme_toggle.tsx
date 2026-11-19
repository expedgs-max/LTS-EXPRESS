"use client";

import React, { useEffect, useState } from "react";
import { MdDarkMode, MdLightMode } from "react-icons/md";

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState<boolean>(false);
    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        setMounted(true);
        // Check saved theme or system preference
        const savedTheme = localStorage.getItem("app_theme");
        if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            setIsDark(true);
            document.documentElement.classList.add("dark");
        } else {
            setIsDark(false);
            document.documentElement.classList.remove("dark");
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("app_theme", "light");
            setIsDark(false);
        } else {
            document.documentElement.classList.add("dark");
            localStorage.setItem("app_theme", "dark");
            setIsDark(true);
        }
    };

    if (!mounted) {
        return <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />;
    }

    return (
        <button
            onClick={toggleTheme}
            title={isDark ? "Passer en mode clair (Thème Jour)" : "Passer en mode sombre (Thème Nuit)"}
            className="group relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 bg-slate-100/80 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 shadow-sm transition-all duration-200 active:scale-95"
            aria-label="Changer de thème"
        >
            {isDark ? (
                <MdLightMode className="text-xl text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
                <MdDarkMode className="text-xl text-slate-700 dark:text-zinc-200 group-hover:-rotate-12 transition-transform duration-300" />
            )}

            {/* Floating Tooltip */}
            <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-900 dark:bg-zinc-800 text-[11px] font-semibold text-white rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-slate-700/80">
                {isDark ? "☀️ Mode Jour" : "🌙 Mode Nuit"}
            </span>
        </button>
    );
}
