"use client";

import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import { FaTrash, FaExclamationTriangle } from "react-icons/fa";
import { deleteTypeCourse } from "@/lib/commission_vtc_action";

type Props = {
    typeCourse: TypeCourseVTC;
    onClose: () => void;
    onSuccess: () => void;
};

export default function DeleteTypeCourseModal({ typeCourse, onClose, onSuccess }: Props) {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [forceDelete, setForceDelete] = useState<boolean>(false);

    const handleDelete = async () => {
        setIsSubmitting(true);
        const success = await deleteTypeCourse(typeCourse.id, forceDelete);
        setIsSubmitting(false);

        if (success) {
            onSuccess();
            onClose();
        }
    };

    const hasRules = (typeCourse.rules_count || 0) > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-600 to-rose-700 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                            <FaTrash className="text-xl" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Supprimer le Type de Course</h2>
                            <p className="text-xs text-red-100">Confirmation de suppression</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white transition-colors">
                        <MdClose className="text-2xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900 flex items-start gap-3">
                        <FaExclamationTriangle className="text-xl text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-red-800 dark:text-red-300">
                            Êtes-vous sûr de vouloir supprimer définitivement le type de course{" "}
                            <span className="font-bold">« {typeCourse.name} »</span> (code:{" "}
                            <code className="font-mono font-bold">{typeCourse.code}</code>) ?
                        </div>
                    </div>

                    {hasRules && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-2">
                            <p className="font-bold">
                                Attention : {typeCourse.rules_count} règle(s) de tarification par wilaya utilisent ce type.
                            </p>
                            <label className="flex items-center gap-2 cursor-pointer pt-1 font-semibold text-red-700 dark:text-red-400">
                                <input
                                    type="checkbox"
                                    checked={forceDelete}
                                    onChange={(e) => setForceDelete(e.target.checked)}
                                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                                />
                                <span>Forcer la suppression malgré les règles associées</span>
                            </label>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isSubmitting || (hasRules && !forceDelete)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <FaTrash className="text-xs" />
                            <span>{isSubmitting ? "Suppression..." : "Confirmer la suppression"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
