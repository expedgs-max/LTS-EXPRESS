"use client"

import React, { useEffect, useState } from 'react';
import { 
    MdClose, 
    MdDeliveryDining,
    MdLocalShipping, 
    MdCheckCircle, 
    MdSearch, 
    MdRefresh, 
    MdNearMe, 
    MdSensors, 
    MdLocationOn
} from 'react-icons/md';
import { ConfirmationLivreur, assignLivreurToOrder, broadcastCommandeByCentre, getConfirmationLivreurs } from '@/lib/confirmation_action';
import { useRouter } from 'next/navigation';
import { TbLoader3 } from 'react-icons/tb';

interface DispatchModalProps {
    order: Order;
    token?: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function DispatchModal({ order, token = "", onClose, onSuccess }: DispatchModalProps) {
    const router = useRouter();
    const [livreurs, setLivreurs] = useState<ConfirmationLivreur[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [broadcasting, setBroadcasting] = useState<boolean>(false);
    const [selectedLivreurId, setSelectedLivreurId] = useState<number | null>(order.livreur?.id || null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true);
    const [onlyInRadius, setOnlyInRadius] = useState<boolean>(false);

    const getClientToken = () => {
        if (token) return token;
        if (typeof document !== 'undefined') {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; access_token=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
        }
        return '';
    };

    const fetchLivreurs = async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        const res = await getConfirmationLivreurs({
            search: searchTerm,
            commande_id: order.id,
            page_size: '100'
        });
        if (res) {
            setLivreurs(res.result);
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchLivreurs();
    }, [searchTerm]);

    // WebSocket real-time driver online status listener
    useEffect(() => {
        let ws: WebSocket | null = null;
        let reconnectTimeout: NodeJS.Timeout;

        const connectSocket = () => {
            const activeToken = getClientToken();
            const wsBase = process.env.NEXT_PUBLIC_WS_SERVER || 'ws://127.0.0.1:8000';
            const wsUrl = `${wsBase}/ws/confirmation/commandes/?token=${activeToken}`;

            ws = new WebSocket(wsUrl);

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'livreur_status' && data.livreur_id) {
                        const { livreur_id, is_available } = data;
                        setLivreurs((prev) => {
                            const exists = prev.some((l) => l.id === livreur_id);
                            if (exists) {
                                return prev.map((l) =>
                                    l.id === livreur_id
                                        ? { ...l, is_available: Boolean(is_available) }
                                        : l
                                );
                            } else if (is_available) {
                                return [
                                    {
                                        id: livreur_id,
                                        is_available: true,
                                        wilaya: data.wilaya || '',
                                        active_orders_count: 0,
                                        user: {
                                            id: livreur_id,
                                            username: data.username || '',
                                            first_name: data.first_name || '',
                                            last_name: data.last_name || '',
                                            phone: data.phone || '',
                                            rating: 5.0
                                        },
                                        magasin_name: null
                                    },
                                    ...prev
                                ];
                            }
                            return prev;
                        });
                    }
                } catch {}
            };

            ws.onclose = () => {
                reconnectTimeout = setTimeout(connectSocket, 3000);
            };
        };

        connectSocket();

        return () => {
            clearTimeout(reconnectTimeout);
            if (ws) ws.close();
        };
    }, []);

    // Filter displayed livreurs based on availability checkbox, radius and search
    const displayedLivreurs = livreurs.filter((liv) => {
        if (onlyAvailable && !liv.is_available) {
            return false;
        }
        if (onlyInRadius && liv.distance_km !== null && liv.distance_km !== undefined && liv.distance_km > 3.0) {
            return false;
        }
        return true;
    });

    const inRadiusCount = livreurs.filter(l => l.is_available && (l.in_zone_3km || l.distance_km === null || (l.distance_km !== undefined && l.distance_km <= 3.0))).length;

    const handleBroadcastTo3Km = async () => {
        setBroadcasting(true);
        const ok = await broadcastCommandeByCentre({
            commande_id: order.id,
            radius_km: 3.0
        });
        setBroadcasting(false);
        if (ok) {
            router.refresh();
            if (onSuccess) onSuccess();
            onClose();
        }
    };

    const handleAssign = async () => {
        if (!selectedLivreurId) return;
        setSubmitting(true);
        const ok = await assignLivreurToOrder({
            commande_id: order.id,
            livreur_id: selectedLivreurId,
            status: 'confirmed'
        });
        setSubmitting(false);
        if (ok) {
            router.refresh();
            if (onSuccess) onSuccess();
            onClose();
        }
    };

    return (
        <div className='fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900 bg-opacity-60 backdrop-blur-sm animate-fadeIn'>
            <div className='bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 relative border border-slate-100 flex flex-col max-h-[92vh]'>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className='absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors'
                >
                    <MdClose className='text-2xl' />
                </button>

                {/* Header */}
                <div className='flex items-center gap-3 pb-4 border-b border-slate-100'>
                    <div className='p-3 bg-blue-50 text-blue-600 rounded-2xl text-2xl'>
                        <MdDeliveryDining />
                    </div>
                    <div>
                        <h2 className='text-xl font-bold text-slate-800'>
                            Diffuser / Assigner la Commande #{order.id}
                        </h2>
                        <p className='text-xs text-slate-500 flex items-center gap-1.5 flex-wrap'>
                            <span>Magasin : <strong className='text-slate-700'>{order.magasin_info?.name || 'N/A'}</strong></span>
                            <span>• Total : <strong className='text-green-600'>{order.total_price} DZD</strong></span>
                            {order.created_at && (
                                <span>• Date : <strong className='text-slate-700'>{new Date(order.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
                            )}
                        </p>
                    </div>
                </div>

                {/* 3KM CIRCLE BROADCAST HERO CARD */}
                <div className='my-3 p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
                    <div className='flex items-start gap-3'>
                        <div className='p-2.5 bg-white/20 rounded-xl backdrop-blur-sm text-2xl flex-shrink-0'>
                            <MdSensors className='animate-pulse' />
                        </div>
                        <div>
                            <div className='flex items-center gap-2'>
                                <h3 className='font-bold text-sm text-white'>
                                    Diffusion dans la Zone (Cercle 3 km)
                                </h3>
                                <span className='px-2 py-0.5 bg-white/20 text-white text-[10px] font-extrabold rounded-full'>
                                    Rayon 3 km
                                </span>
                            </div>
                            <p className='text-xs text-blue-100 mt-0.5'>
                                Diffuse à tous les livreurs connectés situés dans un cercle de 3 km autour de <span className='font-semibold text-white'>{order.magasin_info?.name || 'ce restaurant'}</span>. Le premier qui accepte prend la commande.
                            </p>
                        </div>
                    </div>

                    <button
                        type='button'
                        onClick={handleBroadcastTo3Km}
                        disabled={broadcasting || submitting}
                        className='w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-700 disabled:bg-white/60 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 flex-shrink-0'
                    >
                        {broadcasting ? (
                            <>
                                <TbLoader3 className='animate-spin text-base' />
                                <span>Diffusion en cours...</span>
                            </>
                        ) : (
                            <>
                                <MdNearMe className='text-base' />
                                <span>Diffuser à tous (3 km)</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Manual Selection Separator */}
                <div className='flex items-center gap-3 my-1'>
                    <div className='flex-1 h-px bg-slate-200'></div>
                    <span className='text-[11px] font-bold text-slate-400 uppercase tracking-wider'>
                        OU Assigner manuellement à un livreur
                    </span>
                    <div className='flex-1 h-px bg-slate-200'></div>
                </div>

                {/* Filters & Refresh Toolbar */}
                <div className='py-2 flex flex-col sm:flex-row gap-2 justify-between items-center'>
                    <div className='flex items-center gap-2 w-full sm:w-auto flex-1'>
                        <div className='relative flex-1 max-w-sm'>
                            <MdSearch className='absolute left-3 top-2.5 text-slate-400 text-lg' />
                            <input
                                type='text'
                                placeholder='Rechercher livreur...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        </div>
                        {/* Refresh Button */}
                        <button
                            type='button'
                            onClick={() => fetchLivreurs(true)}
                            disabled={loading || refreshing}
                            className='p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition-all border border-slate-200 hover:border-blue-200 flex items-center justify-center'
                            title='Actualiser / Rafraîchir les livreurs'
                        >
                            <MdRefresh className={`text-base ${refreshing || loading ? 'animate-spin text-blue-600' : ''}`} />
                        </button>
                    </div>

                    <div className='flex items-center gap-3 flex-wrap'>
                        <label className='flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600 select-none flex-shrink-0'>
                            <input
                                type='checkbox'
                                checked={onlyAvailable}
                                onChange={(e) => setOnlyAvailable(e.target.checked)}
                                className='rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5'
                            />
                            En ligne ({livreurs.filter(l => l.is_available).length})
                        </label>
                        <label className='flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600 select-none flex-shrink-0'>
                            <input
                                type='checkbox'
                                checked={onlyInRadius}
                                onChange={(e) => setOnlyInRadius(e.target.checked)}
                                className='rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5'
                            />
                            Zone 3 km ({inRadiusCount})
                        </label>
                    </div>
                </div>

                {/* Livreurs List */}
                <div className='flex-1 overflow-y-auto py-2 space-y-2 pr-1'>
                    {loading ? (
                        <div className='flex flex-col items-center justify-center py-10 text-slate-400 gap-2'>
                            <TbLoader3 className='animate-spin text-3xl text-blue-500' />
                            <span className='text-xs'>Chargement des livreurs...</span>
                        </div>
                    ) : displayedLivreurs.length === 0 ? (
                        <div className='text-center py-8 text-slate-400'>
                            <p className='font-medium text-sm'>Aucun livreur disponible actuellement</p>
                            <p className='text-xs text-slate-400 mt-1'>
                                {onlyInRadius
                                    ? "Aucun livreur trouvé dans le cercle de 3 km. Décochez le filtre pour voir les autres livreurs."
                                    : onlyAvailable
                                    ? "Aucun livreur n'est actuellement connecté. Décochez 'En ligne' pour voir tous les livreurs."
                                    : "Aucun livreur ne correspond à vos critères de recherche."}
                            </p>
                        </div>
                    ) : (
                        displayedLivreurs.map((liv) => {
                            const isSelected = selectedLivreurId === liv.id;
                            const is3km = liv.in_zone_3km || (liv.distance_km !== null && liv.distance_km !== undefined && liv.distance_km <= 3.0);
                            return (
                                <div
                                    key={liv.id}
                                    onClick={() => setSelectedLivreurId(liv.id)}
                                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                        isSelected
                                            ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                                            : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className='flex items-center gap-3'>
                                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${liv.is_available ? 'bg-green-500 ring-4 ring-green-100' : 'bg-slate-300'}`} />
                                        <div>
                                            <p className='text-sm font-semibold text-slate-800 flex items-center gap-2 flex-wrap'>
                                                {liv.user?.first_name 
                                                    ? `${liv.user.first_name} ${liv.user.last_name || ''}` 
                                                    : liv.user?.username || `Livreur #${liv.id}`}
                                                <span className='text-xs font-normal text-slate-400'>
                                                    ({liv.wilaya || 'Wilaya N/A'})
                                                </span>
                                                {liv.distance_km !== null && liv.distance_km !== undefined && (
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 ${
                                                        is3km ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        <MdLocationOn /> {liv.distance_km} km du magasin
                                                    </span>
                                                )}
                                            </p>
                                            <p className='text-xs text-slate-500'>
                                                Tél: {liv.user?.phone || 'N/A'} • En cours : <span className='font-semibold text-slate-700'>{liv.active_orders_count} commande(s)</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className='flex items-center gap-2 flex-shrink-0'>
                                        {/* Battery Badge */}
                                        {(() => {
                                            const batVal = liv.battery !== undefined && liv.battery !== null ? liv.battery : (liv as any).battery_level;
                                            if (batVal === undefined || batVal === null || isNaN(batVal)) return null;
                                            const bNum = Math.min(Math.max(Math.round(batVal), 0), 100);
                                            return (
                                                <span 
                                                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border flex items-center gap-1 ${
                                                        bNum <= 20
                                                            ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                                                            : bNum <= 50
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    }`}
                                                    title={`Batterie: ${bNum}%`}
                                                >
                                                    <span>{bNum <= 20 ? '🪫' : '🔋'}</span>
                                                    <span>{bNum}%</span>
                                                </span>
                                            );
                                        })()}

                                        {liv.is_available ? (
                                            <span className='px-2 py-0.5 text-[11px] font-bold bg-green-100 text-green-700 rounded-full flex items-center gap-1'>
                                                <span className='w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse' />
                                                En ligne
                                            </span>
                                        ) : (
                                            <span className='px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-500 rounded-full'>
                                                Offline
                                            </span>
                                        )}
                                        {isSelected ? (
                                            <MdCheckCircle className='text-blue-600 text-xl' />
                                        ) : (
                                            <div className='w-5 h-5 rounded-full border-2 border-slate-300' />
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Action */}
                <div className='pt-3 mt-1 border-t border-slate-100 flex items-center justify-between gap-3'>
                    <button
                        onClick={onClose}
                        disabled={submitting || broadcasting}
                        className='px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors'
                    >
                        Fermer
                    </button>

                    <button
                        onClick={handleAssign}
                        disabled={!selectedLivreurId || submitting || broadcasting}
                        className='px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-2'
                    >
                        {submitting ? (
                            <>
                                <TbLoader3 className='animate-spin text-lg' />
                                <span>Assignation en cours...</span>
                            </>
                        ) : (
                            <>
                                <MdDeliveryDining className='text-lg' />
                                <span>Assigner à ce livreur</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
