"use client";

import React, { useState } from "react";
import { 
    MdClose, 
    MdPerson, 
    MdPhone, 
    MdEmail, 
    MdLocationOn, 
    MdLock, 
    MdStorefront, 
    MdCheckCircle,
    MdSecurity,
    MdBadge,
    MdCalendarToday,
    MdWorkspacePremium,
    MdAccountCircle
} from "react-icons/md";
import { FaBan, FaCheck, FaUserEdit } from "react-icons/fa";
import { TbLoader3 } from "react-icons/tb";
import { CentreAppelCompte, updateUserCentreAppel } from "@/lib/call_action";
import { Wilaya } from "@/lib/tools/named";

interface EditUserModalProps {
    account: CentreAppelCompte;
    onClose: () => void;
    onSaved: () => void;
}

export default function EditUserModal({ account, onClose, onSaved }: EditUserModalProps) {
    const [firstName, setFirstName] = useState<string>(account.first_name || "");
    const [lastName, setLastName] = useState<string>(account.last_name || "");
    const [dateDeNaissance, setDateDeNaissance] = useState<string>(account.date_de_naissance || "");
    const [typeAccount, setTypeAccount] = useState<string>(account.type_account || "classique");
    const [phone, setPhone] = useState<string>(account.phone || "");
    const [phone2, setPhone2] = useState<string>("");
    const [email, setEmail] = useState<string>(account.email || "");
    const [wilaya, setWilaya] = useState<string>(account.wilaya || "");
    const [isBlocked, setIsBlocked] = useState<boolean>(account.is_blocked || false);
    const [nomMagasin, setNomMagasin] = useState<string>(account.nom_magasin || "");
    const [rc, setRc] = useState<string>(account.rc || "");
    const [password, setPassword] = useState<string>("");
    const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    const isMagasin = account.account_type === "magasin" || account.role === "partener";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const success = await updateUserCentreAppel({
            user_id: account.id,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            date_de_naissance: dateDeNaissance.trim(),
            type_account: typeAccount,
            phone: phone.trim(),
            phone_2: phone2.trim(),
            email: email.trim(),
            wilaya: wilaya.trim(),
            is_blocked: isBlocked,
            nom_magasin: nomMagasin.trim(),
            rc: rc.trim(),
            ...(password.trim() ? { password: password.trim() } : {})
        });

        setSaving(false);
        if (success) {
            onSaved();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative border border-slate-100 dark:border-slate-800 flex flex-col max-h-[92vh]">
                {/* Close button */}
                <button
                    onClick={onClose}
                    type="button"
                    className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <MdClose className="text-2xl" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl shrink-0 shadow-sm border border-blue-100 dark:border-blue-900/40">
                        <FaUserEdit />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            Modifier l&apos;utilisateur #{account.id}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Édition des coordonnées, date de naissance, type de compte et wilaya
                        </p>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
                    
                    {/* User Profile Summary Card */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md">
                                {firstName?.[0] || account.username?.[0] || "U"}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">
                                    {firstName || ""} {lastName || ""}
                                </p>
                                <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                                    <span>@{account.username}</span>
                                    <span>•</span>
                                    <span className="font-semibold text-blue-600 dark:text-blue-400">{account.type_label}</span>
                                    <span>•</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                        typeAccount === "premium" 
                                            ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800" 
                                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                    }`}>
                                        {typeAccount}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Status badge toggle */}
                        <button
                            type="button"
                            onClick={() => setIsBlocked(!isBlocked)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                                isBlocked
                                    ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60"
                                    : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                            }`}
                        >
                            {isBlocked ? (
                                <>
                                    <FaBan className="text-red-500" />
                                    <span>Bloqué</span>
                                </>
                            ) : (
                                <>
                                    <MdCheckCircle className="text-emerald-500" />
                                    <span>Compte Actif</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* First Name & Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Prénom
                            </label>
                            <div className="relative">
                                <MdPerson className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Ex: Mohamed"
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Nom de famille
                            </label>
                            <div className="relative">
                                <MdPerson className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Ex: Benali"
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Username (Read-Only) */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Nom d&apos;utilisateur (@username)
                            </label>
                            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                                <MdLock className="text-xs text-amber-500" /> Non modifiable
                            </span>
                        </div>
                        <div className="relative">
                            <MdBadge className="absolute left-3.5 top-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={account.username || ""}
                                readOnly
                                disabled
                                className="w-full pl-10 pr-10 py-2.5 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-300 font-bold cursor-not-allowed select-none"
                            />
                            <MdLock className="absolute right-3.5 top-3.5 text-slate-400 text-sm" />
                        </div>
                    </div>

                    {/* Date de Naissance & Type de Compte */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Date de Naissance
                            </label>
                            <div className="relative">
                                <MdCalendarToday className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input
                                    type="date"
                                    value={dateDeNaissance}
                                    onChange={(e) => setDateDeNaissance(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Type de Compte
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTypeAccount("classique")}
                                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                                        typeAccount === "classique"
                                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                            : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                                    }`}
                                >
                                    <MdAccountCircle className="text-sm" /> Classique
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTypeAccount("premium")}
                                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                                        typeAccount === "premium"
                                            ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/25"
                                            : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                                    }`}
                                >
                                    <MdWorkspacePremium className="text-sm" /> Premium
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Phones */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Numéro de Téléphone (Principal)
                            </label>
                            <div className="relative">
                                <MdPhone className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Ex: 0550123456"
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Téléphone 2 (Optionnel)
                            </label>
                            <div className="relative">
                                <MdPhone className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input
                                    type="tel"
                                    value={phone2}
                                    onChange={(e) => setPhone2(e.target.value)}
                                    placeholder="Ex: 0660123456"
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email & Wilaya */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Adresse Email
                            </label>
                            <div className="relative">
                                <MdEmail className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Ex: client@example.com"
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Wilaya de Résidence
                            </label>
                            <div className="relative">
                                <MdLocationOn className="absolute left-3.5 top-3.5 text-slate-400" />
                                <select
                                    value={wilaya}
                                    onChange={(e) => setWilaya(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                >
                                    <option value="">Sélectionner une Wilaya</option>
                                    {Wilaya.map((w) => (
                                        <option key={w.code} value={w.name}>
                                            {String(w.code).padStart(2, "0")} - {w.name} ({w.ar_name})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Magasin/Partenaire Specific Info */}
                    {isMagasin && (
                        <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/40 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs uppercase tracking-wider">
                                <MdStorefront className="text-base" />
                                <span>Informations Magasin / Partenaire</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Nom du Magasin / Enseigne
                                    </label>
                                    <input
                                        type="text"
                                        value={nomMagasin}
                                        onChange={(e) => setNomMagasin(e.target.value)}
                                        placeholder="Ex: Pizzeria Napoli"
                                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Numéro Registre de Commerce (RC)
                                    </label>
                                    <input
                                        type="text"
                                        value={rc}
                                        onChange={(e) => setRc(e.target.value)}
                                        placeholder="Ex: 16/00-1234567B19"
                                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Password Reset Section */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                                <MdSecurity className="text-base text-amber-500" />
                                <span>Sécurité & Mot de passe</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPasswordInput(!showPasswordInput)}
                                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                {showPasswordInput ? "Annuler le changement" : "Changer le mot de passe"}
                            </button>
                        </div>

                        {showPasswordInput && (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nouveau mot de passe
                                </label>
                                <div className="relative">
                                    <MdLock className="absolute left-3.5 top-3.5 text-slate-400" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Entrez le nouveau mot de passe..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Laissez vide pour conserver le mot de passe existant de l&apos;utilisateur.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <TbLoader3 className="animate-spin text-lg" />
                                    <span>Enregistrement...</span>
                                </>
                            ) : (
                                <>
                                    <FaCheck className="text-xs" />
                                    <span>Enregistrer les modifications</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
