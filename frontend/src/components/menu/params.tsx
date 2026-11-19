"use client";

import React from "react";
import { MdKeyboardArrowRight } from "react-icons/md";

type Props = {
    title: string;
    icon: React.ReactNode;
    onEvent: () => void;
    isCollapsed?: boolean;
    isActive?: boolean;
};

export function MenuParams({ title, icon, onEvent, isCollapsed, isActive }: Props) {
    if (isCollapsed) {
        return (
            <div
                onClick={onEvent}
                className={`group relative flex justify-center p-3 items-center rounded-2xl text-xl cursor-pointer transition-all my-0.5 ${
                    isActive
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30 scale-105"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
            >
                <div
                    className={`text-2xl transition-transform ${
                        isActive
                            ? "scale-110 text-white"
                            : "text-slate-600 dark:text-zinc-400 group-hover:scale-110 group-hover:text-slate-900 dark:group-hover:text-zinc-100"
                    }`}
                >
                    {icon}
                </div>
                {/* Floating Tooltip */}
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-slate-700/80">
                    {title}
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onEvent}
            className={`flex justify-between p-3 items-center font-bold rounded-2xl text-sm cursor-pointer transition-all my-0.5 ${
                isActive
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/25 translate-x-1"
                    : "text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-white"
            }`}
        >
            <h1 className="flex items-center gap-3 text-sm">
                <span
                    className={`text-xl shrink-0 transition-colors ${
                        isActive ? "text-white" : "text-slate-500 dark:text-zinc-400"
                    }`}
                >
                    {icon}
                </span>
                <span
                    className={`truncate ${
                        isActive ? "text-white font-bold" : "text-slate-700 dark:text-zinc-200 font-semibold"
                    }`}
                >
                    {title}
                </span>
            </h1>
            <MdKeyboardArrowRight
                className={`text-lg shrink-0 transition-transform ${
                    isActive ? "text-white translate-x-0.5" : "text-slate-400 dark:text-zinc-500"
                }`}
            />
        </div>
    );
}