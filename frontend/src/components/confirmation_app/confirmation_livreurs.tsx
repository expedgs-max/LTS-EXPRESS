"use client";

import { getImageUrl } from '@/lib/tools/tools';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    FaSearch,
    FaFilter,
    FaWifi,
    FaUserPlus,
    FaMotorcycle,
    FaIdCard,
    FaCar,
    FaEdit,
    FaCamera
} from 'react-icons/fa';
import { ConfirmationLivreur } from '@/lib/confirmation_action';
import { Wilaya } from '@/lib/tools/named';
import LivreurCreateModal from '../windows/confirmation_win/livreur_create_modal';
import LivreurProfileModal from '../windows/confirmation_win/livreur_profile_modal';

interface ConfirmationLivreursProps {
    livreurs: ConfirmationLivreur[];
    token?: string;
    initialWilaya?: string;
    initialAvailable?: string;
    initialSearch?: string;
}

export default function ConfirmationLivreurs({
    livreurs,
    token = "",
    initialWilaya = "",
    initialAvailable = "",
    initialSearch = ""
}: ConfirmationLivreursProps) {
    const [livreursList, setLivreursList] = useState<ConfirmationLivreur[]>(livreurs);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedLivreurForProfile, setSelectedLivreurForProfile] = useState<ConfirmationLivreur | null>(null);

    const router = useRouter();
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        setLivreursList(livreurs);
    }, [livreurs]);

    // WebSocket real-time connection for driver status
    useEffect(() => {
        let reconnectTimeout: NodeJS.Timeout;

        const connectSocket = () => {
            const wsBase = process.env.NEXT_PUBLIC_WS_SERVER || 'ws://127.0.0.1:8000';
            const wsUrl = `${wsBase}/ws/confirmation/commandes/?token=${token}`;

            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'livreur_status' && data.livreur_id) {
                        const { livreur_id, is_available } = data;

                        setLivreursList((prev) =>
                            prev.map((liv) =>
                                liv.id === livreur_id
                                    ? { ...liv, is_available: Boolean(is_available) }
                                    : liv
                            )
                        );
                    }
                } catch {
                    // Ignore parsing error
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                reconnectTimeout = setTimeout(connectSocket, 3000);
            };

            ws.onerror = () => {
                setIsConnected(false);
                ws.close();
            };
        };

        connectSocket();

        return () => {
            clearTimeout(reconnectTimeout);
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [token]);

    const onlineCount = livreursList.filter((l) => l.is_available).length;

    return (
        <div className='py-6 px-4 sm:px-8 w-full text-slate-900 dark:text-slate-100'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6'>
                <div>
                    <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1'>
                        <Link href="/dashboard" className='hover:text-blue-500 font-medium'>Tableau de bord</Link>
                        <span>/</span>
                        <span className='text-slate-800 dark:text-slate-200 font-semibold'>Confirmation</span>
                        <span>/</span>
                        <span>Livreurs</span>
                    </div>
                    <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white'>
                        État des Livreurs (En Ligne / Hors Ligne)
                    </h1>
                </div>

                {/* Header Actions: Online Badge + Create Button */}
                <div className='flex items-center gap-3 flex-wrap'>
                    <span className='px-3.5 py-1.5 bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 font-extrabold text-xs rounded-full shadow-sm flex items-center gap-1.5 border border-green-200 dark:border-green-800/40'>
                        <span className='w-2 h-2 rounded-full bg-green-500 animate-pulse' />
                        {onlineCount} En Ligne
                    </span>
                    <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${isConnected
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 shadow-sm'
                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                        }`}>
                        <FaWifi className={`${isConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
                        <span>{isConnected ? 'Temps Réel Connecté' : 'Reconnexion...'}</span>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className='bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2'
                    >
                        <FaUserPlus /> Créer un Livreur
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className='bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 mb-6 transition-colors'>
                <form method='GET' className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                    {/* Search */}
                    <div className='relative'>
                        <FaSearch className='absolute left-3.5 top-3.5 text-slate-400' />
                        <input
                            type='text'
                            name='search'
                            defaultValue={initialSearch}
                            placeholder='Nom, prénom, username, RC, tél...'
                            className='w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500'
                        />
                    </div>

                    {/* Wilaya Filter */}
                    <div>
                        <select
                            name='wilaya'
                            defaultValue={initialWilaya}
                            className='w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white'
                        >
                            <option value="">Toutes les Wilayas</option>
                            {Wilaya.map((w) => (
                                <option key={w.code} value={w.name}>
                                    {String(w.code).padStart(2, '0')} - {w.name} ({w.ar_name})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Disponibilité */}
                    <div>
                        <select
                            name='available'
                            defaultValue={initialAvailable}
                            className='w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white'
                        >
                            <option value="">Tous les États</option>
                            <option value="en_ligne">En Ligne (Disponible)</option>
                            <option value="offline">Hors Ligne (Offline)</option>
                        </select>
                    </div>

                    {/* Submit Button */}
                    <div className='flex gap-2'>
                        <button
                            type='submit'
                            className='flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2'
                        >
                            <FaFilter /> Filtrer
                        </button>
                        {(initialSearch || initialWilaya || initialAvailable) && (
                            <Link
                                href="/dashboard/confirmation/livreurs"
                                className='p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center text-sm font-semibold transition-colors'
                                title='Réinitialiser'
                            >
                                Réinit.
                            </Link>
                        )}
                    </div>
                </form>
            </div>

            {/* Livreurs Table */}
            <div className='bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors'>
                <div className='overflow-x-auto'>
                    <table className='w-full text-left text-sm text-slate-600 dark:text-slate-300'>
                        <thead className='bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-800'>
                            <tr>
                                <th className='px-5 py-4'>#ID</th>
                                <th className='px-5 py-4'>Livreur & Username</th>
                                <th className='px-5 py-4'>Wilaya</th>
                                <th className='px-5 py-4'>Téléphone & Email</th>
                                <th className='px-5 py-4'>Véhicule & RC</th>
                                <th className='px-5 py-4'>Magasin Assigné</th>
                                <th className='px-5 py-4'>Commande Livrées</th>
                                <th className='px-5 py-4'>Statut Actuel</th>
                                <th className='px-5 py-4 text-center'>Action</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100 dark:divide-slate-800/70'>
                            {livreursList.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className='text-center py-12 text-slate-400'>
                                        Aucun livreur trouvé selon ces critères.
                                    </td>
                                </tr>
                            ) : (
                                livreursList.map((livreur) => {
                                    const userImg = livreur.user?.image_url
                                        ? (getImageUrl(livreur.user.image_url))
                                        : null;

                                    return (
                                        <tr
                                            key={livreur.id}
                                            onClick={() => setSelectedLivreurForProfile(livreur)}
                                            className='hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group'
                                        >
                                            <td className='px-5 py-4 font-bold text-slate-900 dark:text-white'>
                                                #{livreur.id}
                                            </td>
                                            <td className='px-5 py-4'>
                                                <div className='flex items-center gap-3'>
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedLivreurForProfile(livreur);
                                                        }}
                                                        className='relative group/avatar cursor-pointer shrink-0'
                                                        title="Changer la photo de profil"
                                                    >
                                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white overflow-hidden border-2 transition-all ${livreur.is_available
                                                                ? 'border-emerald-500 shadow-md shadow-emerald-500/20'
                                                                : 'border-slate-300 dark:border-slate-700'
                                                            } ${userImg ? 'bg-slate-100 dark:bg-slate-800' : (livreur.is_available ? 'bg-emerald-600' : 'bg-slate-400 dark:bg-slate-700')
                                                            }`}>
                                                            {userImg ? (
                                                                <Image
                                                                    src={userImg}
                                                                    alt={livreur.user?.username || 'Livreur'}
                                                                    width={44}
                                                                    height={44}
                                                                    className='w-full h-full object-cover group-hover/avatar:scale-105 transition-transform'
                                                                    unoptimized
                                                                />
                                                            ) : (
                                                                <span>{livreur.user?.first_name?.[0] || livreur.user?.username?.[0] || 'L'}</span>
                                                            )}
                                                        </div>
                                                        <span className='absolute -bottom-1 -right-1 w-4.5 h-4.5 p-1 bg-blue-600 group-hover/avatar:bg-blue-500 text-white rounded-full flex items-center justify-center text-[9px] shadow-sm border border-white dark:border-slate-900 transition-colors'>
                                                            <FaCamera />
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className='font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors'>
                                                            {livreur.user?.first_name || ''} {livreur.user?.last_name || livreur.user?.username}
                                                        </p>
                                                        <p className='text-xs text-slate-400'>
                                                            @{livreur.user?.username} • ⭐ {livreur.user?.rating ? livreur.user.rating.toFixed(1) : '5.0'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-5 py-4'>
                                                <span className='px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-xs'>
                                                    {livreur.wilaya || 'N/A'}
                                                </span>
                                            </td>
                                            <td className='px-5 py-4'>
                                                <p className='font-medium text-slate-800 dark:text-slate-200 text-xs'>
                                                    {livreur.user?.phone || 'Tél: N/A'}
                                                </p>
                                                {livreur.user?.email && (
                                                    <p className='text-[11px] text-slate-400 truncate max-w-[140px]'>
                                                        {livreur.user.email}
                                                    </p>
                                                )}
                                            </td>
                                            <td className='px-5 py-4'>
                                                <div className='flex flex-col gap-1'>
                                                    <span className='inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold'>
                                                        {livreur.vehicule?.type_vehicule?.toLowerCase().includes('voiture') ? (
                                                            <FaCar className='text-blue-500' />
                                                        ) : (
                                                            <FaMotorcycle className='text-emerald-500' />
                                                        )}
                                                        {livreur.vehicule?.type_vehicule || 'Moto'}
                                                        {livreur.vehicule?.marque && ` (${livreur.vehicule.marque})`}
                                                    </span>
                                                    {livreur.RC ? (
                                                        <span className='inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono'>
                                                            <FaIdCard /> RC: {livreur.RC}
                                                        </span>
                                                    ) : (
                                                        <span className='text-[11px] text-slate-400 italic'>
                                                            RC non renseigné
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='px-5 py-4'>
                                                {livreur.magasin?.name || livreur.magasin_name ? (
                                                    <span className='text-xs font-semibold text-blue-600 dark:text-blue-400'>
                                                        {livreur.magasin?.name || livreur.magasin_name}
                                                    </span>
                                                ) : (
                                                    <span className='text-xs text-slate-400'>Flotte Générale</span>
                                                )}
                                            </td>
                                            <td className='px-5 py-4'>
                                                <span className='inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold text-sm rounded-lg border border-blue-100 dark:border-blue-800/40'>
                                                    📦 {livreur.user?.nbr_commandes ?? 0}
                                                </span>
                                            </td>
                                            <td className='px-5 py-4'>
                                                {livreur.is_available ? (
                                                    <span className='inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-full border border-emerald-200 dark:border-emerald-800/50'>
                                                        <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse' />
                                                        En Ligne
                                                    </span>
                                                ) : (
                                                    <span className='inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-xs rounded-full'>
                                                        <span className='w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600' />
                                                        Hors Ligne
                                                    </span>
                                                )}
                                            </td>
                                            <td className='px-5 py-4 text-center' onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => setSelectedLivreurForProfile(livreur)}
                                                    className='px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 mx-auto shadow-sm'
                                                >
                                                    <FaEdit /> Modifier / Photo
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal 1: Quick & Simple Livreur Creation */}
            {isCreateModalOpen && (
                <LivreurCreateModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={() => {
                        router.refresh();
                    }}
                    initialWilaya={initialWilaya}
                />
            )}

            {/* Modal 2: Full Profile & Documents (RC, NIF, Vehicle, etc.) */}
            {selectedLivreurForProfile && (
                <LivreurProfileModal
                    livreur={selectedLivreurForProfile}
                    onClose={() => setSelectedLivreurForProfile(null)}
                    onUpdated={() => {
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}

