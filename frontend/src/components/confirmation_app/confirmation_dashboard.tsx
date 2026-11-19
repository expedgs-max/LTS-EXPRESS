"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
    MdOutlineStorefront, 
    MdDeliveryDining, 
    MdOutlineConfirmationNumber, 
    MdCheckCircle, 
    MdPendingActions,
    MdArrowForward,
    MdLocationOn,
    MdLocalOffer,
    MdGroup
} from 'react-icons/md';
import { FaTrophy } from 'react-icons/fa6';
import { ConfirmationStats, getConfirmationStats } from '@/lib/confirmation_action';
import { Wilaya } from '@/lib/tools/named';
import MapDz from '../dashboard/map-dz';
import { TbLoader3 } from 'react-icons/tb';

export default function ConfirmationDashboard() {
    const [selectedWilaya, setSelectedWilaya] = useState<string>("");
    const [stats, setStats] = useState<ConfirmationStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchStats = async (wilaya?: string) => {
        setLoading(true);
        const data = await getConfirmationStats(wilaya);
        setStats(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchStats(selectedWilaya);
    }, [selectedWilaya]);

    return (
        <div className='py-6 px-4 sm:px-10 max-w-7xl mx-auto space-y-8 animate-fadeIn'>
            {/* Top Bar with Wilaya Selector */}
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-3xl text-white shadow-xl'>
                <div>
                    <span className='px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full border border-blue-400/30'>
                        Espace Opérationnel
                    </span>
                    <h1 className='text-2xl sm:text-3xl font-bold mt-2'>
                        Tableau de Bord Confirmation
                    </h1>
                    <p className='text-sm text-slate-300 mt-1'>
                        Surveillance en temps réel des magasins, livreurs et flux de commandes
                    </p>
                </div>

                {/* Wilaya Filter */}
                <div className='flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10'>
                    <MdLocationOn className='text-blue-400 text-xl' />
                    <div className='flex flex-col'>
                        <span className='text-[10px] text-slate-400 font-semibold uppercase tracking-wider'>Filtrer par Wilaya</span>
                        <select
                            value={selectedWilaya}
                            onChange={(e) => setSelectedWilaya(e.target.value)}
                            className='bg-transparent text-white font-semibold text-sm outline-none cursor-pointer pr-2'
                        >
                            <option value="" className='text-slate-800'>Toutes les 58 Wilayas</option>
                            {Wilaya.map((w) => (
                                <option key={w.code} value={w.name} className='text-slate-800'>
                                    {String(w.code).padStart(2, '0')} - {w.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Live Dispatch Hero Banner */}
            <div className='bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6'>
                <div className='space-y-2 text-center md:text-left'>
                    <div className='flex items-center justify-center md:justify-start gap-2'>
                        <span className='inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-400/30 animate-pulse'>
                            <span className='w-2 h-2 rounded-full bg-emerald-400 animate-ping'></span>
                            Nouveau • Monitoring Temps Réel
                        </span>
                    </div>
                    <h2 className='text-2xl sm:text-3xl font-extrabold tracking-tight'>
                        Dispatch & Carte Interactive des Livreurs
                    </h2>
                    <p className='text-sm text-slate-300 max-w-xl'>
                        Suivez les livreurs (en ligne, hors ligne, bloqués), visualisez les commandes sur la carte Google/Leaflet et assignez les livraisons en temps réel.
                    </p>
                </div>
                <Link
                    href={selectedWilaya ? `/dashboard/confirmation/dispatch?wilaya=${selectedWilaya}` : "/dashboard/confirmation/dispatch"}
                    className='px-6 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shrink-0'
                >
                    <span>Ouvrir la Carte Live</span>
                    <MdArrowForward className='text-lg' />
                </Link>
            </div>

            {/* KPI Cards Grid */}
            {loading ? (
                <div className='flex flex-col items-center justify-center py-16 gap-3 text-slate-400'>
                    <TbLoader3 className='animate-spin text-4xl text-blue-500' />
                    <span className='text-sm font-medium'>Chargement des métriques opérationnelles...</span>
                </div>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    {/* Magasins Card */}
                    <div className='bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm dark:shadow-none border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-all'>
                        <div className='flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800'>
                            <div>
                                <p className='text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider'>Magasins & Restaurants</p>
                                <h3 className='text-3xl font-extrabold text-slate-900 dark:text-white mt-1'>{stats?.magasins.total || 0}</h3>
                            </div>
                            <div className='p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl text-2xl border border-amber-200/50 dark:border-amber-500/20'>
                                <MdOutlineStorefront />
                            </div>
                        </div>

                        <div className='grid grid-cols-2 gap-3 py-4'>
                            <div className='bg-green-50/80 dark:bg-green-950/30 p-3 rounded-2xl border border-green-200/60 dark:border-green-800/40'>
                                <p className='text-xs font-medium text-green-700 dark:text-green-400'>Ouverts</p>
                                <p className='text-2xl font-bold text-green-700 dark:text-green-300 mt-0.5'>{stats?.magasins.ouverts || 0}</p>
                            </div>
                            <div className='bg-rose-50/80 dark:bg-rose-950/30 p-3 rounded-2xl border border-rose-200/60 dark:border-rose-800/40'>
                                <p className='text-xs font-medium text-rose-700 dark:text-rose-400'>Fermés</p>
                                <p className='text-2xl font-bold text-rose-700 dark:text-rose-300 mt-0.5'>{stats?.magasins.fermes || 0}</p>
                            </div>
                        </div>

                        <Link
                            href={selectedWilaya ? `/dashboard/confirmation/magasins?wilaya=${selectedWilaya}` : "/dashboard/confirmation/magasins"}
                            className='w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-between transition-colors mt-2'
                        >
                            <span>Voir l&apos;état des magasins</span>
                            <MdArrowForward className='text-sm' />
                        </Link>
                    </div>

                    {/* Livreurs Card */}
                    <div className='bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm dark:shadow-none border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-all'>
                        <div className='flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800'>
                            <div>
                                <p className='text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider'>Flotte de Livreurs</p>
                                <h3 className='text-3xl font-extrabold text-slate-900 dark:text-white mt-1'>{stats?.livreurs.total || 0}</h3>
                            </div>
                            <div className='p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl text-2xl border border-blue-200/50 dark:border-blue-500/20'>
                                <MdDeliveryDining />
                            </div>
                        </div>

                        <div className='grid grid-cols-2 gap-3 py-4'>
                            <div className='bg-emerald-50/80 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40'>
                                <p className='text-xs font-medium text-emerald-700 dark:text-emerald-400'>En Ligne</p>
                                <p className='text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5'>{stats?.livreurs.en_ligne || 0}</p>
                            </div>
                            <div className='bg-slate-100/80 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700'>
                                <p className='text-xs font-medium text-slate-600 dark:text-slate-400'>Hors Ligne</p>
                                <p className='text-2xl font-bold text-slate-700 dark:text-slate-300 mt-0.5'>{stats?.livreurs.offline || 0}</p>
                            </div>
                        </div>

                        <Link
                            href={selectedWilaya ? `/dashboard/confirmation/livreurs?wilaya=${selectedWilaya}` : "/dashboard/confirmation/livreurs"}
                            className='w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-between transition-colors mt-2'
                        >
                            <span>Voir l&apos;état des livreurs</span>
                            <MdArrowForward className='text-sm' />
                        </Link>
                    </div>

                    {/* Commandes Card */}
                    <div className='bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm dark:shadow-none border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-all'>
                        <div className='flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800'>
                            <div>
                                <p className='text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider'>Commandes Reçues</p>
                                <h3 className='text-3xl font-extrabold text-slate-900 dark:text-white mt-1'>{stats?.commandes.total || 0}</h3>
                            </div>
                            <div className='p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl text-2xl border border-indigo-200/50 dark:border-indigo-500/20'>
                                <MdOutlineConfirmationNumber />
                            </div>
                        </div>

                        <div className='grid grid-cols-2 gap-3 py-4'>
                            <div className='bg-amber-50/80 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200/60 dark:border-amber-800/40'>
                                <p className='text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1'><MdPendingActions /> En attente</p>
                                <p className='text-2xl font-bold text-amber-700 dark:text-amber-300 mt-0.5'>{stats?.commandes.en_attente || 0}</p>
                            </div>
                            <div className='bg-blue-50/80 dark:bg-blue-950/30 p-3 rounded-2xl border border-blue-200/60 dark:border-blue-800/40'>
                                <p className='text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1'><MdCheckCircle /> Confirmées</p>
                                <p className='text-2xl font-bold text-blue-700 dark:text-blue-300 mt-0.5'>{stats?.commandes.confirmees || 0}</p>
                            </div>
                        </div>

                        <Link
                            href={selectedWilaya ? `/dashboard/confirmation/commandes?wilaya=${selectedWilaya}` : "/dashboard/confirmation/commandes"}
                            className='w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-between transition-colors mt-2'
                        >
                            <span>Gérer & Diffuser Commandes</span>
                            <MdArrowForward className='text-sm' />
                        </Link>
                    </div>
                </div>
            )}

            {/* Quick Navigation Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4'>
                <Link
                    href="/dashboard/confirmation/commandes"
                    className='p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col justify-between h-32'
                >
                    <div className='flex justify-between items-start'>
                        <span className='text-xs font-semibold uppercase tracking-wider text-blue-200'>Commandes</span>
                        <MdOutlineConfirmationNumber className='text-2xl' />
                    </div>
                    <div>
                        <h4 className='font-bold text-lg'>Diffuser Commandes</h4>
                        <p className='text-xs text-blue-100'>Assigner aux livreurs disponibles</p>
                    </div>
                </Link>

                <Link
                    href="/dashboard/confirmation/magasins"
                    className='p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col justify-between h-32'
                >
                    <div className='flex justify-between items-start'>
                        <span className='text-xs font-semibold uppercase tracking-wider text-amber-200'>Magasins</span>
                        <MdOutlineStorefront className='text-2xl' />
                    </div>
                    <div>
                        <h4 className='font-bold text-lg'>Suivi Magasins</h4>
                        <p className='text-xs text-amber-100'>Ouverture & Disponibilité</p>
                    </div>
                </Link>

                <Link
                    href="/dashboard/confirmation/livreurs"
                    className='p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col justify-between h-32'
                >
                    <div className='flex justify-between items-start'>
                        <span className='text-xs font-semibold uppercase tracking-wider text-emerald-200'>Flotte</span>
                        <MdDeliveryDining className='text-2xl' />
                    </div>
                    <div>
                        <h4 className='font-bold text-lg'>Livreurs en Ligne</h4>
                        <p className='text-xs text-emerald-100'>Disponibilité & charges</p>
                    </div>
                </Link>

                <Link
                    href="/dashboard/employees"
                    className='p-5 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col justify-between h-32'
                >
                    <div className='flex justify-between items-start'>
                        <span className='text-xs font-semibold uppercase tracking-wider text-indigo-200'>Personnel</span>
                        <MdGroup className='text-2xl' />
                    </div>
                    <div>
                        <h4 className='font-bold text-lg'>Gestion Employés</h4>
                        <p className='text-xs text-indigo-100'>Rôles, permissions & comptes</p>
                    </div>
                </Link>

                <Link
                    href="/dashboard/confirmation/promo"
                    className='p-5 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 text-white rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col justify-between h-32'
                >
                    <div className='flex justify-between items-start'>
                        <span className='text-xs font-semibold uppercase tracking-wider text-amber-100'>Parrainage</span>
                        <MdLocalOffer className='text-2xl' />
                    </div>
                    <div>
                        <h4 className='font-bold text-lg'>Codes Promo</h4>
                        <p className='text-xs text-amber-100'>Gestion & Utilisateurs</p>
                    </div>
                </Link>

                <Link
                    href="/dashboard/apple_center"
                    className='p-5 bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col justify-between h-32'
                >
                    <div className='flex justify-between items-start'>
                        <span className='text-xs font-semibold uppercase tracking-wider text-slate-300'>Support</span>
                        <MdLocationOn className='text-2xl' />
                    </div>
                    <div>
                        <h4 className='font-bold text-lg'>Centre d&apos;Appel</h4>
                        <p className='text-xs text-slate-300'>Gestion des partenaires</p>
                    </div>
                </Link>

                <Link
                    href="/dashboard/objectifs"
                    className='p-5 bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-700 text-white rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex flex-col justify-between h-32'
                >
                    <div className='flex justify-between items-start'>
                        <span className='text-xs font-semibold uppercase tracking-wider text-amber-100'>Challenges</span>
                        <FaTrophy className='text-2xl text-yellow-200' />
                    </div>
                    <div>
                        <h4 className='font-bold text-lg'>Objectifs & Primes</h4>
                        <p className='text-xs text-amber-100'>Suivi chauffeurs & livreurs</p>
                    </div>
                </Link>
            </div>

            {/* Map Section */}
            <div className='bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm dark:shadow-none border border-slate-200/80 dark:border-slate-800 transition-colors'>
                <div className='flex items-center justify-between mb-4'>
                    <div>
                        <h3 className='text-lg font-bold text-slate-900 dark:text-white'>Carte Opérationnelle de l&apos;Algérie</h3>
                        <p className='text-xs text-slate-500 dark:text-slate-400'>Visualisation de la répartition par wilaya</p>
                    </div>
                </div>
                <div className='w-full flex justify-center overflow-hidden py-4'>
                    <MapDz />
                </div>
            </div>
        </div>
    );
}
