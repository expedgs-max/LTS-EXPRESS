"use client";

import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import { FaTag, FaSave, FaInfoCircle, FaCar, FaCrown, FaMotorcycle, FaUsers, FaBox, FaTaxi } from "react-icons/fa";
import { createTypeCourse } from "@/lib/commission_vtc_action";

type Props = {
    onClose: () => void;
    onSuccess: () => void;
};

const AVAILABLE_ICONS = [
    { value: "FaCar", label: "Voiture Standard", icon: <FaCar /> },
    { value: "FaCrown", label: "Luxe / Confort", icon: <FaCrown /> },
    { value: "FaMotorcycle", label: "Deux-roues / Moto", icon: <FaMotorcycle /> },
    { value: "FaUsers", label: "Famille / Van", icon: <FaUsers /> },
    { value: "FaBox", label: "Livraison Colis", icon: <FaBox /> },
    { value: "FaTaxi", label: "Taxi Urbain", icon: <FaTaxi /> },
];

export default function AddTypeCourseModal({ onClose, onSuccess }: Props) {
    const [name, setName] = useState<string>("");
    const [code, setCode] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [icon, setIcon] = useState<string>("FaCar");
    const [isActive, setIsActive] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Auto-generate code slug from name if code hasn't been manually heavily edited
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setName(val);
        // Only auto-generate if user hasn't typed a custom slug
        const slug = val
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "");
        setCode(slug);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("Le nom du type de course est requis.");
            return;
        }

        const finalCode = code.trim().toLowerCase() || name.trim().toLowerCase().replace(/\s+/g, "_");

        setIsSubmitting(true);
        const success = await createTypeCourse({
            name: name.trim(),
            code: finalCode,
            description: description.trim() || undefined,
            icon: icon,
            is_active: isActive,
        });
        setIsSubmitting(false);

        if (success) {
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                            <FaTag className="text-xl" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Nouveau Type de Course VTC</h2>
                            <p className="text-xs text-emerald-100">Définir une catégorie de service pour les courses et tarifs</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white transition-colors">
                        <MdClose className="text-2xl" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Nom */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                            Nom du type de course *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            required
                            placeholder="Ex: Classique, Confort, Moto, VIP..."
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                        />
                    </div>

                    {/* Code / Slug */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                            Identifiant technique (Code unique) *
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                            required
                            placeholder="ex: classique, confort, moto, vip"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm font-mono text-slate-800 dark:text-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                            Ce code sert de clé de liaison avec les applications mobiles et les règles de tarification.
                        </p>
                    </div>

                    {/* Icône & Statut */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                                Icône représentative
                            </label>
                            <select
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                            >
                                {AVAILABLE_ICONS.map((ico) => (
                                    <option key={ico.value} value={ico.value}>
                                        {ico.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                                Statut de disponibilité
                            </label>
                            <div className="flex items-center gap-3 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-zinc-300">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                    />
                                    <span>Actif pour les réservations</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                            Description du service (facultatif)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Ex: Véhicule berline climatisé pour les trajets quotidiens jusqu'à 4 personnes..."
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                        >
                            <FaSave className="text-xs" />
                            <span>{isSubmitting ? "Enregistrement..." : "Créer le type"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
