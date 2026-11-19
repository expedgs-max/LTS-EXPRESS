"use client"

import Link from 'next/link'
import React, { useState, useEffect, useMemo } from 'react'
import { FaSearch, FaStar, FaCar, FaUserTie, FaCheckCircle, FaMoneyBillWave, FaTimes, FaFilter } from 'react-icons/fa'
import { notFound, useRouter, useSearchParams } from "next/navigation"
import { FormatDate, handleInputChange } from '@/lib/tools/tools'
import { ValideCommande, ValideSecond, ValideThird } from '../windows/gestion_win/valide_courses'
import { MdClose } from 'react-icons/md'
import { ValideCourses, ChauffeurTaxSummary } from '@/lib/gestion_action'
import { userInformation } from '@/lib/tools/store/web_socket'
import { Wilaya } from '@/lib/tools/named'
import LoadingFirst from '../loading'
import { useSearchLoader } from '../options/useSearchLoader'

type Props = {
    promise: Courses[];
    chauffeurs?: ChauffeurTaxSummary[];
    selectedChauffeurId?: string;
    currentWilaya?: string;
    currentSearch?: string;
    currentValide?: string;
};

export default function Vtc({
    promise,
    chauffeurs = [],
    selectedChauffeurId = "",
    currentWilaya = "",
    currentSearch = "",
    currentValide = ""
}: Props) {

    const { isLoading, handleSearch } = useSearchLoader(['search', 'valide', 'wilaya', 'chauffeur']);

    const [select, setSelect] = useState(promise);
    const [selectedRows, setSelectedRows] = useState<Courses[]>([]);
    const [isVisible, setIsVisible] = useState<number>(0);
    const [chauffeurFilterText, setChauffeurFilterText] = useState("");

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = userInformation();

    useEffect(() => {
        setSelect(promise);
        setSelect((prevSelect) =>
            prevSelect.map((row) => ({
                ...row,
                selected: selectedRows.some((selectedRow) => selectedRow.id === row.id),
            }))
        );
    }, [promise, selectedRows]);

    if (!user) return notFound();

    // Filtre local en temps réel sur la liste des chauffeurs (recherche rapide)
    const filteredChauffeurs = useMemo(() => {
        if (!chauffeurFilterText.trim()) return chauffeurs;
        const q = chauffeurFilterText.toLowerCase().trim();
        return chauffeurs.filter((c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q) ||
            c.wilaya.toLowerCase().includes(q) ||
            (c.matricule && c.matricule.toLowerCase().includes(q))
        );
    }, [chauffeurs, chauffeurFilterText]);

    // Chauffeur actuellement sélectionné
    const activeChauffeur = useMemo(() => {
        if (!selectedChauffeurId) return null;
        return chauffeurs.find(
            (c) => String(c.partener_id) === String(selectedChauffeurId) || String(c.user_id) === String(selectedChauffeurId)
        ) || null;
    }, [chauffeurs, selectedChauffeurId]);

    // Totaux globaux pour l'encadré d'information
    const totalTaxPendingGlobal = useMemo(() => {
        return chauffeurs.reduce((acc, c) => acc + (c.tax_non_payee || 0), 0);
    }, [chauffeurs]);

    // Sélectionner / Déselectionner un chauffeur
    const handleSelectChauffeur = (partenerId: number | string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('page');
        if (partenerId) {
            params.set('chauffeur', String(partenerId));
        } else {
            params.delete('chauffeur');
        }
        router.push(`?${params.toString()}`);
    };

    // Sélectionner toutes les courses non payées actuellement affichées
    const handleSelectAllUnpaid = () => {
        const unpaidRows = select.filter((row) => !row.paye);
        if (unpaidRows.length === 0) return;

        setSelect((prev) =>
            prev.map((row) => ({
                ...row,
                selected: !row.paye ? true : row.selected,
            }))
        );

        setSelectedRows((prevSelected) => {
            const newUnpaid = unpaidRows.filter(
                (row) => !prevSelected.some((sel) => sel.id === row.id)
            );
            return [...prevSelected, ...newUnpaid];
        });
    };

    const handleCheck = (index: number) => {
        setSelect((prev) => {
            return prev.map((row, i) => {
                if (i === index) {
                    const newRow = { ...row, selected: !row.selected };

                    if (newRow.selected && !newRow.paye) {
                        setSelectedRows((prevSelected) => {
                            if (!prevSelected.some((selectedRow) => selectedRow.id === newRow.id)) {
                                return [...prevSelected, newRow];
                            }
                            return prevSelected;
                        });
                    } else {
                        setSelectedRows((prevSelected) =>
                            prevSelected.filter((selectedRow) => selectedRow.id !== newRow.id)
                        );
                    }
                    return newRow;
                }
                return row;
            });
        });
    };

    const handleCheckAll = () => {
        const nonValideRows = select.filter((row) => !row.paye);
        const allSelected = nonValideRows.length > 0 && nonValideRows.every((row) => row.selected);

        const updatedSelect = select.map((row) => ({
            ...row,
            selected: row.paye ? row.selected : !allSelected,
        }));

        setSelect(updatedSelect);

        if (allSelected) {
            setSelectedRows((prevSelected) =>
                prevSelected.filter(
                    (selectedRow) => !select.some((pageRow) => pageRow.id === selectedRow.id)
                )
            );
        } else {
            setSelectedRows((prevSelected) => {
                const newSelections = updatedSelect.filter(
                    (row) => row.selected && !row.paye && !prevSelected.some((selectedRow) => selectedRow.id === row.id)
                );
                return [...prevSelected, ...newSelections];
            });
        }
    };

    const handleValidate = () => { setIsVisible(1); };
    const handleSecond = () => { setIsVisible(2); };
    const handleThird = () => { setIsVisible(3); };
    const handleClose = () => { setIsVisible(0); };

    const hundleSubmite = async (ids: number[]) => {
        const result = await ValideCourses({ courseIds: ids });
        if (result) {
            setIsVisible(0);
            setSelectedRows([]);
            router.refresh();
            return true;
        } else {
            return false;
        }
    };

    const renderEtatBadge = (etat: string) => {
        const cleanEtat = (etat || '').toLowerCase();
        if (cleanEtat === 'terminee') {
            return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Terminée</span>;
        } else if (cleanEtat === 'en_cours') {
            return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">En cours</span>;
        } else if (cleanEtat === 'annulee') {
            return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Annulée</span>;
        } else if (cleanEtat === 'en_attente') {
            return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">En attente</span>;
        }
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">{etat || '—'}</span>;
    };

    const renderPayeBadge = (paye: boolean) => {
        if (paye) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Payé</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Non payé</span>;
    };

    const Commands = select.map((pre, index) => {
        const chofName = pre.partener?.user?.first_name || pre.partener?.user?.last_name
            ? `${pre.partener?.user?.first_name || ""} ${pre.partener?.user?.last_name || ""}`.trim()
            : (pre.partener?.nom_de_magasin || "Non assigné");
        const chofPhone = pre.partener?.user?.phone_number_1 || "—";
        const chofRating = Number(pre.partener?.user?.rating ?? 5).toFixed(1);

        const typeCompteChauffeur = pre.partener?.type_compte?.name
            ? pre.partener.type_compte.name.charAt(0).toUpperCase() + pre.partener.type_compte.name.slice(1)
            : (pre.partener ? "Chauffeur" : "—");
        const typeAccount = pre.partener?.user?.type_account
            ? pre.partener.user.type_account.charAt(0).toUpperCase() + pre.partener.user.type_account.slice(1)
            : null;
        const typeVehiculeCourse = pre.type_coursa || pre.partener?.vihucule?.type_vehicule || "";

        const clientName = pre.client
            ? `${pre.client.first_name || ""} ${pre.client.last_name || ""}`.trim() || pre.client.username || "Client"
            : "—";
        const clientPhone = pre.client?.phone_number_1 || "—";
        const clientRating = Number(pre.client?.rating ?? 5).toFixed(1);

        const kmFormatted = Number(pre.km || 0).toFixed(2);
        const prixFormatted = Number(pre.prix || 0).toLocaleString();
        const taxFormatted = Number(pre.tax_tawsile || 0).toFixed(2);

        const isRowChauffeurSelected = pre.partener && String(pre.partener.id) === String(selectedChauffeurId);

        return (
            <tr
                key={index}
                className={`border-b border-gray-200 text-gray-800 transition-colors ${
                    isRowChauffeurSelected ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'
                }`}
            >
                <td className="px-3 py-3.5 text-center">
                    <input
                        type="checkbox"
                        name='check'
                        id={`check-${index}`}
                        onChange={() => handleCheck(index)}
                        disabled={pre.paye}
                        checked={pre.paye ? false : pre.selected}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                </td>
                <td className="px-3 py-3.5 whitespace-nowrap text-xs text-gray-600 font-medium">
                    {FormatDate(pre.date_creation)}
                </td>
                <td className="px-3 py-3.5">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => pre.partener && handleSelectChauffeur(pre.partener.id)}
                                title="Filtrer les courses de ce chauffeur"
                                className={`text-left font-semibold text-sm hover:text-blue-600 transition-colors ${
                                    isRowChauffeurSelected ? 'text-blue-700 underline font-bold' : 'text-gray-900'
                                }`}
                            >
                                {chofName}
                            </button>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-semibold">
                                <FaStar className="text-amber-400 text-xs" />
                                {chofRating}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">{chofPhone}</span>
                    </div>
                </td>
                {/* Type de compte chauffeur */}
                <td className="px-3 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
                                {typeCompteChauffeur}
                            </span>
                            {typeAccount && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                    {typeAccount}
                                </span>
                            )}
                        </div>
                        {typeVehiculeCourse && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                <FaCar className="text-slate-400 text-[10px]" />
                                {typeVehiculeCourse}
                            </span>
                        )}
                    </div>
                </td>
                <td className="px-3 py-3.5">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">{clientName}</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-semibold">
                                <FaStar className="text-amber-400 text-xs" />
                                {clientRating}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">{clientPhone}</span>
                    </div>
                </td>
                <td className="px-3 py-3.5 text-center whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                        {kmFormatted} km
                    </span>
                </td>
                <td className="px-3 py-3.5 text-right whitespace-nowrap">
                    <span className="font-bold text-gray-900 text-sm">
                        {prixFormatted} DA
                    </span>
                </td>
                <td className="px-3 py-3.5 text-center whitespace-nowrap">
                    {renderEtatBadge(pre.etat)}
                </td>
                <td className="px-3 py-3.5 text-center whitespace-nowrap">
                    {renderPayeBadge(pre.paye)}
                </td>
                <td className="px-3 py-3.5 text-right whitespace-nowrap">
                    <span className="font-bold text-emerald-700 text-sm">
                        {taxFormatted} DA
                    </span>
                </td>
            </tr>
        );
    });

    const isValidationDisabled =
        selectedRows.length === 0 ||
        new Set(selectedRows.map((row) => row.partener?.user?.id ?? row.partener?.id ?? 0)).size > 1;

    return (
        <div className='py-5 px-3 sm:px-8 max-w-[1900px] mx-auto'>
            {/* Fil d'Ariane & Titre */}
            <div className='flex items-center justify-between px-2 pb-4'>
                <div className='flex items-center gap-2'>
                    <Link href="/dashboard" className='font-semibold text-third hover:underline text-sm sm:text-base'>
                        Tableau de bord /
                    </Link>
                    <h1 className='font-bold text-lg sm:text-2xl text-gray-900 flex items-center gap-2'>
                        <FaCar className="text-blue-600" />
                        VTC & Validation des Courses
                    </h1>
                </div>
                {totalTaxPendingGlobal > 0 && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800">
                        <FaMoneyBillWave className="text-amber-500" />
                        Total à valider : <span className="text-sm font-bold text-amber-900">{totalTaxPendingGlobal.toFixed(2)} DA</span>
                    </div>
                )}
            </div>

            {/* Layout principal à deux colonnes */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-5 items-start'>

                {/* COLONNE GAUCHE : LISTE DES CHAUFFEURS AVEC TAXE TOTALE */}
                <div className='lg:col-span-4 xl:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-4 max-h-[calc(100vh-2rem)] flex flex-col'>
                    <div className='flex items-center justify-between pb-3 border-b border-gray-100'>
                        <div className='flex items-center gap-2'>
                            <div className='w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm'>
                                <FaUserTie />
                            </div>
                            <div>
                                <h2 className='font-bold text-sm text-gray-900'>Chauffeurs</h2>
                                <p className='text-xs text-gray-500'>{filteredChauffeurs.length} chauffeur(s)</p>
                            </div>
                        </div>
                        {selectedChauffeurId && (
                            <button
                                onClick={() => handleSelectChauffeur(null)}
                                className='text-xs text-blue-600 hover:text-blue-800 font-semibold underline'
                            >
                                Tous
                            </button>
                        )}
                    </div>

                    {/* Recherche locale de chauffeur */}
                    <div className='pt-3 pb-2'>
                        <div className='relative'>
                            <FaSearch className='absolute left-3 top-2.5 text-gray-400 text-xs' />
                            <input
                                type="text"
                                value={chauffeurFilterText}
                                onChange={(e) => setChauffeurFilterText(e.target.value)}
                                placeholder="Filtrer nom, tél, wilaya..."
                                className='w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition-colors'
                            />
                            {chauffeurFilterText && (
                                <button
                                    onClick={() => setChauffeurFilterText("")}
                                    className='absolute right-2.5 top-2 text-gray-400 hover:text-gray-600'
                                >
                                    <FaTimes className="text-xs" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Carte "Toutes les courses" (état non filtré) */}
                    <div className='pt-1 pb-2'>
                        <button
                            onClick={() => handleSelectChauffeur(null)}
                            className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between text-xs font-semibold ${
                                !selectedChauffeurId
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <FaCar className={!selectedChauffeurId ? 'text-white' : 'text-gray-500'} />
                                Toutes les courses
                            </span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                                !selectedChauffeurId ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                            }`}>
                                Voir tout
                            </span>
                        </button>
                    </div>

                    {/* Liste des cartes chauffeurs scrollable */}
                    <div className='overflow-y-auto pr-1 space-y-2 flex-1 max-h-[620px]'>
                        {filteredChauffeurs.length > 0 ? (
                            filteredChauffeurs.map((c) => {
                                const isSelected = String(c.partener_id) === String(selectedChauffeurId) || String(c.user_id) === String(selectedChauffeurId);
                                const hasUnpaid = (c.tax_non_payee || 0) > 0;

                                return (
                                    <div
                                        key={c.partener_id}
                                        onClick={() => handleSelectChauffeur(c.partener_id)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                                                : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-slate-50/60'
                                        }`}
                                    >
                                        <div className='flex items-start justify-between gap-2'>
                                            <div className='min-w-0'>
                                                <div className='flex items-center gap-1.5'>
                                                    <h3 className='font-bold text-xs sm:text-sm text-gray-900 truncate'>
                                                        {c.name}
                                                    </h3>
                                                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-semibold shrink-0">
                                                        <FaStar className="text-amber-400 text-[9px]" />
                                                        {Number(c.rating || 5).toFixed(1)}
                                                    </span>
                                                </div>
                                                <p className='text-xs text-gray-500 font-mono'>{c.phone}</p>
                                                <div className='flex items-center gap-2 mt-1'>
                                                    {c.wilaya && (
                                                        <span className='text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium truncate max-w-[120px]'>
                                                            {c.wilaya}
                                                        </span>
                                                    )}
                                                    {c.type_vehicule && (
                                                        <span className='text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium'>
                                                            {c.type_vehicule}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Statut de validation */}
                                            {c.courses_non_valide > 0 && (
                                                <span className='inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0'>
                                                    {c.courses_non_valide} à valider
                                                </span>
                                            )}
                                        </div>

                                        {/* Taxes : Taxe non payée et Taxe totale */}
                                        <div className='mt-2.5 pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs'>
                                            <div className={`p-1.5 rounded ${hasUnpaid ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                                                <span className='text-[10px] uppercase font-semibold text-gray-500 block leading-tight'>
                                                    À Valider
                                                </span>
                                                <span className={`font-bold text-xs ${hasUnpaid ? 'text-amber-800 font-extrabold' : 'text-gray-700'}`}>
                                                    {(c.tax_non_payee || 0).toFixed(2)} DA
                                                </span>
                                            </div>
                                            <div className='p-1.5 rounded bg-emerald-50/70 border border-emerald-100'>
                                                <span className='text-[10px] uppercase font-semibold text-emerald-800 block leading-tight'>
                                                    Taxe Totale
                                                </span>
                                                <span className='font-bold text-xs text-emerald-900'>
                                                    {(c.tax_totale || 0).toFixed(2)} DA
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className='text-center py-8 text-gray-400 text-xs'>
                                Aucun chauffeur trouvé
                            </div>
                        )}
                    </div>
                </div>

                {/* COLONNE DROITE : LISTE DES COURSES & ACTIONS DE VALIDATION */}
                <div className='lg:col-span-8 xl:col-span-9 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6'>

                    {/* Bannière si chauffeur sélectionné */}
                    {activeChauffeur ? (
                        <div className='mb-5 p-3.5 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs'>
                            <div className='flex items-center gap-3'>
                                <div className='w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm'>
                                    <FaUserTie />
                                </div>
                                <div>
                                    <div className='flex items-center gap-2 flex-wrap'>
                                        <h3 className='font-bold text-base text-gray-900'>
                                            {activeChauffeur.name}
                                        </h3>
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-semibold">
                                            <FaStar className="text-amber-400 text-xs" />
                                            {Number(activeChauffeur.rating || 5).toFixed(1)}
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">
                                            {activeChauffeur.phone}
                                        </span>
                                    </div>
                                    <div className='flex items-center gap-3 text-xs text-gray-600 mt-0.5 flex-wrap'>
                                        {activeChauffeur.wilaya && (
                                            <span>Wilaya : <strong className="text-gray-800">{activeChauffeur.wilaya}</strong></span>
                                        )}
                                        <span>Taxe à valider : <strong className="text-amber-700 font-bold">{activeChauffeur.tax_non_payee.toFixed(2)} DA</strong></span>
                                        <span>Taxe totale : <strong className="text-emerald-700 font-bold">{activeChauffeur.tax_totale.toFixed(2)} DA</strong></span>
                                    </div>
                                </div>
                            </div>

                            <div className='flex items-center gap-2 w-full sm:w-auto shrink-0'>
                                <button
                                    type="button"
                                    onClick={handleSelectAllUnpaid}
                                    className='flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all'
                                    title="Sélectionner toutes les courses non payées de ce chauffeur"
                                >
                                    <FaCheckCircle className="text-xs" />
                                    Tout sélectionner à valider
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSelectChauffeur(null)}
                                    className='px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-semibold rounded-lg transition-colors'
                                    title="Réinitialiser et voir toutes les courses"
                                >
                                    <FaTimes className="text-xs inline mr-1" />
                                    Tous
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {/* Barre d'outils et de filtres */}
                    <div className='flex flex-col xl:flex-row items-stretch xl:items-center justify-between mb-6 gap-4 pb-4 border-b border-gray-100'>
                        <form onSubmit={handleSearch} className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap flex-1'>
                            {/* Input caché pour conserver le chauffeur sélectionné lors de la recherche */}
                            <input type="hidden" name="chauffeur" value={selectedChauffeurId || ""} />

                            {/* Recherche par numéro de téléphone */}
                            <div className='relative flex-1 min-w-[200px]'>
                                <FaSearch className='absolute left-3 top-3 text-slate-400 text-sm' />
                                <input
                                    onChange={handleInputChange}
                                    defaultValue={currentSearch}
                                    type="text"
                                    name="search"
                                    placeholder='Recherche par tél (chauffeur ou client)...'
                                    className='w-full border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all'
                                />
                            </div>

                            {/* Sélecteur de statut de validation */}
                            <div className="inline-flex bg-gray-100 rounded-lg p-1 shrink-0">
                                <div className='relative'>
                                    <input
                                        type="radio"
                                        id="allValide"
                                        name="valide"
                                        defaultChecked={!currentValide}
                                        value=""
                                        className="peer hidden"
                                    />
                                    <label
                                        htmlFor="allValide"
                                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-transparent rounded-md cursor-pointer transition-all hover:text-gray-900 peer-checked:bg-white peer-checked:text-blue-600 peer-checked:shadow-xs font-semibold"
                                    >
                                        Tous
                                    </label>
                                </div>
                                <div className='relative'>
                                    <input
                                        type="radio"
                                        id="valide"
                                        name="valide"
                                        defaultChecked={currentValide === 'true'}
                                        value="true"
                                        className="peer hidden"
                                    />
                                    <label
                                        htmlFor="valide"
                                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-transparent rounded-md cursor-pointer transition-all hover:text-gray-900 peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:shadow-xs font-semibold"
                                    >
                                        Valider
                                    </label>
                                </div>
                                <div className='relative'>
                                    <input
                                        type="radio"
                                        id="noValide"
                                        name="valide"
                                        defaultChecked={currentValide === 'false'}
                                        value="false"
                                        className="peer hidden"
                                    />
                                    <label
                                        htmlFor="noValide"
                                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-transparent rounded-md cursor-pointer transition-all hover:text-gray-900 peer-checked:bg-rose-500 peer-checked:text-white peer-checked:shadow-xs font-semibold"
                                    >
                                        No valider
                                    </label>
                                </div>
                            </div>

                            {/* Sélecteur Wilaya */}
                            <div className='relative min-w-[160px]'>
                                <select
                                    name="wilaya"
                                    defaultValue={currentWilaya}
                                    className='w-full border border-gray-300 rounded-lg py-2 px-3 text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                >
                                    <option value="">Toutes les Wilayas</option>
                                    {Wilaya.map((pre) => (
                                        <option key={pre.id} value={pre.name}>
                                            {pre.id} - {pre.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className='bg-blue-600 hover:bg-blue-700 font-semibold text-white px-4 py-2 rounded-lg text-sm transition-all shadow-xs shrink-0 flex items-center justify-center gap-1.5'
                            >
                                <FaFilter className="text-xs" />
                                Filtrer
                            </button>
                        </form>

                        {/* Bouton de validation des courses sélectionnées */}
                        <div className='flex items-center gap-2 shrink-0'>
                            <button
                                onClick={handleValidate}
                                disabled={isValidationDisabled}
                                className='bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed w-full xl:w-auto px-5 py-2 text-white rounded-lg font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2'
                            >
                                <FaCheckCircle />
                                <span>Validé</span>
                                {selectedRows.length > 0 && (
                                    <span className="bg-white text-emerald-800 text-xs px-2 py-0.5 rounded-full font-extrabold">
                                        {selectedRows.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Tableau des courses */}
                    <div className="relative overflow-x-auto shadow-xs border border-gray-200 sm:rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-slate-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-3.5 text-center w-10">
                                        <input
                                            type="checkbox"
                                            name='check'
                                            id="check-all"
                                            onChange={handleCheckAll}
                                            checked={select.length > 0 && select.every((row) => (row.selected && !row.paye) || row.paye)}
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-3 py-3.5">
                                        Date
                                    </th>
                                    <th className="px-3 py-3.5">
                                        Chauffeur
                                    </th>
                                    <th className="px-3 py-3.5">
                                        Type Compte
                                    </th>
                                    <th className="px-3 py-3.5">
                                        Client
                                    </th>
                                    <th className="px-3 py-3.5 text-center">
                                        Distance (KM)
                                    </th>
                                    <th className="px-3 py-3.5 text-right">
                                        Prix Course
                                    </th>
                                    <th className="px-3 py-3.5 text-center">
                                        État
                                    </th>
                                    <th className="px-3 py-3.5 text-center">
                                        Payé
                                    </th>
                                    <th className="px-3 py-3.5 text-right">
                                        Taxe
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {Commands.length > 0 ? (
                                    Commands
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="text-center py-12 text-gray-400 font-medium">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <FaCar className="text-3xl text-gray-300" />
                                                <p className="text-sm font-semibold text-gray-500">Aucune course trouvée</p>
                                                <p className="text-xs text-gray-400">Modifiez vos critères de recherche ou sélectionnez un autre chauffeur.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modales multi-étapes de validation */}
            {isVisible === 1 && (
                <div>
                    <button onClick={handleClose} className='fixed z-50 top-28 right-10 bg-white shadow-md rounded-full text-third p-2 font-bold text-4xl hover:bg-gray-100 transition-colors'>
                        <MdClose />
                    </button>
                    <ValideCommande command={selectedRows} onEvent={handleSecond} onBack={handleClose} />
                </div>
            )}
            {isVisible === 2 && (
                <div>
                    <button onClick={handleClose} className='fixed z-50 top-28 right-10 bg-white shadow-md rounded-full text-third p-2 font-bold text-4xl hover:bg-gray-100 transition-colors'>
                        <MdClose />
                    </button>
                    <ValideSecond command={selectedRows} onEvent={handleThird} onBack={handleValidate} />
                </div>
            )}
            {isVisible === 3 && (
                <div>
                    <button onClick={handleClose} className='fixed z-50 top-28 right-10 bg-white shadow-md rounded-full text-third p-2 font-bold text-4xl hover:bg-gray-100 transition-colors'>
                        <MdClose />
                    </button>
                    <ValideThird command={selectedRows} onBack={handleSecond} onSub={hundleSubmite} user={user} />
                </div>
            )}

            {isLoading && <LoadingFirst />}
        </div>
    );
}
