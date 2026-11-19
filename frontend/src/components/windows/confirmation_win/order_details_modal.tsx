"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { 
    MdClose, 
    MdPhone, 
    MdOutlineStorefront, 
    MdPerson, 
    MdLocationOn, 
    MdCheckCircle, 
    MdDeliveryDining, 
    MdReceiptLong, 
    MdContentCopy,
    MdDone,
    MdCancel,
    MdWarningAmber,
    MdTimeline,
    MdRestaurantMenu
} from 'react-icons/md';
import { getImageUrl } from '@/lib/tools/tools';
import { confirmCommandeByCentre, cancelCommandeByCentre, markCommandeDeliveredByCentre, updateCommandeStatusByCentre, updateCommandeTripTimeByCentre } from '@/lib/confirmation_action';
import { TbLoader3 } from 'react-icons/tb';
import ConfirmDeliveryDialog from './confirm_dialog';
import DriverTimelineDialog from './driver_timeline_dialog';

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
    onOpenDispatch: (order: Order) => void;
    onOrderUpdated?: (updatedOrder: Order) => void;
}

const CANCEL_REASONS = [
    "Magasin fermé ou injoignable",
    "Rupture de stock chez le magasin",
    "Client injoignable au téléphone",
    "Le client a demandé l'annulation",
    "Adresse ou Wilaya hors zone de livraison",
    "Délai d'attente trop long chez le magasin",
];

export default function OrderDetailsModal({
    order,
    onClose,
    onOpenDispatch,
    onOrderUpdated
}: OrderDetailsModalProps) {
    const [confirming, setConfirming] = useState<boolean>(false);
    const [delivering, setDelivering] = useState<boolean>(false);
    const [canceling, setCanceling] = useState<boolean>(false);
    const [showCancelForm, setShowCancelForm] = useState<boolean>(false);
    const [cancelReason, setCancelReason] = useState<string>('');
    const [showConfirmDeliveryDialog, setShowConfirmDeliveryDialog] = useState<boolean>(false);
    const [targetDialogStatus, setTargetDialogStatus] = useState<string>('delivered');
    const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
    const [isEditingTripTime, setIsEditingTripTime] = useState<boolean>(false);
    const [tripTimeVal, setTripTimeVal] = useState<string>(order.trip_time || '');
    const [showDriverTimeline, setShowDriverTimeline] = useState<boolean>(false);

    const magPhone = 
        order.magasin_info?.phone || 
        order.magasin_info?.contact || 
        order.magasin_info?.owner?.phone_number_1 || 
        order.magasin_info?.owner?.phone_number_2 || 
        '';

    const clientPhone = 
        order.client_info?.phone_number_1 || 
        order.client_info?.phone_number_2 || 
        '';

    const handleCopy = (text: string, type: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedPhone(type);
        setTimeout(() => setCopiedPhone(null), 2000);
    };

    const handleConfirmOrder = async () => {
        setConfirming(true);
        const ok = await confirmCommandeByCentre({ commande_id: order.id });
        setConfirming(false);
        if (ok) {
            const updated: Order = {
                ...order,
                confirmation: true,
                status: order.status === 'pending' ? 'confirmed' : order.status
            };
            if (onOrderUpdated) {
                onOrderUpdated(updated);
            }
            onClose();
        }
    };

    const handleOpenStatusModal = (status: string) => {
        setTargetDialogStatus(status);
        setShowConfirmDeliveryDialog(true);
    };

    const handleConfirmStatusModal = async (targetOrder: Order, targetStatus: string) => {
        setDelivering(true);
        const ok = await updateCommandeStatusByCentre({ 
            commande_id: targetOrder.id,
            status: targetStatus
        });
        setDelivering(false);
        if (ok) {
            const updated: Order = {
                ...targetOrder,
                status: targetStatus as Order['status'],
                confirmation: true
            };
            if (onOrderUpdated) {
                onOrderUpdated(updated);
            }
            setShowConfirmDeliveryDialog(false);
            onClose();
        }
    };

    const handleCancelOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancelReason.trim()) {
            return;
        }

        setCanceling(true);
        const ok = await cancelCommandeByCentre({
            commande_id: order.id,
            reason: cancelReason.trim()
        });
        setCanceling(false);

        if (ok) {
            const updated: Order = {
                ...order,
                status: 'canceled',
            };
            if (onOrderUpdated) {
                onOrderUpdated(updated);
            }
            onClose();
        }
    };

    const articles = order.articles_commandes || [];
    const isCanceled = order.status === 'canceled' || order.status === 'annule_par_client' || order.status === 'annule_par_livreur';

    return (
        <div className='fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn'>
            <div className='bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 relative border border-slate-100 flex flex-col max-h-[92vh]'>
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className='absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors'
                >
                    <MdClose className='text-2xl' />
                </button>

                {/* Modal Header */}
                <div className='flex items-center gap-3 pb-5 border-b border-slate-100'>
                    <div className={`p-3 rounded-2xl text-2xl ${
                        isCanceled ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                        {isCanceled ? <MdCancel /> : <MdReceiptLong />}
                    </div>
                    <div>
                        <div className='flex items-center gap-2 flex-wrap'>
                            <h2 className='text-2xl font-extrabold text-slate-900'>
                                Commande #{order.id}
                            </h2>
                            {order.status === 'annule_par_client' ? (
                                <span className='px-2.5 py-0.5 bg-rose-100 text-rose-800 font-bold text-xs rounded-full flex items-center gap-1 border border-rose-200'>
                                    <MdCancel className='text-sm text-rose-600' /> Annulée par client
                                </span>
                            ) : order.status === 'annule_par_livreur' ? (
                                <span className='px-2.5 py-0.5 bg-rose-100 text-rose-800 font-bold text-xs rounded-full flex items-center gap-1 border border-rose-200'>
                                    <MdCancel className='text-sm text-rose-600' /> Annulée par livreur
                                </span>
                            ) : isCanceled ? (
                                <span className='px-2.5 py-0.5 bg-rose-100 text-rose-800 font-bold text-xs rounded-full flex items-center gap-1 border border-rose-200'>
                                    <MdCancel className='text-sm text-rose-600' /> Annulée
                                </span>
                            ) : order.status === 'ready' ? (
                                <span className='px-2.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-xs rounded-full flex items-center gap-1 border border-amber-300'>
                                    <MdRestaurantMenu className='text-sm text-amber-600' /> Pris à livrer (Ready)
                                </span>
                            ) : order.status === 'in_progress' || (order.status as string) === 'livreur_pret_commande' ? (
                                <span className='px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full flex items-center gap-1 border border-emerald-200'>
                                    <MdDeliveryDining className='text-sm text-emerald-600' /> En livraison
                                </span>
                            ) : order.status === 'delivered' ? (
                                <span className='px-2.5 py-0.5 bg-teal-100 text-teal-800 font-bold text-xs rounded-full flex items-center gap-1 border border-teal-200'>
                                    <MdCheckCircle className='text-sm text-teal-600' /> Livrée
                                </span>
                            ) : order.status === 'search' ? (
                                <span className='px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-bold text-xs rounded-full flex items-center gap-1 animate-pulse'>
                                    <span className='w-2 h-2 rounded-full bg-indigo-600 animate-ping' />
                                    Diffusée aux livreurs (Zone 3 km)
                                </span>
                            ) : order.confirmation ? (
                                <span className='px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-full flex items-center gap-1 border border-blue-200'>
                                    <MdCheckCircle className='text-sm text-blue-600' /> Confirmée
                                </span>
                            ) : (
                                <span className='px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold text-xs rounded-full'>
                                    En attente de confirmation
                                </span>
                            )}
                        </div>
                        <p className='text-xs text-slate-400 mt-0.5'>
                            Créée le : {order.created_at ? new Date(order.created_at).toLocaleString('fr-FR') : 'Date inconnue'}
                        </p>
                    </div>
                </div>

                {/* Cancellation Form View (Inline) */}
                {showCancelForm ? (
                    <div className='flex-1 overflow-y-auto py-5 space-y-5 animate-fadeIn'>
                        <div className='p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3'>
                            <MdWarningAmber className='text-rose-600 text-2xl flex-shrink-0 mt-0.5' />
                            <div>
                                <h3 className='text-sm font-bold text-rose-900'>
                                    Annulation de la Commande #{order.id}
                                </h3>
                                <p className='text-xs text-rose-700 mt-0.5'>
                                    Veuillez indiquer le motif exact de l&apos;annulation. Cette raison sera enregistrée dans l&apos;historique d&apos;audit et la commande sera immédiatement clôturée.
                                </p>
                            </div>
                        </div>

                        {/* Quick Selection Buttons */}
                        <div>
                            <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2'>
                                Motifs fréquents :
                            </label>
                            <div className='flex flex-wrap gap-2'>
                                {CANCEL_REASONS.map((r, idx) => (
                                    <button
                                        key={idx}
                                        type='button'
                                        onClick={() => setCancelReason(r)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                            cancelReason === r
                                                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Reason Textarea */}
                        <div>
                            <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2'>
                                Motif / Raison d&apos;annulation détaillée : <span className='text-rose-600'>*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Expliquez la raison (ex: Le magasin n'a plus ce plat disponible / Le client n'a pas répondu après 3 appels)..."
                                className='w-full p-3.5 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-rose-500'
                                required
                            />
                        </div>

                        {/* Actions for Cancellation Form */}
                        <div className='flex items-center justify-end gap-3 pt-3 border-t border-slate-100'>
                            <button
                                type='button'
                                onClick={() => setShowCancelForm(false)}
                                className='px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors'
                            >
                                Retour aux détails
                            </button>
                            <button
                                type='button'
                                onClick={handleCancelOrder}
                                disabled={canceling || !cancelReason.trim()}
                                className='px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2'
                            >
                                {canceling ? (
                                    <>
                                        <TbLoader3 className='animate-spin text-lg' />
                                        <span>Annulation en cours...</span>
                                    </>
                                ) : (
                                    <>
                                        <MdCancel className='text-lg' />
                                        <span>Confirmer l&apos;Annulation</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Normal Detailed View */
                    <div className='flex-1 overflow-y-auto py-5 space-y-6 pr-1'>

                        {/* Magasin & Client Contact Cards */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>

                            {/* Magasin Call & Details Card */}
                            <div className='p-5 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-2xl border border-amber-200/60 flex flex-col justify-between'>
                                <div>
                                    <div className='flex items-center justify-between pb-3'>
                                        <div className='flex items-center gap-2 text-amber-700 font-bold text-sm uppercase tracking-wider'>
                                            <MdOutlineStorefront className='text-lg' />
                                            <span>Magasin / Restaurant</span>
                                        </div>
                                        {order.magasin_info?.EtatOuverture ? (
                                            <span className='px-2 py-0.5 bg-green-100 text-green-700 text-[11px] font-bold rounded-full'>
                                                Ouvert
                                            </span>
                                        ) : (
                                            <span className='px-2 py-0.5 bg-rose-100 text-rose-700 text-[11px] font-bold rounded-full'>
                                                Fermé
                                            </span>
                                        )}
                                    </div>

                                    <div className='space-y-1.5'>
                                        <p className='text-base font-extrabold text-slate-900'>
                                            {order.magasin_info?.name || 'Magasin'}
                                        </p>
                                        <p className='text-xs text-slate-500 flex items-center gap-1'>
                                            <MdLocationOn className='text-slate-400 text-sm flex-shrink-0' />
                                            <span>{order.magasin_info?.adresse || order.magasin_info?.address || 'Adresse non spécifiée'}</span>
                                        </p>
                                        {order.magasin_info?.owner_name && (
                                            <p className='text-xs text-slate-600'>
                                                Gérant : <span className='font-semibold text-slate-800'>{order.magasin_info.owner_name}</span>
                                            </p>
                                        )}
                                        <div className='pt-1.5 flex items-center gap-2 text-xs'>
                                            <span className='font-semibold text-slate-600'>Prise au restaurant :</span>
                                            {isEditingTripTime ? (
                                                <div className='flex items-center gap-1'>
                                                    <input
                                                        type='text'
                                                        value={tripTimeVal}
                                                        onChange={(e) => setTripTimeVal(e.target.value)}
                                                        placeholder='ex: 23:00 ou 15 min'
                                                        className='px-2 py-0.5 border border-amber-300 rounded text-xs font-bold w-24 outline-none'
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={async () => {
                                                            if (!tripTimeVal.trim()) return;
                                                            const res = await updateCommandeTripTimeByCentre({ 
                                                                commande_id: order.id, 
                                                                trip_time: tripTimeVal.trim(),
                                                                status: order.status || "confirmed"
                                                            });
                                                            if (res?.success) {
                                                                order.trip_time = tripTimeVal.trim();
                                                                if (onOrderUpdated) onOrderUpdated({ ...order, trip_time: tripTimeVal.trim() });
                                                                setIsEditingTripTime(false);
                                                            }
                                                        }}
                                                        className='px-2 py-0.5 bg-amber-600 text-white rounded text-[11px] font-bold'
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={() => setIsEditingTripTime(false)}
                                                        className='px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[11px]'
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setTripTimeVal(order.trip_time || '');
                                                        setIsEditingTripTime(true);
                                                    }}
                                                    className='px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold rounded-lg text-xs flex items-center gap-1 transition-colors'
                                                    title='Modifier le temps de prise au restaurant pour le livreur'
                                                >
                                                    <span>{order.trip_time || 'Définir heure (ex: 23:00)'}</span>
                                                    <span className='text-[10px] text-amber-700'>✏️</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Call Magasin Action */}
                                <div className='mt-4 pt-3 border-t border-amber-200/50 flex items-center justify-between gap-2'>
                                    <div className='flex items-center gap-1.5'>
                                        <span className='text-xs font-bold text-slate-800'>
                                            {magPhone || 'Non renseigné'}
                                        </span>
                                        {magPhone && (
                                            <button
                                                onClick={() => handleCopy(magPhone, 'mag')}
                                                className='p-1 text-slate-400 hover:text-slate-700 rounded transition-colors'
                                                title='Copier le numéro'
                                            >
                                                {copiedPhone === 'mag' ? <MdDone className='text-green-600' /> : <MdContentCopy className='text-xs' />}
                                            </button>
                                        )}
                                    </div>
                                    {magPhone && (
                                        <a
                                            href={`tel:${magPhone}`}
                                            className='px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5'
                                        >
                                            <MdPhone className='text-sm' />
                                            <span>Appeler Magasin</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Client Call & Details Card */}
                            <div className='p-5 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-2xl border border-blue-200/60 flex flex-col justify-between'>
                                <div>
                                    <div className='flex items-center gap-2 text-blue-700 font-bold text-sm uppercase tracking-wider pb-3'>
                                        <MdPerson className='text-lg' />
                                        <span>Client & Destination</span>
                                    </div>

                                    <div className='space-y-1.5'>
                                        <p className='text-base font-extrabold text-slate-900 flex items-center gap-2 flex-wrap'>
                                            <span>
                                                {order.client_info?.first_name 
                                                    ? `${order.client_info.first_name} ${order.client_info.last_name || ''}`
                                                    : order.client_info?.username || 'Client'}
                                            </span>
                                            <span className='text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60'>
                                                ({order.client_info?.nbr_commandes ?? order.client_info?.delivered_orders_count ?? order.client_delivered_count ?? 0} livrée{(order.client_info?.nbr_commandes ?? order.client_info?.delivered_orders_count ?? order.client_delivered_count ?? 0) > 1 ? "s" : ""})
                                            </span>
                                        </p>
                                        <p className='text-xs text-slate-500 flex items-center gap-1'>
                                            <MdLocationOn className='text-slate-400 text-sm flex-shrink-0' />
                                            <span>Destination : <strong className='text-slate-700'>{order.distination || order.client_info?.wilaya_code || 'N/A'}</strong></span>
                                        </p>
                                        {order.client_info?.wilaya && (
                                            <p className='text-xs text-slate-500'>
                                                Wilaya : <span className='font-medium text-slate-700'>{order.client_info.wilaya}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Call Client Action */}
                                <div className='mt-4 pt-3 border-t border-blue-200/50 flex items-center justify-between gap-2'>
                                    <div className='flex items-center gap-1.5'>
                                        <span className='text-xs font-bold text-slate-800'>
                                            {clientPhone || 'Non renseigné'}
                                        </span>
                                        {clientPhone && (
                                            <button
                                                onClick={() => handleCopy(clientPhone, 'client')}
                                                className='p-1 text-slate-400 hover:text-slate-700 rounded transition-colors'
                                                title='Copier le numéro'
                                            >
                                                {copiedPhone === 'client' ? <MdDone className='text-green-600' /> : <MdContentCopy className='text-xs' />}
                                            </button>
                                        )}
                                    </div>
                                    {clientPhone && (
                                        <a
                                            href={`tel:${clientPhone}`}
                                            className='px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5'
                                        >
                                            <MdPhone className='text-sm' />
                                            <span>Appeler Client</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Ordered Articles List */}
                        <div className='bg-slate-50 rounded-2xl p-5 border border-slate-200/70'>
                            <h3 className='text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2'>
                                <MdReceiptLong className='text-blue-600 text-base' />
                                Articles Commandés ({articles.length})
                            </h3>

                            {articles.length === 0 ? (
                                <p className='text-xs text-slate-400 py-3 text-center'>
                                    Détails des articles non chargés ou commande globale.
                                </p>
                            ) : (
                                <div className='divide-y divide-slate-200'>
                                    {articles.map((art, idx) => (
                                        <div key={art.id || idx} className='py-3 flex items-center justify-between gap-3'>
                                            <div className='flex items-center gap-3'>
                                                {art.article?.image ? (
                                                    <div className='w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0 relative'>
                                                        <Image
                                                            src={getImageUrl(art.article.image)}
                                                            alt={art.article.name}
                                                            fill
                                                            className='object-cover'
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className='w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 flex-shrink-0'>
                                                        <MdOutlineStorefront className='text-xl' />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className='text-sm font-bold text-slate-800'>{art.article?.name || 'Article'}</p>
                                                    <p className='text-xs text-slate-500'>
                                                        Quantité : <strong className='text-slate-800'>{art.quantity}</strong> × {art.article?.price || 0} DZD
                                                    </p>
                                                    {art.specific && (
                                                        <p className='text-[11px] text-amber-700 italic mt-0.5'>Note : {art.specific}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <p className='text-sm font-extrabold text-slate-900'>
                                                {art.subtotal || (art.quantity * (art.article?.price || 0))} DZD
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Price Breakdown */}
                            <div className='mt-4 pt-4 border-t border-slate-200 space-y-2'>
                                <div className='flex justify-between text-xs text-slate-500'>
                                    <span>Frais de livraison</span>
                                    <span className='font-semibold text-slate-700'>{order.delivery_price || '0'} DZD</span>
                                </div>
                                <div className='flex justify-between text-base font-extrabold text-slate-900 pt-1 border-t border-slate-200'>
                                    <span>Total Général</span>
                                    <span className='text-emerald-600 text-lg'>{order.total_price} DZD</span>
                                </div>
                            </div>
                        </div>

                        {/* Livreur Status Section */}
                        <div className='p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-3'>
                            <div className='flex items-center justify-between gap-2'>
                                <div className='flex-1'>
                                    <p className='text-xs text-slate-400 font-bold uppercase tracking-wider'>Livreur Assigné</p>
                                    {order.livreur ? (
                                        <p className='text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-2 flex-wrap'>
                                            <span className='w-2.5 h-2.5 rounded-full bg-green-500' />
                                            <span>
                                                {order.livreur.partenneur?.user?.first_name 
                                                    ? `${order.livreur.partenneur.user.first_name} ${order.livreur.partenneur.user.last_name || ''}`
                                                    : order.livreur.user?.first_name || `Livreur #${order.livreur.id}`}
                                            </span>
                                            <span className='text-xs font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full'>
                                                ({(order.livreur as any).partenneur?.user?.nbr_commandes ?? (order.livreur as any).user?.nbr_commandes ?? order.livreur.nbr_commandes ?? order.livreur.delivered_orders_count ?? (order.livreur as any).partenneur?.user?.delivered_orders_count ?? order.livreur_delivered_count ?? 0} livrée{((order.livreur as any).partenneur?.user?.nbr_commandes ?? (order.livreur as any).user?.nbr_commandes ?? order.livreur.nbr_commandes ?? order.livreur.delivered_orders_count ?? order.livreur_delivered_count ?? 0) > 1 ? "s" : ""})
                                            </span>
                                        </p>
                                    ) : order.status === 'search' ? (
                                        <p className='text-sm font-semibold text-indigo-600 mt-0.5 flex items-center gap-1.5'>
                                            <span className='w-2 h-2 rounded-full bg-indigo-500 animate-pulse' />
                                            Diffusée dans la zone 3 km • En attente d&apos;acceptation par un livreur...
                                        </p>
                                    ) : (
                                        <p className='text-sm font-semibold text-amber-600 mt-0.5'>
                                            Aucun livreur assigné pour le moment
                                        </p>
                                    )}
                                </div>
                                {!isCanceled && (
                                    <button
                                        onClick={() => {
                                            onClose();
                                            onOpenDispatch(order);
                                        }}
                                        className='px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5'
                                    >
                                        <MdDeliveryDining className='text-base' />
                                        <span>{order.livreur ? 'Changer Livreur' : order.status === 'search' ? 'Rediffuser / Assigner' : 'Diffuser / Assigner'}</span>
                                    </button>
                                )}
                            </div>

                            {/* Driver Timeline Button */}
                            <button
                                onClick={() => setShowDriverTimeline(true)}
                                className='w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all hover:border-indigo-400 shadow-sm'
                            >
                                <MdTimeline className='text-base text-indigo-500' />
                                <span>Voir le suivi détaillé du livreur (dates &amp; heures)</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer Action Buttons (When not showing cancel form) */}
                {!showCancelForm && (
                    <div className='pt-4 mt-2 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap'>
                        {/* Cancel Button */}
                        <div>
                            {!isCanceled && (
                                <button
                                    onClick={() => setShowCancelForm(true)}
                                    className='px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 border border-rose-200'
                                >
                                    <MdCancel className='text-lg' />
                                    <span>Annuler la commande</span>
                                </button>
                            )}
                        </div>

                        {/* Confirmation and Dispatch Buttons */}
                        <div className='flex items-center gap-3'>
                            <button
                                onClick={onClose}
                                className='px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors'
                            >
                                Fermer
                            </button>

                            {!order.confirmation && !isCanceled && (
                                <button
                                    onClick={handleConfirmOrder}
                                    disabled={confirming}
                                    className='px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2'
                                >
                                    {confirming ? (
                                        <>
                                            <TbLoader3 className='animate-spin text-lg' />
                                            <span>Confirmation...</span>
                                        </>
                                    ) : (
                                        <>
                                            <MdCheckCircle className='text-lg' />
                                            <span>Confirmer la Commande</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {/* If already delivered, allow reverting to En Livraison */}
                            {!isCanceled && (order.status === 'delivered') && (
                                <button
                                    onClick={() => handleOpenStatusModal('in_progress')}
                                    disabled={delivering}
                                    className='px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2'
                                    title='Repasser le statut à En livraison (livreur_pret_commande)'
                                >
                                    {delivering ? (
                                        <>
                                            <TbLoader3 className='animate-spin text-lg' />
                                            <span>Mise à jour...</span>
                                        </>
                                    ) : (
                                        <>
                                            <MdDeliveryDining className='text-lg' />
                                            <span>Passer En Livraison</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {/* If not delivered and not in progress, allow setting to En Livraison */}
                            {!isCanceled && order.status !== 'delivered' && order.status !== 'in_progress' && (
                                <button
                                    onClick={() => handleOpenStatusModal('in_progress')}
                                    disabled={delivering}
                                    className='px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2'
                                    title='Passer directement à En livraison (livreur_pret_commande)'
                                >
                                    <MdDeliveryDining className='text-lg' />
                                    <span>En Livraison</span>
                                </button>
                            )}

                            {/* Mark Delivered Button */}
                            {!isCanceled && order.status !== 'delivered' && (
                                <button
                                    onClick={() => handleOpenStatusModal('delivered')}
                                    disabled={delivering}
                                    className='px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2'
                                    title='Changer le statut en Livrée'
                                >
                                    {delivering ? (
                                        <>
                                            <TbLoader3 className='animate-spin text-lg' />
                                            <span>Mise à jour...</span>
                                        </>
                                    ) : (
                                        <>
                                            <MdDone className='text-lg' />
                                            <span>Marquer Livrée</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {!isCanceled && order.status !== 'delivered' && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onOpenDispatch(order);
                                    }}
                                    className='px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2'
                                >
                                    <MdDeliveryDining className='text-lg' />
                                    <span>Diffuser / Assigner</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Custom Confirm Status Dialog */}
            <ConfirmDeliveryDialog
                isOpen={showConfirmDeliveryDialog}
                order={order}
                targetStatus={targetDialogStatus}
                onClose={() => setShowConfirmDeliveryDialog(false)}
                onConfirm={handleConfirmStatusModal}
            />

            {/* Driver Timeline Dialog */}
            {showDriverTimeline && (
                <DriverTimelineDialog
                    order={order}
                    onClose={() => setShowDriverTimeline(false)}
                />
            )}
        </div>
    );
}
