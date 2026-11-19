import React from "react";
import { TbLoader3 } from "react-icons/tb";

export default function LoadingFirst() {
    return (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-xs flex justify-center items-center z-50 animate-in fade-in duration-150">
            <div className="px-6 py-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-3.5">
                <TbLoader3 className="animate-spin text-2xl text-red-600 dark:text-red-500" />
                <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Chargement...</span>
            </div>
        </div>
    );
}
