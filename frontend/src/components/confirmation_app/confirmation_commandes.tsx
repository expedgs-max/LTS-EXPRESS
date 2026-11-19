"use client"

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FaSearch, FaFilter, FaWifi } from 'react-icons/fa';
import { 
    MdDeliveryDining, 
    MdCheckCircle, 
    MdCancel, 
    MdPendingActions, 
    MdNotificationsActive,
    MdVisibility,
    MdPhone,
    MdDoneAll,
    MdCalendarToday
} from 'react-icons/md';
import DispatchModal from '../windows/confirmation_win/dispatch_modal';
import OrderDetailsModal from '../windows/confirmation_win/order_details_modal';
import ConfirmDeliveryDialog from '../windows/confirmation_win/confirm_dialog';
import { Wilaya } from '@/lib/tools/named';
import { markCommandeDeliveredByCentre, updateCommandeStatusByCentre } from '@/lib/confirmation_action';
import toast from 'react-hot-toast';

interface ConfirmationCommandesProps {
    commandes: Order[];
    token?: string;
    initialWilaya?: string;
    initialStatus?: string;
    initialConfirmation?: string;
    initialSearch?: string;
    initialDate?: string;
}

export default function ConfirmationCommandes({
    commandes,
    token = "",
    initialWilaya = "",
    initialStatus = "",
    initialConfirmation = "",
    initialSearch = "",
    initialDate = ""
}: ConfirmationCommandesProps) {
    const [commandesList, setCommandesList] = useState<Order[]>(commandes);
    const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);
    const [dispatchingOrder, setDispatchingOrder] = useState<Order | null>(null);
    const [statusDialogData, setStatusDialogData] = useState<{ order: Order; targetStatus: string } | null>(null);
    const [confirmingDeliveryOrder, setConfirmingDeliveryOrder] = useState<Order | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [newlyArrivedIds, setNewlyArrivedIds] = useState<number[]>([]);
    const [newCount, setNewCount] = useState<number>(0);
    const socketRef = useRef<WebSocket | null>(null);
    const notifiedOrderIdsRef = useRef<Set<number>>(new Set());

    // Synchronize initial prop data
    useEffect(() => {
        setCommandesList(commandes);
    }, [commandes]);

    // Setup Real-time WebSocket connection
    useEffect(() => {
        let reconnectTimeout: NodeJS.Timeout;
        const audio = new Audio('/notification2.mp3');

        const connectSocket = () => {
            const wsBase = process.env.NEXT_PUBLIC_WS_SERVER || 'ws://127.0.0.1:8000';
            const wilayaQuery = initialWilaya ? `&wilaya=${encodeURIComponent(initialWilaya)}` : '';
            const wsUrl = `${wsBase}/ws/confirmation/commandes/?token=${token}${wilayaQuery}`;

            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'new_commande' && data.commande) {
                        const newCmd: Order = data.commande;
                        const isAlreadyNotified = notifiedOrderIdsRef.current.has(newCmd.id);

                        // Add to state list at the top and highlight without duplicate entries
                        setCommandesList((prev) => [newCmd, ...prev.filter((c) => c.id !== newCmd.id)]);
                        setNewlyArrivedIds((prev) => Array.from(new Set([...prev, newCmd.id])));

                        if (!isAlreadyNotified) {
                            notifiedOrderIdsRef.current.add(newCmd.id);
                            setNewCount((prev) => prev + 1);

                            // Play audio chime
                            audio.play().catch(() => {});

                            // Toast notification with inspect action
                            toast.custom((t: { id: string; visible: boolean }) => (
                                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl">
                                            <MdNotificationsActive />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">Nouvelle commande #{newCmd.id}</p>
                                            <p className="text-xs text-slate-400">
                                                {newCmd.magasin_info?.name || 'Magasin'} • {newCmd.total_price} DZD
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex border-l border-slate-700 ml-3 pl-3 flex-col gap-1.5 justify-center">
                                        <button
                                            onClick={() => {
                                                toast.dismiss(t.id);
                                                setInspectingOrder(newCmd);
                                            }}
                                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1"
                                        >
                                            <MdPhone className='text-xs' />
                                            <span>Appeler</span>
                                        </button>
                                    </div>
                                </div>
                            ), { id: `toast_cmd_${newCmd.id}`, duration: 6000 });

                            // Clear highlight after 10 seconds
                            setTimeout(() => {
                                setNewlyArrivedIds((prev) => prev.filter((id) => id !== newCmd.id));
                            }, 10000);
                        }
                    } else if (data.type === 'commande_update' && data.commande) {
                        const updatedCmd: Order = data.commande;
                        setCommandesList((prev) =>
                            prev.map((c) => (c.id === updatedCmd.id ? { ...c, ...updatedCmd } : c))
                        );
                        // Also update inspecting modal order if open
                        setInspectingOrder((prev) => (prev && prev.id === updatedCmd.id ? { ...prev, ...updatedCmd } : prev));
                    }
                } catch {
                    // Ignore parse errors
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                // Auto reconnect after 3 seconds
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
    }, [token, initialWilaya]);

    const handleOrderUpdatedLocally = (updated: Order) => {
        setCommandesList((prev) =>
            prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
        );
    };

    const handleOpenStatusDialog = (e: React.MouseEvent, cmd: Order, targetStatus: string) => {
        e.stopPropagation();
        setStatusDialogData({ order: cmd, targetStatus });
    };

    const handleConfirmStatusChange = async (cmd: Order, targetStatus: string) => {
        const ok = await updateCommandeStatusByCentre({
            commande_id: cmd.id,
            status: targetStatus
        });
        if (ok) {
            setCommandesList((prev) =>
                prev.map((c) =>
                    c.id === cmd.id
                        ? { ...c, status: targetStatus as Order['status'], confirmation: true }
                        : c
                )
            );
            setStatusDialogData(null);
        }
    };

    const handleQuickDeliver = (e: React.MouseEvent, cmd: Order) => {
        e.stopPropagation();
        setConfirmingDeliveryOrder(cmd);
    };

    const handleConfirmDelivery = async (cmd: Order) => {
        const ok = await markCommandeDeliveredByCentre({ commande_id: cmd.id });
        if (ok) {
            setCommandesList((prev) =>
                prev.map((c) =>
                    c.id === cmd.id
                        ? { ...c, status: 'delivered', confirmation: true }
                        : c
                )
            );
            setConfirmingDeliveryOrder(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className='px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 flex items-center gap-1 w-fit'><MdPendingActions /> En attente</span>;
            case 'search':
                return <span className='px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center gap-1.5 w-fit shadow-xs animate-pulse'><span className='w-1.5 h-1.5 rounded-full bg-white animate-ping' /> Diffusée (3 km)</span>;
            case 'confirmed':
                return <span className='px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 flex items-center gap-1 w-fit'><MdCheckCircle /> Confirmée</span>;
            case 'in_progress':
            case 'livreur_pret_commande':
                return <span className='px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1 w-fit border border-emerald-200 dark:border-emerald-800/60'><MdDeliveryDining className='text-sm' /> En livraison</span>;
            case 'delivered':
                return <span className='px-2.5 py-1 text-xs font-bold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 flex items-center gap-1 w-fit border border-teal-200 dark:border-teal-800/60'><MdCheckCircle className='text-sm' /> Livrée</span>;
            case 'annule_par_client':
                return <span className='px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1.5 w-fit border border-rose-200 dark:border-rose-800/60'><MdCancel className='text-sm text-rose-600' /> Annulée par client</span>;
            case 'annule_par_livreur':
                return <span className='px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1.5 w-fit border border-rose-200 dark:border-rose-800/60'><MdCancel className='text-sm text-rose-600' /> Annulée par livreur</span>;
            case 'canceled':
                return <span className='px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1.5 w-fit border border-rose-200 dark:border-rose-800/60'><MdCancel className='text-sm text-rose-600' /> Annulée</span>;
            default:
                return <span className='px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-fit'>{status}</span>;
        }
    };

    return (
        <div className='py-6 px-4 sm:px-10 max-w-7xl mx-auto text-slate-900 dark:text-slate-100'>
            {/* Breadcrumb & Header */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6'>
                <div>
                    <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1'>
                        <Link href="/dashboard" className='hover:text-blue-500 font-medium'>Tableau de bord</Link>
                        <span>/</span>
                        <span className='text-slate-800 dark:text-slate-200 font-semibold'>Confirmation</span>
                        <span>/</span>
                        <span>Commandes</span>
                    </div>
                    <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3'>
                        Gestion des Commandes par Code Wilaya
                    </h1>
                </div>

                {/* Real-time Status Badge & Actions */}
                <div className='flex items-center gap-3'>
                    <Link
                        href="/dashboard/confirmation/create_commande"
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                    >
                        <span>+ Créer Commande</span>
                    </Link>

                    {newCount > 0 && (
                        <span className='px-3 py-1.5 bg-amber-500 text-white font-bold text-xs rounded-full shadow-md animate-bounce'>
                            +{newCount} nouvelle(s) commande(s)
                        </span>
                    )}
                    <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                        isConnected
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 shadow-sm'
                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                    }`}>
                        <FaWifi className={`${isConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
                        <span>{isConnected ? 'Temps Réel Connecté' : 'Reconnexion...'}</span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className='bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 mb-6 transition-colors'>
                <form method='GET' className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
                    {/* Search */}
                    <div className='relative'>
                        <FaSearch className='absolute left-3.5 top-3.5 text-slate-400' />
                        <input
                            type='text'
                            name='search'
                            defaultValue={initialSearch}
                            placeholder='ID, magasin, client, tél...'
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

                    {/* Status Filter */}
                    <div>
                        <select
                            name='status'
                            defaultValue={initialStatus}
                            className='w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white'
                        >
                            <option value="">Tous les Statuts</option>
                            <option value="pending">En attente (Pending)</option>
                            <option value="confirmed">Confirmée</option>
                            <option value="in_progress">En livraison (In progress)</option>
                            <option value="delivered">Livrée (Delivered)</option>
                            <option value="annule_par_client">Annulée par client</option>
                            <option value="annule_par_livreur">Annulée par livreur</option>
                            <option value="canceled">Annulée (Centre)</option>
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div className='relative'>
                        <MdCalendarToday className='absolute left-3.5 top-3.5 text-slate-400' />
                        <input
                            type='date'
                            name='date'
                            defaultValue={initialDate}
                            className='w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500'
                            title='Filtrer par date de commande'
                        />
                    </div>

                    {/* Submit Button */}
                    <div className='flex gap-2'>
                        <button
                            type='submit'
                            className='flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2'
                        >
                            <FaFilter /> Filtrer
                        </button>
                        {(initialSearch || initialWilaya || initialStatus || initialConfirmation || initialDate) && (
                            <Link
                                href='/dashboard/confirmation/commandes'
                                className='p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center text-sm font-semibold transition-colors'
                                title='Réinitialiser'
                            >
                                Réinit.
                            </Link>
                        )}
                    </div>
                </form>
            </div>

            {/* Table Container */}
            <div className='bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors'>
                <div className='overflow-x-auto'>
                    <table className='w-full text-left text-sm text-slate-600 dark:text-slate-300'>
                        <thead className='bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800'>
                            <tr>
                                <th className='py-3.5 px-4'>ID & Date</th>
                                <th className='py-3.5 px-4'>Magasin & Contact</th>
                                <th className='py-3.5 px-4'>Client & Wilaya</th>
                                <th className='py-3.5 px-4'>Livreur Assigné</th>
                                <th className='py-3.5 px-4'>Montant</th>
                                <th className='py-3.5 px-4'>Statut</th>
                                <th className='py-3.5 px-4 text-center'>Actions</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100 dark:divide-slate-800/70'>
                            {commandesList.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='text-center py-12 text-slate-400'>
                                        Aucune commande trouvée selon ces critères.
                                    </td>
                                </tr>
                            ) : (
                                commandesList.map((cmd) => {
                                    const isNewlyArrived = newlyArrivedIds.includes(cmd.id);
                                    const magPhone = cmd.magasin_info?.phone || cmd.magasin_info?.contact || '';

                                    return (
                                        <tr
                                            key={cmd.id}
                                            className={`transition-all duration-500 cursor-pointer ${
                                                isNewlyArrived
                                                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600 animate-pulse'
                                                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                                            }`}
                                            onClick={() => setInspectingOrder(cmd)}
                                        >
                                            <td className='px-5 py-4 font-bold text-slate-900 dark:text-white'>
                                                <div className='flex items-center gap-2'>
                                                    <span>#{cmd.id}</span>
                                                    {isNewlyArrived && (
                                                        <span className='px-2 py-0.5 bg-blue-600 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider'>
                                                            Nouveau
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='px-5 py-4'>
                                                <p className='font-semibold text-slate-900 dark:text-slate-100'>{cmd.magasin_info?.name || 'N/A'}</p>
                                                <p className='text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5'>
                                                    <MdPhone className='text-xs' />
                                                    <span>{magPhone || 'Tél non renseigné'}</span>
                                                </p>
                                            </td>
                                            <td className='px-5 py-4'>
                                                <p className='font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap'>
                                                    <span>{cmd.client_info?.first_name || cmd.client_info?.username || 'Client'}</span>
                                                    <span className='text-[11px] font-bold text-emerald-600 dark:text-emerald-400'>
                                                        ({cmd.client_info?.nbr_commandes ?? cmd.client_info?.delivered_orders_count ?? cmd.client_delivered_count ?? 0} livrée{(cmd.client_info?.nbr_commandes ?? cmd.client_info?.delivered_orders_count ?? cmd.client_delivered_count ?? 0) > 1 ? "s" : ""})
                                                    </span>
                                                </p>
                                                <p className='text-xs text-slate-500 dark:text-slate-400'>{cmd.client_info?.phone_number_1 || 'N/A'}</p>
                                            </td>
                                            <td className='px-5 py-4'>
                                                <span className='px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-xs'>
                                                    {cmd.distination || cmd.client_info?.wilaya_code || 'N/A'}
                                                </span>
                                            </td>
                                            <td className='px-5 py-4'>
                                                {cmd.livreur ? (
                                                    <div className='flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium flex-wrap'>
                                                        <div className='w-2 h-2 rounded-full bg-green-500 shrink-0' />
                                                        <span>{cmd.livreur.partenneur?.user?.first_name || cmd.livreur.user?.first_name || cmd.livreur.partenneur?.user?.username || cmd.livreur.user?.username || `Livreur #${cmd.livreur.id}`}</span>
                                                        <span className='text-[10.5px] font-bold text-slate-500 dark:text-slate-400'>
                                                            ({(cmd.livreur as any).partenneur?.user?.nbr_commandes ?? (cmd.livreur as any).user?.nbr_commandes ?? cmd.livreur.nbr_commandes ?? cmd.livreur.delivered_orders_count ?? (cmd.livreur as any).partenneur?.user?.delivered_orders_count ?? cmd.livreur_delivered_count ?? 0} livrée{((cmd.livreur as any).partenneur?.user?.nbr_commandes ?? (cmd.livreur as any).user?.nbr_commandes ?? cmd.livreur.nbr_commandes ?? cmd.livreur.delivered_orders_count ?? cmd.livreur_delivered_count ?? 0) > 1 ? "s" : ""})
                                                        </span>
                                                    </div>
                                                ) : cmd.status === 'search' ? (
                                                    <span className='text-xs text-purple-600 dark:text-purple-400 font-semibold px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 rounded-md border border-purple-200/50 dark:border-purple-800/40 flex items-center gap-1 animate-pulse'>
                                                        <span className='w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping' />
                                                        Diffusée (Recherche livreur)
                                                    </span>
                                                ) : (
                                                    <span className='text-xs text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 rounded-md border border-amber-200/50 dark:border-amber-800/40'>
                                                        Non assigné
                                                    </span>
                                                )}
                                            </td>
                                            <td className='px-5 py-4 font-bold text-emerald-600'>
                                                {cmd.total_price} DZD
                                            </td>
                                            <td className='px-5 py-4'>
                                                {getStatusBadge(cmd.status)}
                                            </td>
                                            <td className='px-5 py-4 text-right' onClick={(e) => e.stopPropagation()}>
                                                <div className='flex items-center justify-end gap-2'>
                                                    {/* Details & Call Button */}
                                                    <button
                                                        onClick={() => setInspectingOrder(cmd)}
                                                        className='px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1'
                                                        title='Voir détails, articles & appeler'
                                                    >
                                                        <MdVisibility className='text-sm' />
                                                        <span>Détails</span>
                                                    </button>

                                                    {/* If already delivered, allow reverting to En Livraison */}
                                                    {cmd.status === 'delivered' && (
                                                        <button
                                                            onClick={(e) => handleOpenStatusDialog(e, cmd, 'in_progress')}
                                                            className='px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1'
                                                            title='Repasser en livraison (livreur_pret_commande)'
                                                        >
                                                            <MdDeliveryDining className='text-sm' />
                                                            <span>En Livraison</span>
                                                        </button>
                                                    )}

                                                    {/* If not delivered and not in progress, allow setting to En Livraison */}
                                                    {cmd.status !== 'delivered' && cmd.status !== 'in_progress' && (cmd.status as string) !== 'livreur_pret_commande' && cmd.status !== 'canceled' && cmd.status !== 'annule_par_client' && cmd.status !== 'annule_par_livreur' && (
                                                        <button
                                                            onClick={(e) => handleOpenStatusDialog(e, cmd, 'in_progress')}
                                                            className='px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1'
                                                            title='Passer en livraison (livreur_pret_commande)'
                                                        >
                                                            <MdDeliveryDining className='text-sm' />
                                                            <span>En Livraison</span>
                                                        </button>
                                                    )}

                                                    {/* Quick Mark Delivered Button */}
                                                    {cmd.status !== 'delivered' && cmd.status !== 'canceled' && cmd.status !== 'annule_par_client' && cmd.status !== 'annule_par_livreur' && (
                                                        <button
                                                            onClick={(e) => handleOpenStatusDialog(e, cmd, 'delivered')}
                                                            className='px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1'
                                                            title='Marquer directement comme livrée'
                                                        >
                                                            <MdDoneAll className='text-sm' />
                                                            <span>Livrée</span>
                                                        </button>
                                                    )}

                                                    {/* Dispatch Button */}
                                                    {cmd.status !== 'delivered' && cmd.status !== 'canceled' && cmd.status !== 'annule_par_client' && cmd.status !== 'annule_par_livreur' && (
                                                        <button
                                                            onClick={() => setDispatchingOrder(cmd)}
                                                            className='px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1'
                                                            title='Assigner ou diffuser'
                                                        >
                                                            <MdDeliveryDining className='text-sm' />
                                                            <span>{cmd.livreur ? 'Changer' : 'Assigner'}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Details & Store Call Modal */}
            {inspectingOrder && (
                <OrderDetailsModal
                    order={inspectingOrder}
                    onClose={() => setInspectingOrder(null)}
                    onOpenDispatch={(orderToDispatch) => setDispatchingOrder(orderToDispatch)}
                    onOrderUpdated={handleOrderUpdatedLocally}
                />
            )}

            {/* Dispatch & Assign Modal */}
            {dispatchingOrder && (
                <DispatchModal
                    order={dispatchingOrder}
                    onClose={() => setDispatchingOrder(null)}
                />
            )}

            {/* Custom Confirm Status Dialog */}
            <ConfirmDeliveryDialog
                isOpen={!!statusDialogData}
                order={statusDialogData?.order || null}
                targetStatus={statusDialogData?.targetStatus || 'delivered'}
                onClose={() => setStatusDialogData(null)}
                onConfirm={(cmd, status) => handleConfirmStatusChange(cmd, status)}
            />
        </div>
    );
}
