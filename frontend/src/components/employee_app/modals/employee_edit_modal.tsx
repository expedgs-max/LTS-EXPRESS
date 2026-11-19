"use client";

import React, { useState } from "react";
import { MdClose, MdPerson, MdPhone, MdEmail, MdLocationOn, MdCake, MdSave } from "react-icons/md";
import { Wilaya } from "@/lib/tools/named";
import { updateEmployeeProfile } from "@/lib/employee_action";
import toast from "react-hot-toast";

interface EmployeeEditModalProps {
    employee: Users;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EmployeeEditModal({
    employee,
    isOpen,
    onClose,
    onSuccess,
}: EmployeeEditModalProps) {
    const [firstName, setFirstName] = useState(employee.first_name || "");
    const [lastName, setLastName] = useState(employee.last_name || "");
    const [username, setUsername] = useState(employee.username || "");
    const [email, setEmail] = useState(employee.email || "");
    const [phone1, setPhone1] = useState(employee.phone_number_1 ? employee.phone_number_1.replace(/^\+213/, "") : "");
    const [phone2, setPhone2] = useState(employee.phone_number_2 ? employee.phone_number_2.replace(/^\+213/, "") : "");
    const [wilaya, setWilaya] = useState(employee.wilaya || "");
    const [lieux, setLieux] = useState(employee.lieux || "");
    const [sexe, setSexe] = useState(employee.sexe || "homme");
    const [birthDate, setBirthDate] = useState(
        employee.date_de_naissance ? new Date(employee.date_de_naissance).toISOString().split("T")[0] : ""
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formattedPhone1 = phone1.trim() ? `+213${phone1.trim().replace(/^0+/, "")}` : "";
        const formattedPhone2 = phone2.trim() ? `+213${phone2.trim().replace(/^0+/, "")}` : "";

        // Trouver le code de la wilaya
        const wilayaObj = Wilaya.find((w) => w.name.toLowerCase() === wilaya.toLowerCase());
        const wilayaCode = wilayaObj ? wilayaObj.code : employee.wilaya_code;

        const success = await updateEmployeeProfile(employee.id, {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            username: username.trim(),
            email: email.trim() || undefined,
            phone_number_1: formattedPhone1,
            phone_number_2: formattedPhone2 || null,
            wilaya: wilaya || undefined,
            wilaya_code: wilayaCode,
            lieux: lieux.trim() || null,
            sexe,
            date_de_naissance: birthDate || null,
        });

        setIsSubmitting(false);
        if (success) {
            onSuccess();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#181a20] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold">
                            <MdPerson />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                                Modifier le Profil
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                                Employé : <span className="font-semibold text-slate-700 dark:text-zinc-200">{employee.first_name} {employee.last_name}</span> (@{employee.username})
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                    >
                        <MdClose className="text-xl" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    {/* Nom et Prénom */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                                Prénom
                            </label>
                            <div className="relative">
                                <MdPerson className="absolute left-3.5 top-3.5 text-slate-400 text-lg" />
                                <input
                                    type="text"
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Ex: Mohamed"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                                Nom
                            </label>
                            <div className="relative">
                                <MdPerson className="absolute left-3.5 top-3.5 text-slate-400 text-lg" />
                                <input
                                    type="text"
                                    required
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Ex: Benali"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Nom d'utilisateur & Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                                Nom d&apos;utilisateur (Username)
                            </label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="nom_utilisateur"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <MdEmail className="absolute left-3.5 top-3.5 text-slate-400 text-lg" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="agent@ltcexpress.dz"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Téléphones */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                                Téléphone 1 (Principal)
                            </label>
                            <div className="flex gap-2">
                                <span className="inline-flex items-center px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-bold">
                                    +213
                                </span>
                                <input
                                    type="text"
                                    required
                                    value={phone1}
                                    onChange={(e) => setPhone1(e.target.value)}
                                    placeholder="555123456"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                                Téléphone 2 (Optionnel)
                            </label>
                            <div className="flex gap-2">
                                <span className="inline-flex items-center px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-bold">
                                    +213
                                </span>
                                <input
                                    type="text"
                                    value={phone2}
                                    onChange={(e) => setPhone2(e.target.value)}
                                    placeholder="661234567"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Wilaya & Lieu de résidence */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                                Wilaya
                            </label>
                            <div className="relative">
                                <MdLocationOn className="absolute left-3.5 top-3.5 text-slate-400 text-lg" />
                                <select
                                    value={wilaya}
                                    onChange={(e) => setWilaya(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition-all"
                                >
                                    <option value="">Sélectionner la wilaya</option>
                                    {Wilaya.map((w) => (
                                        <option key={w.code} value={w.name}>
                                            {w.code} - {w.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                                Lieu de résidence / Commune
                            </label>
                            <input
                                type="text"
                                value={lieux}
                                onChange={(e) => setLieux(e.target.value)}
                                placeholder="Commune ou adresse"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition-all"
                            />
                        </div>
                    </div>

                    {/* Sexe & Date de naissance */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                                Sexe
                            </label>
                            <select
                                value={sexe}
                                onChange={(e) => setSexe(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition-all"
                            >
                                <option value="homme">Homme</option>
                                <option value="femme">Femme</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                                Date de Naissance
                            </label>
                            <div className="relative">
                                <MdCake className="absolute left-3.5 top-3.5 text-slate-400 text-lg" />
                                <input
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200/80 dark:border-zinc-800/80">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-semibold text-sm transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
                        >
                            <MdSave className="text-lg" />
                            {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
