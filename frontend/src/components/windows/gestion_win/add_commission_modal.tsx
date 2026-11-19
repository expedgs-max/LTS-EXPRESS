"use client";

import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import { FaCar, FaMapMarkerAlt, FaMoneyBillWave, FaSave } from "react-icons/fa";
import { Wilaya } from "@/lib/tools/named";
import { createCommissionVTC } from "@/lib/commission_vtc_action";

type Props = {
    typeCourses?: TypeCourseVTC[];
    onClose: () => void;
    onSuccess: () => void;
};

const DEFAULT_COURSE_TYPES = [
    { value: "classique", label: "Classique" },
    { value: "confort", label: "Confort" },
    { value: "moto", label: "Moto" },
    { value: "famille", label: "Famille / 7 places" },
    { value: "livraison", label: "Livraison VTC" },
];

export default function AddCommissionModal({ typeCourses, onClose, onSuccess }: Props) {
    const courseOptions = typeCourses && typeCourses.length > 0
        ? typeCourses.filter((t) => t.is_active !== false).map((t) => ({ value: t.code, label: t.name }))
        : DEFAULT_COURSE_TYPES;

    const [selectedWilayaCode, setSelectedWilayaCode] = useState<number | "">("");
    const [wilayaName, setWilayaName] = useState<string>("");
    const [typeCourse, setTypeCourse] = useState<string>(courseOptions[0]?.value || "classique");
    const [prixDepart, setPrixDepart] = useState<string>("100");
    const [prixKm, setPrixKm] = useState<string>("12");
    const [prixKmLong, setPrixKmLong] = useState<string>("22");
    const [prixSecond, setPrixSecond] = useState<string>("0.18");
    const [prixNuitSecond, setPrixNuitSecond] = useState<string>("0.11");
    const [description, setDescription] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleWilayaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (!val) {
            setSelectedWilayaCode("");
            setWilayaName("");
            return;
        }
        const codeNum = parseInt(val, 10);
        setSelectedWilayaCode(codeNum);
        const found = Wilaya.find((w) => w.code === codeNum);
        if (found) {
            setWilayaName(found.name);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!wilayaName) {
            alert("Veuillez sélectionner une wilaya.");
            return;
        }

        setIsSubmitting(true);
        const success = await createCommissionVTC({
            wilaya: wilayaName,
            code_wilaya: selectedWilayaCode ? Number(selectedWilayaCode) : null,
            type_course: typeCourse,
            prix_depart: parseFloat(prixDepart) || 0,
            prix_km: parseFloat(prixKm) || 0,
            prix_km_long: parseFloat(prixKmLong) || 0,
            prix_second: parseFloat(prixSecond) || 0,
            prix_nuit_second: parseFloat(prixNuitSecond) || 0,
            description: description.trim(),
        });

        setIsSubmitting(false);
        if (success) {
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden my-8">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                            <FaCar className="text-xl" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Ajouter une Commission / Tarif VTC</h2>
                            <p className="text-xs text-emerald-100">Définir les tarifs kilométriques et de départ par wilaya</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                        title="Fermer"
                    >
                        <MdClose className="text-2xl" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                    {/* Wilaya & Type Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <FaMapMarkerAlt className="text-emerald-500" /> Wilaya *
                            </label>
                            <select
                                value={selectedWilayaCode}
                                onChange={handleWilayaChange}
                                required
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-zinc-100"
                            >
                                <option value="">Sélectionner une wilaya...</option>
                                {Wilaya.map((w) => (
                                    <option key={w.code} value={w.code}>
                                        {w.code} - {w.name} ({w.ar_name})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <FaCar className="text-emerald-500" /> Type de course *
                            </label>
                            <select
                                value={typeCourse}
                                onChange={(e) => setTypeCourse(e.target.value)}
                                required
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-zinc-100"
                            >
                                {courseOptions.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Pricing Section */}
                    <div className="bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                            <FaMoneyBillWave className="text-emerald-500" /> Tarification de la course (en Dinar Algérien - DA)
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                                    Prix de départ (DA)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={prixDepart}
                                    onChange={(e) => setPrixDepart(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-zinc-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                                    Prix / km ville (DA)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={prixKm}
                                    onChange={(e) => setPrixKm(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-zinc-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                                    Prix / km long (DA)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={prixKmLong}
                                    onChange={(e) => setPrixKmLong(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-zinc-100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-zinc-700">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                                    Prix / seconde jour (DA)
                                </label>
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={prixSecond}
                                    onChange={(e) => setPrixSecond(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-zinc-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                                    Prix / seconde nuit (DA)
                                </label>
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={prixNuitSecond}
                                    onChange={(e) => setPrixNuitSecond(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-zinc-100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                            Description / Notes (facultatif)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Tarification urbaine standard pour la wilaya de Tlemcen"
                            rows={2}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-zinc-100"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
                        >
                            <FaSave />
                            {isSubmitting ? "Enregistrement..." : "Enregistrer la commission"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
