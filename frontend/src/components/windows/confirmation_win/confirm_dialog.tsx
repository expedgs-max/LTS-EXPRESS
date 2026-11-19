"use client";

import React, { useEffect, useState } from 'react';
import { 
    MdCheckCircle, 
    MdClose, 
    MdDeliveryDining, 
    MdStorefront, 
    MdPerson, 
    MdLocationOn, 
    MdAttachMoney,
    MdRestaurantMenu,
    MdCancel,
    MdRestore
} from 'react-icons/md';
import { TbLoader3 } from 'react-icons/tb';

interface ConfirmDeliveryDialogProps {
    isOpen: boolean;
    order: Order | null;
    targetStatus?: "delivered" | "in_progress" | "ready" | "confirmed" | "canceled" | string;
    onClose: () => void;
    onConfirm: (order: Order, targetStatus: string) => Promise<void> | void;
}

export default function ConfirmDeliveryDialog({
    isOpen,
    order,
    targetStatus = "delivered",
    onClose,
    onConfirm
}: ConfirmDeliveryDialogProps) {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !loading) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, loading, onClose]);

    if (!isOpen || !order) return null;

    const handleConfirmClick = async () => {
        setLoading(true);
        try {
            await onConfirm(order, targetStatus);
        } finally {
            setLoading(false);
        }
    };

    const clientName = order.client_info?.first_name 
        ? `${order.client_info.first_name} ${order.client_info.last_name || ''}`.trim() 
        : order.client_info?.username || (order as any).client?.username || 'Client';

    const storeName = order.magasin_info?.name || (order.magasin_info as any)?.name || 'Magasin';

    // Status metadata config
    const getStatusConfig = () => {
        switch (targetStatus) {
            case "ready":
                return {
                    icon: <MdRestaurantMenu />,
                    iconBg: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60 ring-amber-50/50 dark:ring-amber-950/30",
                    badgeBg: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300",
                    title: "Pris à livrer (Ready)",
                    subtitle: "Voulez-vous passer cette commande au statut Prêt à livrer / Pris à livrer (Ready) ?",
                    btnBg: "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/30",
                    btnText: "Oui, Pris à livrer",
                };
            case "in_progress":
            case "livreur_pret_commande":
                return {
                    icon: <MdDeliveryDining />,
                    iconBg: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60 ring-blue-50/50 dark:ring-blue-950/30",
                    badgeBg: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300",
                    title: "Passer En Livraison",
                    subtitle: "Voulez-vous passer le statut de cette commande à En cours de livraison (in_progress) ?",
                    btnBg: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/30",
                    btnText: "Oui, En Livraison",
                };
            case "confirmed":
                return {
                    icon: <MdRestore />,
                    iconBg: "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/60 ring-sky-50/50 dark:ring-sky-950/30",
                    badgeBg: "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300",
                    title: "Rétablir / Confirmer la Commande",
                    subtitle: "Voulez-vous réactiver cette commande et la passer au statut Confirmée (confirmed) ?",
                    btnBg: "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 shadow-sky-600/30",
                    btnText: "Oui, Confirmer",
                };
            case "canceled":
                return {
                    icon: <MdCancel />,
                    iconBg: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 ring-rose-50/50 dark:ring-rose-950/30",
                    badgeBg: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300",
                    title: "Annuler la Commande",
                    subtitle: "Voulez-vous vraiment annuler cette commande ?",
                    btnBg: "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-600/30",
                    btnText: "Oui, Annuler",
                };
            case "delivered":
            default:
                return {
                    icon: <MdCheckCircle />,
                    iconBg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 ring-emerald-50/50 dark:ring-emerald-950/30",
                    badgeBg: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300",
                    title: "Confirmer la Livraison",
                    subtitle: "Confirmez-vous que cette commande a bien été livrée au client avec succès ?",
                    btnBg: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/30",
                    btnText: "Oui, Livrée",
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div className='fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn'>
            {/* Modal Card */}
            <div 
                className='relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-7 overflow-hidden transform transition-all animate-scaleUp'
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={loading}
                    className='absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50'
                >
                    <MdClose className='text-xl' />
                </button>

                {/* Top Icon Badge */}
                <div className='flex flex-col items-center text-center'>
                    <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl shadow-lg mb-4 ring-8 ${config.iconBg}`}>
                        {config.icon}
                    </div>

                    <span className={`px-3 py-1 text-xs font-bold rounded-full mb-2 ${config.badgeBg}`}>
                        Commande #{order.id}
                    </span>

                    <h3 className='text-xl font-bold text-slate-900 dark:text-white'>
                        {config.title}
                    </h3>
                    <p className='text-sm text-slate-500 dark:text-slate-400 mt-1.5 px-2'>
                        {config.subtitle}
                    </p>
                </div>

                {/* Order Summary Card */}
                <div className='my-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 space-y-2.5 text-xs sm:text-sm'>
                    <div className='flex items-center justify-between text-slate-600 dark:text-slate-300'>
                        <span className='flex items-center gap-1.5 font-medium'>
                            <MdStorefront className='text-base text-blue-500' />
                            Magasin :
                        </span>
                        <span className='font-bold text-slate-900 dark:text-white truncate max-w-[180px]'>
                            {storeName}
                        </span>
                    </div>

                    <div className='flex items-center justify-between text-slate-600 dark:text-slate-300'>
                        <span className='flex items-center gap-1.5 font-medium'>
                            <MdPerson className='text-base text-indigo-500' />
                            Client :
                        </span>
                        <span className='font-bold text-slate-900 dark:text-white truncate max-w-[180px]'>
                            {clientName}
                        </span>
                    </div>

                    {order.distination && (
                        <div className='flex items-center justify-between text-slate-600 dark:text-slate-300'>
                            <span className='flex items-center gap-1.5 font-medium'>
                                <MdLocationOn className='text-base text-rose-500' />
                                Destination :
                            </span>
                            <span className='font-bold text-slate-900 dark:text-white truncate max-w-[180px]'>
                                {order.distination}
                            </span>
                        </div>
                    )}

                    <div className='pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between'>
                        <span className='flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200'>
                            <MdAttachMoney className='text-base text-emerald-500' />
                            Montant Total :
                        </span>
                        <span className='font-extrabold text-emerald-600 dark:text-emerald-400 text-base'>
                            {order.total_price} DZD
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className='flex items-center gap-3'>
                    <button
                        type='button'
                        onClick={onClose}
                        disabled={loading}
                        className='flex-1 py-3 px-4 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all text-center disabled:opacity-50'
                    >
                        Annuler
                    </button>
                    <button
                        type='button'
                        onClick={handleConfirmClick}
                        disabled={loading}
                        className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none ${config.btnBg}`}
                    >
                        {loading ? (
                            <>
                                <TbLoader3 className='animate-spin text-lg' />
                                <span>Validation...</span>
                            </>
                        ) : (
                            <>
                                <span className='text-lg'>{config.icon}</span>
                                <span>{config.btnText}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
