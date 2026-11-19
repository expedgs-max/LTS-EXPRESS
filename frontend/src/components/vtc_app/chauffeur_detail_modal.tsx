"use client";

import React, { useState } from "react";
import {
    FaTimes,
    FaCar,
    FaUser,
    FaPhoneAlt,
    FaEnvelope,
    FaMapMarkerAlt,
    FaStar,
    FaCheckCircle,
    FaBan,
    FaLockOpen,
    FaCalendarAlt,
    FaShieldAlt,
    FaIdCard,
    FaFileInvoiceDollar,
    FaRoute,
    FaSpinner,
    FaUserEdit
} from "react-icons/fa";
import { VtcChauffeur, toggleVtcChauffeurStatus } from "@/lib/chauffeur_action";
import toast from "react-hot-toast";

interface ChauffeurDetailModalProps {
    chauffeur: VtcChauffeur;
    onClose: () => void;
    onStatusChanged: () => void;
    onEdit?: (chauffeur: VtcChauffeur) => void;
}

export default function ChauffeurDetailModal({
    chauffeur,
    onClose,
    onStatusChanged,
    onEdit
}: ChauffeurDetailModalProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isBlocked, setIsBlocked] = useState(chauffeur.is_blocked);
    const [isActive, setIsActive] = useState(chauffeur.is_active);

    const handleToggleBlock = async () => {
        setIsUpdating(true);
        const action = isBlocked ? "unblock" : "block";
        const res = await toggleVtcChauffeurStatus(chauffeur.id, action);
        setIsUpdating(false);

        if (res.success) {
            setIsBlocked(!isBlocked);
            onStatusChanged();
        }
    };

    const handleToggleActive = async () => {
        setIsUpdating(true);
        const action = isActive ? "deactivate" : "activate";
        const res = await toggleVtcChauffeurStatus(chauffeur.id, action);
        setIsUpdating(false);

        if (res.success) {
            setIsActive(!isActive);
            onStatusChanged();
        }
    };

    const vehicule = chauffeur.vehicule;
    const documents = chauffeur.documents;
    const stats = chauffeur.stats;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-3xl lg:max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col text-slate-800 dark:text-slate-100 transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 relative border-b border-slate-700/80">
                    {/* Close Button top-right */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-20"
                        title="Fermer"
                    >
                        <FaTimes />
                    </button>

                    {/* Main Header Container with right padding to clear close button */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-12">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="relative shrink-0">
                                {chauffeur.image_url ? (
                                    <img
                                        src={chauffeur.image_url}
                                        alt={chauffeur.full_name || chauffeur.username}
                                        className="w-16 h-16 rounded-2xl object-cover shadow-lg ring-2 ring-amber-500/30"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-2 ring-amber-500/20">
                                        {chauffeur.full_name ? chauffeur.full_name.charAt(0).toUpperCase() : "C"}
                                    </div>
                                )}
                                {chauffeur.is_available && (
                                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" title="En ligne" />
                                )}
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h2 className="text-xl sm:text-2xl font-bold truncate">
                                        {chauffeur.full_name || chauffeur.username}
                                    </h2>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-400 font-semibold shrink-0">
                                        {vehicule?.type_vehicule || "Classique"}
                                    </span>
                                    {isBlocked ? (
                                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-semibold flex items-center gap-1 shrink-0">
                                            <FaBan className="text-[10px]" /> Bloqué
                                        </span>
                                    ) : chauffeur.is_available ? (
                                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> En Ligne
                                        </span>
                                    ) : (
                                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700/80 border border-slate-600 text-slate-300 font-medium shrink-0">
                                            Hors ligne
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                                    <span className="font-mono text-slate-300">@{chauffeur.username}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                                        <FaStar className="text-xs" /> {stats?.rating ?? 5.0} / 5
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <FaMapMarkerAlt className="text-xs text-slate-500" /> Wilaya: {chauffeur.wilaya || "Non spécifiée"}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Header Action Button */}
                        {onEdit && (
                            <button
                                onClick={() => onEdit(chauffeur)}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0 self-start sm:self-center"
                                title="Modifier le profil"
                            >
                                <FaUserEdit className="text-sm" />
                                <span>Modifier</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Performance Stats */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                            <FaRoute className="text-amber-500" /> Statistiques de course
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                                <span className="text-xs text-slate-500 dark:text-slate-400">Total Courses</span>
                                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{stats?.total_courses ?? 0}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                                <span className="text-xs text-slate-500 dark:text-slate-400">Complétées</span>
                                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats?.completed_courses ?? 0}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                                <span className="text-xs text-slate-500 dark:text-slate-400">Chiffre d&apos;Affaires</span>
                                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                    {(stats?.chiffre_affaires ?? 0).toLocaleString()} <span className="text-xs">DA</span>
                                </p>
                            </div>
                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                                <span className="text-xs text-slate-500 dark:text-slate-400">Commissions Dues</span>
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {(stats?.tax_a_payer ?? 0).toLocaleString()} <span className="text-xs">DA</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Details */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                            <FaCar className="text-amber-500" /> Détails du Véhicule VTC
                        </h3>
                        {vehicule ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-sm">
                                <div>
                                    <span className="text-xs text-slate-400">Marque & Modèle :</span>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                                        {vehicule.marque || "N/A"} {vehicule.modele || ""}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400">Matricule :</span>
                                    <p className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                                        {vehicule.matricule || "Non renseigné"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400">N° d&apos;assurance :</span>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                                        {vehicule.num_assurance || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400">Expiration Assurance :</span>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                                        {vehicule.date_expiration_assurance || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400">N° Scanner / Contrôle :</span>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                                        {vehicule.num_scanner || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400">Expiration Scanner :</span>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                                        {vehicule.date_expiration_scanner || "N/A"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                Aucun véhicule associé pour le moment.
                            </p>
                        )}
                    </div>

                    {/* Administrative & Contact info */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                            <FaIdCard className="text-amber-500" /> Contact & Documents
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-sm">
                            <div>
                                <span className="text-xs text-slate-400">Téléphone :</span>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                    <a href={`tel:${chauffeur.phone_number_1}`} className="text-blue-500 hover:underline">
                                        {chauffeur.phone_number_1 || "N/A"}
                                    </a>
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400">Email :</span>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">{chauffeur.email || "N/A"}</p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400">N° Carte CCP / Bancaire :</span>
                                <p className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                                    {documents?.card_number || "Non renseigné"}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400">Numéro Décision / Acte :</span>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                    {documents?.numero_act || "Non renseigné"}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400">Registre du Commerce (RC) :</span>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                    {documents?.RC || "Non renseigné"}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400">NIF :</span>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                    {documents?.Nif || "Non renseigné"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Quick Actions - Single Line */}
                <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto flex-nowrap scrollbar-thin">
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleToggleBlock}
                            disabled={isUpdating}
                            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0 ${
                                isBlocked
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "bg-red-600 hover:bg-red-700 text-white"
                            }`}
                        >
                            {isUpdating ? (
                                <FaSpinner className="animate-spin" />
                            ) : isBlocked ? (
                                <>
                                    <FaLockOpen /> Débloquer <span className="hidden md:inline">le Chauffeur</span>
                                </>
                            ) : (
                                <>
                                    <FaBan /> Bloquer <span className="hidden md:inline">le Chauffeur</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleToggleActive}
                            disabled={isUpdating}
                            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all border shrink-0 ${
                                isActive
                                    ? "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                                    : "bg-blue-600 hover:bg-blue-700 text-white border-transparent"
                            }`}
                        >
                            {isActive ? (
                                <>
                                    Désactiver <span className="hidden md:inline">le compte</span>
                                </>
                            ) : (
                                <>
                                    Activer <span className="hidden md:inline">le compte</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {onEdit && (
                            <button
                                type="button"
                                onClick={() => onEdit(chauffeur)}
                                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                            >
                                <FaUserEdit /> Modifier <span className="hidden md:inline">le profil</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors shrink-0"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
