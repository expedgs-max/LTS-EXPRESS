"use client";

import React from "react";
import {
    MdClose,
    MdCheck,
    MdStorefront,
    MdTwoWheeler,
    MdDoneAll,
    MdDeliveryDining,
    MdSchedule,
    MdCalendarToday,
    MdCancel,
    MdTimeline,
} from "react-icons/md";

interface DriverTimelineDialogProps {
    order: Order;
    onClose: () => void;
}

type TimelineStep = {
    key: string;
    label: string;
    icon: React.ReactNode;
    iconBg: string;
    iconText: string;
    lineBg: string;
    done: boolean;
    datetime: string | null;
    description: string;
};

function fmt(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleString("fr-FR", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    } catch {
        return null;
    }
}

function fmtTime(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
        return null;
    }
}

function fmtDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    } catch {
        return null;
    }
}

function addMinutes(base: string, minutes: number): string {
    return new Date(new Date(base).getTime() + minutes * 60000).toISOString();
}

function buildTimeline(order: Order): TimelineStep[] {
    const created = order.created_at;
    const isCanceled = ["canceled", "annule_par_client", "annule_par_livreur"].includes(order.status);
    const hasArrive = ["ready", "in_progress", "delivered", "annule_par_livreur"].includes(order.status);
    const hasEnRoute = ["in_progress", "delivered"].includes(order.status);
    const hasLivree = order.status === "delivered";

    const driverFName = order.livreur?.partenneur?.user?.first_name || "Le livreur";

    const steps: TimelineStep[] = [
        {
            key: "cree",
            label: "Commande créée",
            icon: <MdCalendarToday />,
            iconBg: "bg-slate-700",
            iconText: "text-white",
            lineBg: "bg-emerald-400",
            done: true,
            datetime: created,
            description: "Le client a passé la commande sur l'application",
        },
        {
            key: "accepte",
            label: "Acceptée par le livreur",
            icon: <MdCheck />,
            iconBg: "bg-emerald-500",
            iconText: "text-white",
            lineBg: "bg-blue-400",
            done: !!order.livreur,
            datetime: order.livreur ? created : null,
            description: `${driverFName} a accepté et pris en charge la commande`,
        },
        {
            key: "arrive",
            label: "Arrivé au restaurant",
            icon: <MdStorefront />,
            iconBg: hasArrive ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700",
            iconText: hasArrive ? "text-white" : "text-slate-400",
            lineBg: "bg-[#172554]",
            done: hasArrive,
            datetime: hasArrive ? addMinutes(created, 6) : null,
            description: `Livreur arrivé au restaurant « ${order.magasin_info?.name || "Magasin"} »`,
        },
        {
            key: "en_route",
            label: "En route vers le client",
            icon: <MdTwoWheeler />,
            iconBg: hasEnRoute ? "bg-[#172554]" : "bg-slate-200 dark:bg-slate-700",
            iconText: hasEnRoute ? "text-white" : "text-slate-400",
            lineBg: "bg-yellow-400",
            done: hasEnRoute,
            datetime: hasEnRoute ? addMinutes(created, 9) : null,
            description: "Commande récupérée — en route vers le client",
        },
        {
            key: "livree",
            label: "Commande livrée",
            icon: <MdDoneAll />,
            iconBg: hasLivree ? "bg-yellow-400" : "bg-slate-200 dark:bg-slate-700",
            iconText: hasLivree ? "text-slate-950 font-black" : "text-slate-400",
            lineBg: "bg-transparent",
            done: hasLivree,
            datetime: hasLivree ? addMinutes(created, 24) : null,
            description: "Commande remise au client avec succès ✓",
        },
    ];

    if (isCanceled) {
        const cancelLabel =
            order.status === "annule_par_client" ? "Annulée par le client" :
            order.status === "annule_par_livreur" ? "Annulée par le livreur" : "Annulée";
        steps.push({
            key: "annulee",
            label: cancelLabel,
            icon: <MdCancel />,
            iconBg: "bg-rose-600",
            iconText: "text-white",
            lineBg: "bg-transparent",
            done: true,
            datetime: addMinutes(created, 2),
            description: "La commande a été clôturée suite à une annulation",
        });
    }

    return steps;
}

export default function DriverTimelineDialog({ order, onClose }: DriverTimelineDialogProps) {
    const steps = buildTimeline(order);

    const driverName = order.livreur?.partenneur?.user?.first_name
        ? `${order.livreur.partenneur.user.first_name} ${order.livreur.partenneur.user.last_name || ""}`.trim()
        : order.livreur?.user?.first_name || (order.livreur ? `Livreur #${order.livreur.id}` : "Aucun livreur assigné");

    const completedCount = steps.filter(s => s.done).length;
    const totalCount = steps.length;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
            <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-slate-900 to-[#0f172a] rounded-t-3xl border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl">
                            <MdTimeline />
                        </div>
                        <div>
                            <h2 className="text-base font-extrabold text-white tracking-tight">
                                Suivi Livreur · Commande #{order.id}
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                                <MdDeliveryDining className="text-emerald-400 text-sm" />
                                <span className="font-semibold text-emerald-300">{driverName}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <MdClose className="text-xl" />
                    </button>
                </div>

                {/* ── Info Bar ── */}
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex items-center gap-5 text-xs flex-wrap">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <MdCalendarToday className="text-blue-500" />
                        <span>Date : <strong className="text-slate-800 dark:text-white">{fmtDate(order.created_at)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <MdSchedule className="text-indigo-500" />
                        <span>Heure : <strong className="text-slate-800 dark:text-white">{fmtTime(order.created_at)}</strong></span>
                    </div>
                    {order.trip_time && (
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-700">
                            <MdSchedule className="text-amber-500" />
                            <span>Commande pris : <strong>{order.trip_time}</strong></span>
                        </div>
                    )}
                    {/* Progress pill */}
                    <div className="ml-auto flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-700 font-bold text-[11px]">
                        <MdCheck className="text-sm" />
                        {completedCount}/{totalCount} étapes complétées
                    </div>
                </div>

                {/* ── Timeline ── */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <div className="flex flex-col gap-0">
                        {steps.map((step, idx) => {
                            const isLast = idx === steps.length - 1;
                            const dateStr = fmtDate(step.datetime);
                            const timeStr = fmtTime(step.datetime);
                            const fullStr = fmt(step.datetime);

                            return (
                                <div key={step.key} className="flex gap-4 relative">
                                    {/* Icon column */}
                                    <div className="flex flex-col items-center shrink-0">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base ring-4 ring-white dark:ring-slate-950 shadow-md z-10 transition-all ${step.iconBg} ${step.iconText} ${step.done ? "" : "opacity-40"}`}>
                                            {step.icon}
                                        </div>
                                        {!isLast && (
                                            <div className={`w-[2px] flex-1 mt-1 mb-1 min-h-[28px] rounded-full ${step.done ? step.lineBg : "bg-slate-200 dark:bg-slate-700"} transition-all`} />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className={`flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
                                        <div className={`rounded-2xl border p-4 transition-all shadow-sm ${
                                            step.done
                                                ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                                : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-55"
                                        }`}>
                                            {/* Title + Badge */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className={`text-sm font-extrabold ${step.done ? "text-slate-900 dark:text-slate-50" : "text-slate-400 dark:text-slate-600"}`}>
                                                        {step.label}
                                                    </p>
                                                    <p className={`text-[11px] mt-0.5 leading-snug ${step.done ? "text-slate-500 dark:text-slate-400" : "text-slate-300 dark:text-slate-700"}`}>
                                                        {step.description}
                                                    </p>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 border ${
                                                    !step.done
                                                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700"
                                                        : step.key === "annulee"
                                                        ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700"
                                                        : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                                                }`}>
                                                    {!step.done ? "En attente" : step.key === "annulee" ? "Annulé" : "✓ Complété"}
                                                </span>
                                            </div>

                                            {/* Date/Time block */}
                                            {step.done && fullStr ? (
                                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <MdCalendarToday className="text-blue-400 text-sm shrink-0" />
                                                        <span className="font-semibold text-slate-600 dark:text-slate-300">{dateStr}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <MdSchedule className="text-indigo-400 text-sm shrink-0" />
                                                        <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">{timeStr}</span>
                                                    </div>
                                                </div>
                                            ) : !step.done ? (
                                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/40 flex items-center gap-2 text-xs text-slate-300 dark:text-slate-700">
                                                    <MdSchedule className="text-sm shrink-0" />
                                                    <span>En attente — non encore effectué</span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60 rounded-b-3xl gap-3 flex-wrap">
                    <p className="text-[11px] text-slate-400 dark:text-slate-600 italic flex-1">
                        ⚠ Les heures marquées sont des estimations basées sur la création de la commande.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-900 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
