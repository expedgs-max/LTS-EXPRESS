"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Wilaya } from "@/lib/tools/named";
import { 
    ConfirmationLivreur, 
    ClientPhoneRequest,
    getConfirmationCommandes, 
    getConfirmationLivreurs,
    toggleBlockLivreur,
    approveOrRejectClientPhone,
    updateCommandeStatusByCentre,
    updateCommandeTripTimeByCentre
} from "@/lib/confirmation_action";
import DispatchModal from "../windows/confirmation_win/dispatch_modal";
import OrderDetailsModal from "../windows/confirmation_win/order_details_modal";
import ConfirmDeliveryDialog from "../windows/confirmation_win/confirm_dialog";
import DriverTimelineDialog from "../windows/confirmation_win/driver_timeline_dialog";
import dynamic from "next/dynamic";
import Link from "next/link";

const DispatchMap = dynamic(() => import("./dispatch_map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-[550px] bg-slate-950 flex flex-col items-center justify-center text-slate-500 gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-slate-400">Chargement de Google Maps & Google Places...</span>
        </div>
    )
});

import { 
    MdSearch, 
    MdLocationOn, 
    MdDeliveryDining,
    MdLocalShipping, 
    MdCheckCircle, 
    MdPhone, 
    MdStorefront, 
    MdPerson, 
    MdMoreVert, 
    MdLock, 
    MdLockOpen, 
    MdRefresh, 
    MdFiberManualRecord, 
    MdMap, 
    MdVolumeUp, 
    MdVolumeOff, 
    MdBolt,
    MdCalendarToday,
    MdCheck,
    MdTwoWheeler,
    MdDoneAll,
    MdEdit,
    MdTimeline,
    MdRestaurantMenu,
    MdCancel,
    MdRestore
} from "react-icons/md";
import { TbLoader3 } from "react-icons/tb";
import toast, { Toast } from "react-hot-toast";

type Props = {
    token: string;
    initialWilaya?: string;
};

// Web Audio API chime generator for new order arrivals
function playNotificationChime() {
    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // First Bell Note (D5 - 587.33 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(587.33, now);
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.5);

        // Second Harmonic (D6 - 1174.66 Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(880, now + 0.12);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35);
        gain2.gain.setValueAtTime(0.2, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.7);
    } catch {
        // AudioContext autoplay restrictions or blocked
    }
}

export default function ConfirmationDispatch({ token, initialWilaya = "" }: Props) {
    const [selectedWilaya, setSelectedWilaya] = useState<string>(initialWilaya);
    const [selectedDate, setSelectedDate] = useState<string>("");
    
    // Commandes State & Filters
    const [commandes, setCommandes] = useState<Order[]>([]);
    const [loadingCommandes, setLoadingCommandes] = useState<boolean>(true);
    const [commandeSearch, setCommandeSearch] = useState<string>("");
    const [selectedStatusTab, setSelectedStatusTab] = useState<string>("all");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set());
    const [pendingPhoneRequests, setPendingPhoneRequests] = useState<ClientPhoneRequest[]>([]);

    // Audio Alert Settings
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

    // Livreurs State & Filters
    const [livreurs, setLivreurs] = useState<ConfirmationLivreur[]>([]);
    const [loadingLivreurs, setLoadingLivreurs] = useState<boolean>(true);
    const [livreurSearch, setLivreurSearch] = useState<string>("");
    const [selectedLivreurTab, setSelectedLivreurTab] = useState<"all" | "online" | "busy" | "offline" | "blocked">("all");
    const [selectedLivreur, setSelectedLivreur] = useState<ConfirmationLivreur | null>(null);

    // Modals
    const [dispatchOrder, setDispatchOrder] = useState<Order | null>(null);
    const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
    const [previewColisImage, setPreviewColisImage] = useState<string | null>(null);
    const [driverTimelineOrder, setDriverTimelineOrder] = useState<Order | null>(null);
    const [statusDialogData, setStatusDialogData] = useState<{ order: Order; targetStatus: string } | null>(null);
    const [activeMenuOrderId, setActiveMenuOrderId] = useState<number | null>(null);
    const [wsConnected, setWsConnected] = useState<boolean>(false);

    const [editingTripTimeOrderId, setEditingTripTimeOrderId] = useState<number | null>(null);
    const [tempTripTime, setTempTripTime] = useState<string>("");

    // Resizable Commands Panel Width (saved in localStorage)
    const [cmdPanelWidth, setCmdPanelWidth] = useState<number>(480);
    const [isDraggingResizer, setIsDraggingResizer] = useState<boolean>(false);
    const [isMounted, setIsMounted] = useState<boolean>(false);
    const isDraggingRef = useRef<boolean>(false);

    // Resizable Livreurs Panel Width (saved in localStorage)
    const [livPanelWidth, setLivPanelWidth] = useState<number>(360);
    const [isDraggingLivResizer, setIsDraggingLivResizer] = useState<boolean>(false);
    const isDraggingLivRef = useRef<boolean>(false);

    useEffect(() => {
        setIsMounted(true);
        const savedCmd = localStorage.getItem("dispatch_cmd_width");
        if (savedCmd) {
            const parsed = parseInt(savedCmd, 10);
            if (!isNaN(parsed) && parsed >= 320 && parsed <= 850) {
                setCmdPanelWidth(parsed);
            }
        }
        const savedLiv = localStorage.getItem("dispatch_liv_width");
        if (savedLiv) {
            const parsed = parseInt(savedLiv, 10);
            if (!isNaN(parsed) && parsed >= 100 && parsed <= 750) {
                setLivPanelWidth(parsed);
            }
        }
    }, []);

    const handleMouseDownResizer = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingResizer(true);
        isDraggingRef.current = true;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!isDraggingRef.current) return;
            const newWidth = Math.min(Math.max(moveEvent.clientX - 60, 320), 850);
            setCmdPanelWidth(newWidth);
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
            setIsDraggingResizer(false);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            setCmdPanelWidth((current) => {
                localStorage.setItem("dispatch_cmd_width", current.toString());
                return current;
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseDownLivResizer = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingLivResizer(true);
        isDraggingLivRef.current = true;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!isDraggingLivRef.current) return;
            const newWidth = Math.min(Math.max(window.innerWidth - moveEvent.clientX, 100), 750);
            setLivPanelWidth(newWidth);
        };

        const handleMouseUp = () => {
            isDraggingLivRef.current = false;
            setIsDraggingLivResizer(false);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            setLivPanelWidth((current) => {
                localStorage.setItem("dispatch_liv_width", current.toString());
                return current;
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    const setWidthPreset = (width: number) => {
        setCmdPanelWidth(width);
        localStorage.setItem("dispatch_cmd_width", width.toString());
    };

    const setLivWidthPreset = (width: number) => {
        setLivPanelWidth(width);
        localStorage.setItem("dispatch_liv_width", width.toString());
    };

    const handleConfirmStatusChange = async (cmd: Order, targetStatus: string) => {
        const ok = await updateCommandeStatusByCentre({
            commande_id: cmd.id,
            status: targetStatus
        });
        if (ok) {
            setCommandes(prev => prev.map(c => c.id === cmd.id ? { ...c, status: targetStatus as Order['status'], confirmation: true } : c));
            if (selectedOrder?.id === cmd.id) {
                setSelectedOrder(prev => prev ? { ...prev, status: targetStatus as Order['status'], confirmation: true } : null);
            }
            setStatusDialogData(null);
            setActiveMenuOrderId(null);
        }
    };

    const handleSaveTripTime = async (cmdId: number, value: string, currentStatus?: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        const res = await updateCommandeTripTimeByCentre({
            commande_id: cmdId,
            trip_time: trimmed,
            status: currentStatus || "confirmed"
        });
        if (res?.success) {
            setCommandes(prev => prev.map(c => c.id === cmdId ? { ...c, trip_time: trimmed } : c));
            if (selectedOrder?.id === cmdId) {
                setSelectedOrder(prev => prev ? { ...prev, trip_time: trimmed } : null);
            }
            setEditingTripTimeOrderId(null);
        }
    };

    const soundEnabledRef = useRef(soundEnabled);
    soundEnabledRef.current = soundEnabled;

    const selectedOrderRef = useRef<Order | null>(null);
    selectedOrderRef.current = selectedOrder;

    // Track notified orders to strictly prevent duplicate toasts and audio alerts
    const notifiedOrderIdsRef = useRef<Set<number>>(new Set());

    // Fetch Commandes
    const fetchCommandes = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoadingCommandes(true);
        const data = await getConfirmationCommandes({
            wilaya: selectedWilaya || undefined,
            date: selectedDate || undefined,
            page: "1",
            page_size: "100"
        });
        if (data) {
            setCommandes(data.result);
        }
        if (!isSilent) setLoadingCommandes(false);
    }, [selectedWilaya, selectedDate]);

    // Fetch Livreurs
    const fetchLivreurs = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoadingLivreurs(true);
        const data = await getConfirmationLivreurs({
            wilaya: selectedWilaya || undefined,
            page: "1",
            page_size: "100"
        });
        if (data && data.result) {
            setLivreurs(prev => {
                const prevMap = new Map(prev.map(p => [p.id, p]));
                return data.result.map(newItem => {
                    const existing = prevMap.get(newItem.id);
                    if (existing) {
                        return {
                            ...newItem,
                            // Preserve live battery reported by device
                            battery: newItem.battery ?? existing.battery ?? (newItem as any).battery_level ?? (existing as any).battery_level,
                            // Preserve live GPS coordinates
                            latitude: existing.latitude ?? newItem.latitude,
                            longitude: existing.longitude ?? newItem.longitude,
                            // Update online status accurately from API
                            is_available: newItem.is_available !== undefined ? Boolean(newItem.is_available) : existing.is_available,
                        };
                    }
                    return newItem;
                });
            });
        }
        if (!isSilent) setLoadingLivreurs(false);
    }, [selectedWilaya]);

    // Initial and Wilaya change reload
    useEffect(() => {
        fetchCommandes();
        fetchLivreurs();
    }, [fetchCommandes, fetchLivreurs]);

    // Background silent fallback polling (every 25s) to guarantee zero missed orders
    useEffect(() => {
        const interval = setInterval(() => {
            fetchCommandes(true);
            fetchLivreurs(true);
        }, 25000);
        return () => clearInterval(interval);
    }, [fetchCommandes, fetchLivreurs]);

    // WebSocket Real-time Connection
    useEffect(() => {
        if (!token) return;

        let socket: WebSocket | null = null;
        let reconnectTimeout: NodeJS.Timeout;
        let isCleanedUp = false;

        const connectWS = () => {
            if (isCleanedUp) return;

            let wsBase = process.env.NEXT_PUBLIC_WS_SERVER;
            if (!wsBase) {
                const host = window.location.host;
                const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("192.168.");
                wsBase = isLocal
                    ? `ws://${window.location.hostname}:8000`
                    : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
            }

            const wilayaParam = selectedWilaya ? `&wilaya=${encodeURIComponent(selectedWilaya)}` : "";
            const wsUrl = `${wsBase}/ws/confirmation/commandes/?token=${token}${wilayaParam}`;

            try {
                socket = new WebSocket(wsUrl);

                socket.onopen = () => {
                    if (!isCleanedUp) setWsConnected(true);
                };

                socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        
                        // 1. New Commande arrived in Real-Time
                        if ((data.type === 'new_commande' || data.type === 'send_new_commande') && data.commande) {
                            const newCmd: Order = data.commande;
                            const isAlreadyNotified = notifiedOrderIdsRef.current.has(newCmd.id);
                            
                            // Mark as new in real-time session
                            setNewOrderIds(prev => new Set(prev).add(newCmd.id));

                            // Prepend to list without duplicate items
                            setCommandes(prev => [newCmd, ...prev.filter(c => c.id !== newCmd.id)]);

                            // Only notify and sound once per unique order
                            if (!isAlreadyNotified) {
                                notifiedOrderIdsRef.current.add(newCmd.id);

                                if (soundEnabledRef.current) {
                                    playNotificationChime();
                                }

                                toast.custom((t: Toast) => (
                                    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-900 text-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-emerald-500/50 p-3.5 border border-emerald-500/30 gap-3 items-center font-sans`}>
                                        <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl text-xl shrink-0">
                                            📦
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-emerald-400">Nouvelle commande #{newCmd.id}</span>
                                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold animate-pulse">DIRECT</span>
                                            </div>
                                            <p className="text-[11px] text-slate-300 font-medium truncate">
                                                {newCmd.magasin_info?.name || 'Magasin'} → {newCmd.client_info?.first_name || 'Client'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-semibold">{newCmd.total_price || 0} DZD</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedOrder(newCmd);
                                                toast.dismiss(t.id);
                                            }}
                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all hover:scale-105 shrink-0"
                                        >
                                            Localiser
                                        </button>
                                    </div>
                                ), { id: `toast_new_commande_${newCmd.id}`, duration: 6000 });
                            }

                        // 2. Commande Updated in Real-Time
                        } else if ((data.type === 'commande_update' || data.type === 'send_commande_update') && data.commande) {
                            const updatedCmd = data.commande;
                            setCommandes(prev => prev.map(c => c.id === updatedCmd.id ? { ...c, ...updatedCmd } : c));
                            if (selectedOrderRef.current?.id === updatedCmd.id) {
                                setSelectedOrder(prev => prev ? { ...prev, ...updatedCmd } : null);
                            }

                        // 2.5. Driver requested client phone number
                        } else if ((data.type === 'client_phone_request' || data.type === 'send_client_phone_request') && data.request_data) {
                            const reqData: ClientPhoneRequest = data.request_data;
                            const isAlreadyPending = pendingPhoneRequests.some(r => r.commande_id === reqData.commande_id);

                            setPendingPhoneRequests(prev => {
                                const exists = prev.some(r => r.commande_id === reqData.commande_id);
                                return exists ? prev : [reqData, ...prev];
                            });

                            if (!isAlreadyPending) {
                                if (soundEnabledRef.current) {
                                    playNotificationChime();
                                }

                                toast.custom((t: Toast) => (
                                    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-900 text-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col ring-2 ring-amber-500/80 p-4 border border-amber-500/40 gap-3 font-sans`}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl text-xl shrink-0 animate-bounce">
                                                📞
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-amber-400">Demande de numéro client</span>
                                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">URGENT</span>
                                                </div>
                                                <p className="text-[12px] text-white font-semibold truncate">
                                                    Livreur : {reqData.livreur_name}
                                                </p>
                                                <p className="text-[11px] text-slate-300">
                                                    Commande #{reqData.commande_id} • Raison : {reqData.reason}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                                            <button
                                                onClick={async () => {
                                                    toast.dismiss(t.id);
                                                    await approveOrRejectClientPhone({ commande_id: reqData.commande_id, approved: false });
                                                    setPendingPhoneRequests(prev => prev.filter(r => r.commande_id !== reqData.commande_id));
                                                }}
                                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                                            >
                                                Refuser
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    toast.dismiss(t.id);
                                                    const res = await approveOrRejectClientPhone({ commande_id: reqData.commande_id, approved: true });
                                                    if (res?.success) {
                                                        setPendingPhoneRequests(prev => prev.filter(r => r.commande_id !== reqData.commande_id));
                                                        setCommandes(prev => prev.map(c => c.id === reqData.commande_id ? { ...c, status: 'in_progress' } : c));
                                                    }
                                                }}
                                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                                            >
                                                <MdCheckCircle className="text-sm" />
                                                Autoriser N°
                                            </button>
                                        </div>
                                    </div>
                                ), { id: `toast_phone_req_${reqData.commande_id}`, duration: 8000 });
                            }

                        // 3. Driver Status / Location / Battery Changed in Real-Time
                        } else if (data.type === 'livreur_status' || data.type === 'send_livreur_status_update' || data.type === 'livreur_location') {
                            const hasLocationTelemetry = data.latitude !== undefined && data.latitude !== null && data.latitude !== "";
                            const isAvailable = data.is_available !== undefined 
                                ? Boolean(data.is_available) 
                                : (hasLocationTelemetry ? true : false);
                            const batteryVal = data.battery !== undefined && data.battery !== null 
                                ? Number(data.battery) 
                                : (data.battery_level !== undefined && data.battery_level !== null ? Number(data.battery_level) : undefined);
                            
                            setLivreurs(prev => {
                                const exists = prev.some(l => l.id === data.livreur_id);
                                if (!exists) {
                                    fetchLivreurs(true);
                                    return prev;
                                }
                                return prev.map(l => {
                                    if (l.id === data.livreur_id) {
                                        return {
                                            ...l,
                                            is_available: isAvailable,
                                            latitude: data.latitude !== undefined && data.latitude !== null && data.latitude !== "" ? parseFloat(data.latitude) : l.latitude,
                                            longitude: data.longitude !== undefined && data.longitude !== null && data.longitude !== "" ? parseFloat(data.longitude) : l.longitude,
                                            battery: batteryVal !== undefined ? batteryVal : l.battery,
                                            user: l.user ? {
                                                ...l.user,
                                                first_name: data.first_name || l.user.first_name,
                                                last_name: data.last_name || l.user.last_name,
                                                phone: data.phone || l.user.phone
                                            } : null
                                        };
                                    }
                                    return l;
                                });
                            });

                            setSelectedLivreur(curr => {
                                if (curr && curr.id === data.livreur_id) {
                                    return {
                                        ...curr,
                                        is_available: isAvailable,
                                        battery: batteryVal !== undefined ? batteryVal : curr.battery,
                                    };
                                }
                                return curr;
                            });
                        }
                    } catch {
                        // Ignore parse error
                    }
                };

                socket.onclose = (event) => {
                    if (!isCleanedUp) {
                        setWsConnected(false);
                        reconnectTimeout = setTimeout(connectWS, 4000);
                    }
                };

                socket.onerror = () => {
                    if (!isCleanedUp) {
                        setWsConnected(false);
                    }
                };
            } catch {
                if (!isCleanedUp) {
                    reconnectTimeout = setTimeout(connectWS, 4000);
                }
            }
        };

        connectWS();

        return () => {
            isCleanedUp = true;
            if (socket) {
                socket.onclose = null;
                socket.onerror = null;
                socket.close();
            }
            clearTimeout(reconnectTimeout);
        };
    }, [token, selectedWilaya]);

    // Filtered Commandes
    const filteredCommandes = useMemo(() => {
        return commandes.filter((c) => {
            // Status Tab Filter
            if (selectedStatusTab === "phone_requests" && !pendingPhoneRequests.some(r => r.commande_id === c.id)) return false;
            if (selectedStatusTab === "pending" && c.status !== "pending") return false;
            if (selectedStatusTab === "search" && c.status !== "search") return false;
            if (selectedStatusTab === "confirmed" && c.status !== "confirmed") return false;
            if (selectedStatusTab === "in_progress" && !["in_progress", "ready"].includes(c.status)) return false;
            if (selectedStatusTab === "delivered" && c.status !== "delivered") return false;
            if (selectedStatusTab === "canceled" && !["canceled", "annule_par_client", "annule_par_livreur"].includes(c.status)) return false;

            // Date Filter
            if (selectedDate && c.created_at) {
                const cmdDate = c.created_at.substring(0, 10);
                if (cmdDate !== selectedDate) return false;
            }

            // Search Filter
            if (commandeSearch.trim()) {
                const q = commandeSearch.toLowerCase();
                const matchId = String(c.id).includes(q);
                const matchStore = c.magasin_info?.name?.toLowerCase().includes(q);
                const matchClient = `${c.client_info?.first_name || ''} ${c.client_info?.last_name || ''} ${c.client_info?.username || ''}`.toLowerCase().includes(q);
                const matchPhone = c.client_info?.phone_number_1?.toLowerCase().includes(q);
                const matchDest = c.distination?.toLowerCase().includes(q);
                return matchId || matchStore || matchClient || matchPhone || matchDest;
            }

            return true;
        });
    }, [commandes, selectedStatusTab, commandeSearch, selectedDate, pendingPhoneRequests]);

    // Filtered & Sorted Livreurs (Online top, Busy next, Offline bottom, Blocked last)
    const filteredLivreurs = useMemo(() => {
        const filtered = livreurs.filter((l) => {
            const isOnline = l.is_available;
            const isBlocked = l.is_blocked || l.user?.bloquer;
            const isBusy = l.active_orders_count > 0;

            // Tab Filter
            if (selectedLivreurTab === "online" && (!isOnline || isBlocked)) return false;
            if (selectedLivreurTab === "busy" && (!isBusy || isBlocked)) return false;
            if (selectedLivreurTab === "offline" && (isOnline || isBlocked)) return false;
            if (selectedLivreurTab === "blocked" && !isBlocked) return false;

            // Search Filter
            if (livreurSearch.trim()) {
                const q = livreurSearch.toLowerCase();
                const matchName = `${l.user?.first_name || ''} ${l.user?.last_name || ''} ${l.user?.username || ''}`.toLowerCase().includes(q);
                const matchPhone = l.user?.phone?.toLowerCase().includes(q);
                const matchId = String(l.id).includes(q);
                return matchName || matchPhone || matchId;
            }

            return true;
        });

        // Priority Sorting:
        // 0: Online & Free (En ligne disponible)
        // 1: Online & Busy (Occupé / En cours de livraison)
        // 2: Offline (Hors ligne)
        // 3: Blocked (Bloqué)
        return filtered.sort((a, b) => {
            const getPriority = (item: ConfirmationLivreur) => {
                const isBlocked = Boolean(item.is_blocked || item.user?.bloquer);
                if (isBlocked) return 3;
                const isOnline = Boolean(item.is_available);
                const isBusy = (item.active_orders_count || 0) > 0;
                if (isOnline && !isBusy) return 0;
                if (isOnline && isBusy) return 1;
                return 2; // Offline
            };

            const prioA = getPriority(a);
            const prioB = getPriority(b);
            if (prioA !== prioB) {
                return prioA - prioB;
            }
            const nameA = a.user?.first_name || a.user?.username || String(a.id);
            const nameB = b.user?.first_name || b.user?.username || String(b.id);
            return nameA.localeCompare(nameB);
        });
    }, [livreurs, selectedLivreurTab, livreurSearch]);

    // Counts for Tabs
    const counts = useMemo(() => {
        return {
            cmdAll: commandes.length,
            cmdPending: commandes.filter(c => c.status === 'pending').length,
            cmdSearch: commandes.filter(c => c.status === 'search').length,
            cmdConfirmed: commandes.filter(c => c.status === 'confirmed').length,
            cmdInProgress: commandes.filter(c => ['in_progress', 'ready'].includes(c.status)).length,
            cmdDelivered: commandes.filter(c => c.status === 'delivered').length,
            cmdCanceled: commandes.filter(c => ['canceled', 'annule_par_client', 'annule_par_livreur'].includes(c.status)).length,

            livAll: livreurs.length,
            livOnline: livreurs.filter(l => l.is_available && !(l.is_blocked || l.user?.bloquer)).length,
            livBusy: livreurs.filter(l => l.active_orders_count > 0 && !(l.is_blocked || l.user?.bloquer)).length,
            livOffline: livreurs.filter(l => !l.is_available && !(l.is_blocked || l.user?.bloquer)).length,
            livBlocked: livreurs.filter(l => Boolean(l.is_blocked || l.user?.bloquer)).length,
        };
    }, [commandes, livreurs]);

    // Format helper for timestamps & dates
    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return "";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "";
            const datePart = d.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            });
            const timePart = d.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });
            return `${datePart} à ${timePart}`;
        } catch {
            return "";
        }
    };

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return "";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "";
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return "";
        }
    };

    // Calculate timeline step times based on created_at and status
    const getTimelineStepTimes = (cmd: Order) => {
        if (!cmd.created_at) {
            return { accepte: "--:--", arrive: "--:--", en_route: "--:--", livree: "--:--" };
        }
        try {
            const d = new Date(cmd.created_at);
            if (isNaN(d.getTime())) return { accepte: "--:--", arrive: "--:--", en_route: "--:--", livree: "--:--" };

            const formatH = (dateObj: Date) => dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const accepteTime = formatH(d);

            // Compute relative step intervals
            const dArrive = new Date(d.getTime() + 6 * 60000);
            const dEnRoute = new Date(d.getTime() + 9 * 60000);
            const dLivree = new Date(d.getTime() + 24 * 60000);

            const isSearching = cmd.status === 'search';
            const isConfirmed = ['confirmed', 'ready', 'in_progress', 'delivered'].includes(cmd.status) || Boolean(cmd.confirmation);
            const hasAccepte = Boolean(cmd.livreur && ['accepted', 'confirmed', 'ready', 'in_progress', 'delivered'].includes(cmd.status));
            const hasArrive = ['ready', 'in_progress', 'delivered', 'annule_par_livreur'].includes(cmd.status);
            const hasEnRoute = ['in_progress', 'delivered'].includes(cmd.status);
            const hasLivree = cmd.status === 'delivered';

            return {
                accepte: (hasAccepte || isSearching || isConfirmed) ? accepteTime : "--:--",
                arrive: hasArrive ? formatH(dArrive) : "--:--",
                en_route: hasEnRoute ? formatH(dEnRoute) : "--:--",
                livree: hasLivree ? formatH(dLivree) : "--:--",
            };
        } catch {
            return { accepte: "--:--", arrive: "--:--", en_route: "--:--", livree: "--:--" };
        }
    };

    // Render Status Badge
    const renderStatusBadge = (status: string, confirmation?: unknown, hasDriver?: boolean) => {
        if (status === "annule_par_client") {
            return (
                <span className="px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-rose-600 text-white tracking-wide uppercase shadow-sm flex items-center gap-1" title="Annulée par le client">
                    ANNULÉE (CLIENT)
                </span>
            );
        }
        if (status === "annule_par_livreur") {
            return (
                <span className="px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-rose-600 text-white tracking-wide uppercase shadow-sm flex items-center gap-1" title="Annulée par le livreur">
                    ANNULÉE (LIVREUR)
                </span>
            );
        }
        if (confirmation === "refuse" || status === "canceled") {
            return (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/90 text-white tracking-wide uppercase shadow-sm" title="Annulée par le centre de confirmation">
                    ANNULÉE
                </span>
            );
        }
        if (status === "in_progress" || status === "livreur_pret_commande") {
            return (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 text-white tracking-wide uppercase shadow-sm flex items-center gap-1">
                    EN LIVRAISON
                </span>
            );
        }
        if (status === "delivered") {
            return (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-700 text-white tracking-wide uppercase shadow-sm">
                    LIVRÉE
                </span>
            );
        }
        if (status === "ready") {
            return (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500 text-white tracking-wide uppercase shadow-sm flex items-center gap-1">
                    <MdRestaurantMenu className="text-xs" />
                    PRIS À LIVRER
                </span>
            );
        }
        if (status === "search") {
            return (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white tracking-wide uppercase shadow-sm flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    DIFFUSÉE (3 KM)
                </span>
            );
        }
        if (status === "confirmed") {
            return (
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${hasDriver ? 'bg-blue-600' : 'bg-sky-600'} text-white tracking-wide uppercase shadow-sm flex items-center gap-1`}>
                    {hasDriver ? "ASSIGNÉE" : "CONFIRMÉE"}
                </span>
            );
        }
        return (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/90 text-white tracking-wide uppercase shadow-sm">
                EN ATTENTE
            </span>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200">
            {/* Top Global Control Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-lg">
                            <MdMap />
                        </span>
                        <div>
                            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
                                Dispatch & Monitoring Live
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    wsConnected 
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" 
                                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                }`}>
                                    <MdFiberManualRecord className={`text-[8px] ${wsConnected ? "text-emerald-500 animate-ping" : "text-amber-500"}`} />
                                    {wsConnected ? "EN DIRECT TEMPS RÉEL" : "RECONNEXION..."}
                                </span>
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Center / Right Quick Controls */}
                <div className="flex items-center gap-2.5">
                    {/* Audio Chime Notification Toggle */}
                    <button
                        onClick={() => {
                            setSoundEnabled(prev => !prev);
                            toast(soundEnabled ? "Son des notifications désactivé" : "Son des notifications activé 🔔", {
                                icon: soundEnabled ? "🔇" : "🔔"
                            });
                        }}
                        title={soundEnabled ? "Désactiver le son d'alerte" : "Activer le son d'alerte"}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            soundEnabled 
                                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100" 
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                        }`}
                    >
                        {soundEnabled ? <MdVolumeUp className="text-base" /> : <MdVolumeOff className="text-base" />}
                        <span className="hidden sm:inline">{soundEnabled ? "Son Actif" : "Son Muet"}</span>
                    </button>

                    {/* Wilaya selector */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <MdLocationOn className="text-blue-500 dark:text-blue-400 text-sm" />
                        <select
                            value={selectedWilaya}
                            onChange={(e) => setSelectedWilaya(e.target.value)}
                            className="bg-transparent text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer pr-1"
                        >
                            <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Toutes les wilayas</option>
                            {Wilaya.map((w) => (
                                <option key={w.code} value={w.name} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                                    {String(w.code).padStart(2, '0')} - {w.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date selector */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <MdCalendarToday className="text-blue-500 dark:text-blue-400 text-xs" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
                            title="Filtrer les commandes par date"
                        />
                        {selectedDate && (
                            <button
                                onClick={() => setSelectedDate("")}
                                className="text-[11px] text-slate-400 hover:text-rose-500 font-bold px-0.5"
                                title="Réinitialiser la date"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Create Express Order Button */}
                    <Link
                        href="/dashboard/confirmation/create_commande"
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                        title="Créer manuellement une commande avec client, géolocalisation et assignation livreur"
                    >
                        <span>+ Créer Commande</span>
                    </Link>

                    {/* Refresh button */}
                    <button
                        onClick={() => {
                            fetchCommandes();
                            fetchLivreurs();
                            toast.success("Données actualisées !");
                        }}
                        title="Rafraîchir les données"
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                        <MdRefresh className="text-base" />
                    </button>
                </div>
            </div>

            {/* 3-Column Main Content Layout with Dynamic Resizable Orders Panel */}
            <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden w-full h-full">
                
                {/* 1. LEFT PANEL: LIST OF COMMANDES (Dynamically Resizable) */}
                <div 
                    suppressHydrationWarning
                    style={{ width: isMounted ? `${cmdPanelWidth}px` : undefined }}
                    className="w-full lg:w-auto shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden"
                >
                    {/* Panel Header */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0 bg-white/95 dark:bg-slate-900/90">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    Tasks & Commandes
                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-400/30">
                                        {commandes.length}
                                    </span>
                                </h2>
                                {newOrderIds.size > 0 && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                        <MdBolt className="text-xs" />
                                        +{newOrderIds.size} reçues
                                    </span>
                                )}
                            </div>

                            {/* Width Presets Controls */}
                            <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700 text-[10px]">
                                <button
                                    onClick={() => setWidthPreset(360)}
                                    title="Largeur compacte (360px)"
                                    className={`px-1.5 py-0.5 font-bold rounded transition-all ${cmdPanelWidth <= 380 ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    S
                                </button>
                                <button
                                    onClick={() => setWidthPreset(480)}
                                    title="Largeur standard (480px)"
                                    className={`px-1.5 py-0.5 font-bold rounded transition-all ${cmdPanelWidth > 380 && cmdPanelWidth <= 540 ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    M
                                </button>
                                <button
                                    onClick={() => setWidthPreset(620)}
                                    title="Largeur large (620px)"
                                    className={`px-1.5 py-0.5 font-bold rounded transition-all ${cmdPanelWidth > 540 && cmdPanelWidth <= 690 ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    L
                                </button>
                                <button
                                    onClick={() => setWidthPreset(780)}
                                    title="Largeur maximale (780px)"
                                    className={`px-1.5 py-0.5 font-bold rounded transition-all ${cmdPanelWidth > 690 ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    XL
                                </button>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <MdSearch className="absolute left-3 top-2.5 text-slate-400 text-base" />
                            <input
                                type="text"
                                placeholder="Rechercher resto, client, ID, tél..."
                                value={commandeSearch}
                                onChange={(e) => setCommandeSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-950 text-xs text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>

                    {/* Pending Client Phone Requests Alert Banner */}
                    {pendingPhoneRequests.length > 0 && (
                        <div className="mx-3 mt-3 p-3 bg-amber-500/15 border-2 border-amber-500/60 rounded-2xl flex flex-col gap-2 shadow-lg">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                                    <MdPhone className="text-base animate-bounce" />
                                    {pendingPhoneRequests.length} Demande(s) de Numéro Client
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-900 text-[10px] font-black">
                                    ACTION REQUISE
                                </span>
                            </div>
                            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                                {pendingPhoneRequests.map((req) => (
                                    <div
                                        key={req.commande_id}
                                        className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-500/30 flex flex-col gap-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">⏳ En attente</span>
                                            <span className="text-[10px] text-slate-400">{req.timestamp ? new Date(req.timestamp).toLocaleString('fr-FR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : ''}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                                            <div><span className="text-slate-400">Livreur</span><p className="font-bold text-slate-900 dark:text-white truncate">{req.livreur_name}</p></div>
                                            <div><span className="text-slate-400">Commande</span><p className="font-bold text-slate-900 dark:text-white">#{req.commande_id}</p></div>
                                            <div><span className="text-slate-400">Client</span><p className="font-bold text-slate-900 dark:text-white truncate">{(req as any).client_name ?? '—'}</p></div>
                                            <div><span className="text-slate-400">Magasin</span><p className="font-bold text-slate-900 dark:text-white truncate">{(req as any).magasin_name ?? '—'}</p></div>
                                        </div>
                                        <p className="text-[11px] bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400">
                                            <span className="font-semibold">Raison :</span> {req.reason}{req.comment ? ` — ${req.comment}` : ''}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    await approveOrRejectClientPhone({ commande_id: req.commande_id, approved: false });
                                                    setPendingPhoneRequests(prev => prev.filter(r => r.commande_id !== req.commande_id));
                                                }}
                                                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center"
                                            >
                                                ✕ REFUSER
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const res = await approveOrRejectClientPhone({ commande_id: req.commande_id, approved: true });
                                                    if (res?.success) {
                                                        setPendingPhoneRequests(prev => prev.filter(r => r.commande_id !== req.commande_id));
                                                        setCommandes(prev => prev.map(c => c.id === req.commande_id ? { ...c, status: 'in_progress' } : c));
                                                    }
                                                }}
                                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-1"
                                            >
                                                <MdCheckCircle className="text-sm" /> ACCEPTER
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filter Status Tabs */}
                    <div className="p-3 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto scrollbar-none text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <button
                            onClick={() => setSelectedStatusTab("all")}
                            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                                selectedStatusTab === "all" ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold" : "hover:text-slate-900 dark:hover:text-slate-200"
                            }`}
                        >
                            ALL ({counts.cmdAll})
                        </button>
                        {pendingPhoneRequests.length > 0 && (
                            <button
                                onClick={() => setSelectedStatusTab("phone_requests")}
                                className={`px-2.5 py-1 rounded-lg shrink-0 transition-all flex items-center gap-1 ${
                                    selectedStatusTab === "phone_requests" 
                                        ? "bg-amber-500 text-slate-900 font-extrabold shadow-sm" 
                                        : "bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold animate-pulse"
                                }`}
                            >
                                <MdPhone className="text-xs" />
                                DEMANDES N° ({pendingPhoneRequests.length})
                            </button>
                        )}
                        <button
                            onClick={() => setSelectedStatusTab("pending")}
                            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                                selectedStatusTab === "pending" ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold" : "hover:text-slate-900 dark:hover:text-slate-200"
                            }`}
                        >
                            EN ATTENTE ({counts.cmdPending})
                        </button>
                        <button
                            onClick={() => setSelectedStatusTab("search")}
                            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all flex items-center gap-1.5 ${
                                selectedStatusTab === "search" 
                                    ? "bg-purple-600 text-white font-bold shadow-sm" 
                                    : "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-bold"
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-300 animate-ping"></span>
                            DIFFUSÉE ({counts.cmdSearch})
                        </button>
                        <button
                            onClick={() => setSelectedStatusTab("confirmed")}
                            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                                selectedStatusTab === "confirmed" ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-bold" : "hover:text-slate-900 dark:hover:text-slate-200"
                            }`}
                        >
                            CONFIRMÉE / ASSIGNÉE ({counts.cmdConfirmed})
                        </button>
                        <button
                            onClick={() => setSelectedStatusTab("in_progress")}
                            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                                selectedStatusTab === "in_progress" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold" : "hover:text-slate-900 dark:hover:text-slate-200"
                            }`}
                        >
                            EN LIVRAISON ({counts.cmdInProgress})
                        </button>
                        <button
                            onClick={() => setSelectedStatusTab("delivered")}
                            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                                selectedStatusTab === "delivered" ? "bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 font-bold" : "hover:text-slate-900 dark:hover:text-slate-200"
                            }`}
                        >
                            LIVRÉE ({counts.cmdDelivered})
                        </button>
                        <button
                            onClick={() => setSelectedStatusTab("canceled")}
                            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                                selectedStatusTab === "canceled" ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold" : "hover:text-slate-900 dark:hover:text-slate-200"
                            }`}
                        >
                            ANNULÉE ({counts.cmdCanceled})
                        </button>
                    </div>
                </div>

                    {/* Scrollable Commandes Cards List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-2">
                        {loadingCommandes ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 gap-2">
                                <TbLoader3 className="animate-spin text-3xl text-blue-500" />
                                <span className="text-xs">Chargement des commandes...</span>
                            </div>
                        ) : filteredCommandes.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                                Aucune commande trouvée.
                            </div>
                        ) : (
                            filteredCommandes.map((cmd) => {
                                const isColis = Boolean(
                                    cmd.type_service === 'colis' ||
                                    cmd.type_service === 'service_colis' ||
                                    cmd.order_type === 'colis' ||
                                    cmd.order_type === 'service_livreur' ||
                                    cmd.is_colis ||
                                    cmd.colis_info ||
                                    (!cmd.magasin && !cmd.magasin_info?.name)
                                );
                                const isSelected = selectedOrder?.id === cmd.id;
                                const isNew = newOrderIds.has(cmd.id);
                                const phoneReq = pendingPhoneRequests.find(r => r.commande_id === cmd.id);
                                const stepTimes = getTimelineStepTimes(cmd);

                                const hasDriver = Boolean(cmd.livreur && (cmd.livreur.partenneur?.user || cmd.livreur.user || cmd.livreur.id));
                                const isSearching = cmd.status === 'search';
                                const isConfirmed = ['confirmed', 'ready', 'in_progress', 'delivered'].includes(cmd.status) || Boolean(cmd.confirmation);
                                const hasAccepte = Boolean(hasDriver && ['accepted', 'confirmed', 'ready', 'in_progress', 'delivered'].includes(cmd.status));
                                const hasArrive = ['ready', 'in_progress', 'delivered', 'annule_par_livreur'].includes(cmd.status);
                                const hasEnRoute = ['in_progress', 'delivered'].includes(cmd.status);
                                const hasLivree = cmd.status === 'delivered';

                                const driverName = cmd.livreur?.partenneur?.user?.first_name 
                                    ? `${cmd.livreur.partenneur.user.first_name} ${cmd.livreur.partenneur.user.last_name || ''}`.trim()
                                    : cmd.livreur?.partenneur?.user?.username || cmd.livreur?.user?.first_name || (hasDriver ? `Livreur #${cmd.livreur?.id}` : null);
                                const paymentMode = "cache";

                                return (
                                    <div
                                        key={cmd.id}
                                        onClick={() => setSelectedOrder(cmd)}
                                        className={`group rounded-3xl p-4 border transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
                                            phoneReq
                                                ? "bg-amber-500/10 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/70 shadow-lg"
                                                : isSelected 
                                                ? isColis
                                                    ? "bg-purple-100/90 dark:bg-purple-950/90 border-purple-500 shadow-lg ring-2 ring-purple-500"
                                                    : "bg-blue-50/80 dark:bg-slate-800/90 border-blue-500 shadow-md ring-2 ring-blue-500" 
                                                : isColis
                                                ? "bg-purple-50/70 dark:bg-purple-950/30 border-purple-400/80 dark:border-purple-600/70 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 shadow-xs"
                                                : isNew
                                                ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-400/50 shadow-sm"
                                                : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
                                        }`}
                                    >
                                        {/* Row 1: Header - #ID + Date on Left, Status Badge on Right */}
                                        <div className="flex items-start justify-between gap-2 mb-2.5">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                                                        #{cmd.id}
                                                    </span>
                                                    {phoneReq ? (
                                                        <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-900 text-[9px] font-black animate-bounce flex items-center gap-1">
                                                            <MdPhone className="text-xs" />
                                                            DEMANDE N°
                                                        </span>
                                                    ) : isNew ? (
                                                        <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-extrabold animate-pulse">
                                                            NOUVEAU
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {/* Service Colis Tag */}
                                                    {isColis && (
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[9px] font-black tracking-wide flex items-center gap-1 shadow-xs">
                                                                <MdLocalShipping className="text-xs" />
                                                                SERVICE COLIS
                                                            </span>
                                                            {cmd.colis_info?.est_fragile && (
                                                                <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black tracking-wider animate-pulse">
                                                                    FRAGILE
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Date & Heure */}
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                    <MdCalendarToday className="text-blue-500 text-xs shrink-0" />
                                                    <span>{formatDateTime(cmd.created_at) || "Date inconnue"}</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                {renderStatusBadge(cmd.status, cmd.confirmation, hasDriver)}
                                            </div>
                                        </div>

                                        {/* Row 2: Store / Magasin on Left, "commande pris : HH:MM" on Right */}
                                        <div className="flex items-center justify-between gap-2 py-2 border-t border-slate-100 dark:border-slate-800/60">
                                            {isColis ? (
                                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                                    {cmd.colis_info?.image ? (
                                                        <div 
                                                            className="w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-400 dark:border-purple-600 shrink-0 cursor-pointer relative group/img shadow-sm hover:ring-2 hover:ring-purple-400 transition-all"
                                                            title="Cliquer pour agrandir la photo du produit"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPreviewColisImage(cmd.colis_info?.image || null);
                                                            }}
                                                        >
                                                            <img 
                                                                src={cmd.colis_info.image.startsWith('http') ? cmd.colis_info.image : `${process.env.NEXT_PUBLIC_SERVER || 'http://127.0.0.1:8000'}${cmd.colis_info.image}`} 
                                                                alt={cmd.colis_info.nom_produit || "Colis"} 
                                                                className="w-full h-full object-cover transition-transform group-hover/img:scale-110" 
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                                                🔍
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm shrink-0 mt-0.5 shadow-xs">
                                                            <MdLocalShipping />
                                                        </div>
                                                    )}
                                                    <div className="truncate flex-1">
                                                        <p className="font-extrabold text-purple-900 dark:text-purple-200 text-xs sm:text-sm truncate flex items-center gap-1.5">
                                                            <span>📦 {cmd.colis_info?.nom_produit || (cmd.articles_commandes?.[0]?.article?.name) || "Colis / Marchandise"}</span>
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Départ:</span> {cmd.colis_info?.adresse_depart || cmd.colis_info?.point_depart || "Point de départ"}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                            <span className="text-purple-600 dark:text-purple-400 font-bold">Livraison:</span> {cmd.colis_info?.adresse_livraison || cmd.colis_info?.point_livraison || cmd.distination || "Point de livraison"}
                                                        </p>
                                                        {(cmd.colis_info?.hauteur || cmd.colis_info?.poids) && (
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                                                                {cmd.colis_info?.hauteur && cmd.colis_info?.largeur && (
                                                                    <span className="mr-2">📏 {cmd.colis_info.hauteur}x{cmd.colis_info.largeur} cm</span>
                                                                )}
                                                                {cmd.colis_info?.poids && (
                                                                    <span>⚖️ {cmd.colis_info.poids} kg</span>
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm shrink-0 mt-0.5">
                                                        <MdStorefront />
                                                    </div>
                                                    <div className="truncate flex-1">
                                                        <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                                                            {cmd.magasin_info?.name || "Magasin"}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                                            {cmd.magasin_info?.adresse || cmd.magasin_info?.address || "Adresse non spécifiée"}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="text-right shrink-0">
                                                {editingTripTimeOrderId === cmd.id ? (
                                                    <div 
                                                        className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-blue-500 shadow-md"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <input
                                                            type="text"
                                                            value={tempTripTime}
                                                            onChange={(e) => setTempTripTime(e.target.value)}
                                                            placeholder="ex: 23:00 ou 15 min"
                                                            className="w-28 px-2 py-1 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-bold text-slate-900 dark:text-white"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    handleSaveTripTime(cmd.id, tempTripTime, cmd.status);
                                                                } else if (e.key === "Escape") {
                                                                    setEditingTripTimeOrderId(null);
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => handleSaveTripTime(cmd.id, tempTripTime, cmd.status)}
                                                            className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                                                            title="Enregistrer"
                                                        >
                                                            <MdCheck />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingTripTimeOrderId(null)}
                                                            className="p-1 bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-600 dark:text-slate-300 hover:text-rose-600 rounded-lg text-xs font-bold"
                                                            title="Annuler"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingTripTimeOrderId(cmd.id);
                                                            setTempTripTime(cmd.trip_time || stepTimes.accepte || formatTime(cmd.created_at) || "");
                                                        }}
                                                        className="group/time flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer shadow-xs"
                                                        title="Cliquer pour modifier l'heure de prise au restaurant (visible par le livreur)"
                                                    >
                                                        <span>commande pris : <strong className="font-extrabold text-slate-900 dark:text-white">{cmd.trip_time || stepTimes.accepte || formatTime(cmd.created_at) || "--:--"}</strong></span>
                                                        <MdEdit className="text-xs text-slate-400 group-hover/time:text-blue-500 shrink-0" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Row 3: Client on Left, Payment pill badge on Right */}
                                        <div className="flex items-center justify-between gap-2 py-2 border-t border-slate-100 dark:border-slate-800/60">
                                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                                <div className="w-7 h-7 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-sm shrink-0 mt-0.5">
                                                    <MdPerson />
                                                </div>
                                                <div className="truncate flex-1">
                                                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate flex items-center gap-1.5 flex-wrap">
                                                        <span className="truncate">{cmd.client_info?.first_name || ""} {cmd.client_info?.last_name || cmd.client_info?.username || "Client"}</span>
                                                        <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                                                            ({cmd.client_info?.nbr_commandes ?? cmd.client_info?.delivered_orders_count ?? cmd.client_delivered_count ?? (cmd.client_info as any)?.commandes_count ?? 0} commande{(cmd.client_info?.nbr_commandes ?? cmd.client_info?.delivered_orders_count ?? cmd.client_delivered_count ?? 0) > 1 ? "s" : ""} livrée{(cmd.client_info?.nbr_commandes ?? cmd.client_info?.delivered_orders_count ?? cmd.client_delivered_count ?? 0) > 1 ? "s" : ""})
                                                        </span>
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                                        {cmd.distination || "Adresse client"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                <span className="px-4 py-1 rounded-full text-xs font-black bg-[#00ff40] text-black shadow-sm tracking-wide">
                                                    {paymentMode}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Urgent Client Phone Request Interactive Box */}
                                        {phoneReq && (
                                            <div className="mb-2.5 p-2.5 bg-amber-500/20 dark:bg-amber-950/40 border border-amber-500/60 rounded-xl flex flex-col gap-2 ring-1 ring-amber-500 animate-pulse">
                                                <div className="flex items-center justify-between gap-1.5">
                                                    <span className="flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-300">
                                                        <MdPhone className="text-sm animate-bounce" />
                                                        Livreur demande N° ({phoneReq.reason})
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                        {formatTime(phoneReq.timestamp)}
                                                    </span>
                                                </div>
                                                {phoneReq.comment && (
                                                    <p className="text-[11px] text-slate-700 dark:text-slate-200 italic font-medium">
                                                        &quot;{phoneReq.comment}&quot;
                                                    </p>
                                                )}
                                                <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-500/30">
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            await approveOrRejectClientPhone({ commande_id: cmd.id, approved: false });
                                                            setPendingPhoneRequests(prev => prev.filter(r => r.commande_id !== cmd.id));
                                                        }}
                                                        className="px-2.5 py-1 bg-slate-200 hover:bg-rose-100 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-colors"
                                                    >
                                                        Refuser
                                                    </button>
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            const res = await approveOrRejectClientPhone({ commande_id: cmd.id, approved: true });
                                                            if (res?.success) {
                                                                setPendingPhoneRequests(prev => prev.filter(r => r.commande_id !== cmd.id));
                                                                setCommandes(prev => prev.map(c => c.id === cmd.id ? { ...c, status: 'in_progress' } : c));
                                                            }
                                                        }}
                                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg shadow-sm transition-colors flex items-center gap-1"
                                                    >
                                                        <MdCheckCircle className="text-xs" />
                                                        Autoriser N°
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Row 4: Driver, Details, Price & 4-Step Timeline (Fully responsive, never cuts off) */}
                                        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-2">
                                            
                                            {/* Sub-row 1: Driver on Left, Details + Price + Action Menu on Right */}
                                            <div className="flex items-center justify-between gap-2">
                                                {/* Left: Driver Icon & Name */}
                                                {hasDriver && driverName ? (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 min-w-0">
                                                        <MdDeliveryDining className="text-lg shrink-0" />
                                                        <span className="truncate max-w-[240px] flex items-center gap-1" title={driverName}>
                                                            <span className="truncate">{driverName}</span>
                                                            {(() => {
                                                                const count = (cmd.livreur as any)?.partenneur?.user?.nbr_commandes ?? (cmd.livreur as any)?.user?.nbr_commandes ?? cmd.livreur?.nbr_commandes ?? cmd.livreur?.delivered_orders_count ?? cmd.livreur_delivered_count ?? 0;
                                                                return (
                                                                    <span className="text-[10.5px] font-extrabold text-slate-600 dark:text-slate-400 shrink-0">
                                                                        ({count} commande{count > 1 ? "s" : ""} livrée{count > 1 ? "s" : ""})
                                                                </span>
                                                                );
                                                            })()}
                                                        </span>
                                                    </div>
                                                ) : cmd.status === "search" ? (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold min-w-0">
                                                        <MdDeliveryDining className="text-lg shrink-0 text-purple-500 animate-bounce" />
                                                        <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[11px] font-extrabold border border-purple-500/30 flex items-center gap-1">
                                                            Diffusée aux livreurs (Recherche en cours...)
                                                        </span>
                                                    </div>
                                                ) : cmd.status === "confirmed" && !hasDriver ? (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold min-w-0">
                                                        <MdDeliveryDining className="text-lg shrink-0 text-sky-500" />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDispatchOrder(cmd);
                                                            }}
                                                            className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 hover:bg-sky-500 hover:text-white text-[11px] font-extrabold border border-sky-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                                            title="Cliquer pour assigner un livreur ou diffuser la commande"
                                                        >
                                                            Confirmée (Assigner / Diffuser)
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold min-w-0">
                                                        <MdDeliveryDining className="text-lg shrink-0 text-amber-500" />
                                                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-extrabold border border-amber-500/30">
                                                            Sans livreur (En attente)
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Right: Details Button + Price + 3-dots Menu */}
                                                <div className="flex items-center gap-1.5 shrink-0 relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDetailsOrder(cmd);
                                                        }}
                                                        className="px-3 py-1 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1"
                                                    >
                                                        Détails
                                                    </button>
                                                    <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm pl-1">
                                                        {Number(cmd.total_price || 0).toFixed(2)} DZD
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuOrderId(prev => prev === cmd.id ? null : cmd.id);
                                                        }}
                                                        className={`p-1.5 rounded-lg transition-colors ${
                                                            activeMenuOrderId === cmd.id 
                                                                ? "bg-blue-600 text-white shadow-sm" 
                                                                : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                                        }`}
                                                        title="Actions"
                                                    >
                                                        <MdMoreVert className="text-base" />
                                                    </button>

                                                    {/* Popover Action Menu */}
                                                    {activeMenuOrderId === cmd.id && (
                                                        <div 
                                                            className="absolute right-0 top-9 z-30 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 font-sans flex flex-col gap-1 animate-scaleUp"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {/* Driver Tracking Timeline button */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveMenuOrderId(null);
                                                                    setDriverTimelineOrder(cmd);
                                                                }}
                                                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                                                            >
                                                                <MdTimeline className="text-base text-blue-500" />
                                                                <span>Détail Heures & Livreur</span>
                                                            </button>

                                                            {/* Pass Ready / Pris à livrer button */}
                                                            {cmd.status !== 'ready' && cmd.status !== 'delivered' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveMenuOrderId(null);
                                                                        setStatusDialogData({ order: cmd, targetStatus: 'ready' });
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <MdRestaurantMenu className="text-base text-amber-500" />
                                                                    <span>Pris à livrer (Ready)</span>
                                                                </button>
                                                            )}

                                                            {/* Pass In Progress button */}
                                                            {cmd.status !== 'in_progress' && cmd.status !== 'delivered' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveMenuOrderId(null);
                                                                        setStatusDialogData({ order: cmd, targetStatus: 'in_progress' });
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <MdDeliveryDining className="text-base text-blue-500" />
                                                                    <span>Passer En Livraison</span>
                                                                </button>
                                                            )}

                                                            {/* Mark Delivered button */}
                                                            {cmd.status !== 'delivered' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveMenuOrderId(null);
                                                                        setStatusDialogData({ order: cmd, targetStatus: 'delivered' });
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <MdCheckCircle className="text-base text-emerald-500" />
                                                                    <span>Marquer Livrée</span>
                                                                </button>
                                                            )}

                                                            {/* Restore / Confirm (for canceled or pending orders) */}
                                                            {(['canceled', 'annule_par_client', 'annule_par_livreur', 'pending'].includes(cmd.status)) && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveMenuOrderId(null);
                                                                        setStatusDialogData({ order: cmd, targetStatus: 'confirmed' });
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <MdRestore className="text-base text-sky-500" />
                                                                    <span>Rétablir / Confirmer</span>
                                                                </button>
                                                            )}

                                                            {/* Cancel order button (for active non-cancelled, non-delivered orders) */}
                                                            {!['canceled', 'annule_par_client', 'annule_par_livreur', 'delivered'].includes(cmd.status) && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveMenuOrderId(null);
                                                                        setStatusDialogData({ order: cmd, targetStatus: 'canceled' });
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <MdCancel className="text-base text-rose-500" />
                                                                    <span>Annuler la commande</span>
                                                                </button>
                                                            )}

                                                            {/* View Details */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveMenuOrderId(null);
                                                                    setDetailsOrder(cmd);
                                                                }}
                                                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                                                            >
                                                                <MdPerson className="text-base text-slate-400" />
                                                                <span>Détails & Articles</span>
                                                            </button>

                                                            {/* Dispatch */}
                                                            {cmd.status !== 'delivered' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveMenuOrderId(null);
                                                                        setDispatchOrder(cmd);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2 transition-colors border-t border-slate-100 dark:border-slate-800 pt-1.5"
                                                                >
                                                                    <MdBolt className="text-base" />
                                                                    <span>Diffuser / Assigner</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Sub-row 2: 4-Step Professional Timeline (Full width, perfectly distributed) */}
                                            <div 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDriverTimelineOrder(cmd);
                                                }}
                                                className="w-full cursor-pointer group/timeline p-1.5 rounded-xl hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-all bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/40"
                                                title="Cliquer pour voir le détail des dates et heures du livreur"
                                            >
                                                {/* Times */}
                                                <div className="grid grid-cols-4 text-center mb-0.5">
                                                    <span className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                                                        {stepTimes.accepte}
                                                    </span>
                                                    <span className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                                                        {stepTimes.arrive}
                                                    </span>
                                                    <span className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                                                        {stepTimes.en_route}
                                                    </span>
                                                    <span className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                                                        {stepTimes.livree}
                                                    </span>
                                                </div>

                                                {/* Track & Icons */}
                                                <div className="relative flex items-center justify-between px-3 py-1">
                                                    <div className="absolute left-5 right-5 top-1/2 -translate-y-1/2 h-[2px] bg-slate-300 dark:bg-slate-700 z-0" />

                                                    {/* Icon 1: Accepte / Confirmee / Diffusee */}
                                                    <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-xs ring-2 ring-white dark:ring-slate-900 shadow-sm transition-all ${
                                                        hasAccepte 
                                                            ? 'bg-emerald-500 text-white' 
                                                            : isSearching
                                                            ? 'bg-purple-600 text-white animate-pulse ring-purple-400'
                                                            : isConfirmed
                                                            ? 'bg-sky-600 text-white ring-sky-300'
                                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                                                    }`} title={hasAccepte ? "Assignée / Acceptée par le livreur" : isSearching ? "Diffusée aux livreurs (Recherche en cours...)" : isConfirmed ? "Commande confirmée" : "En attente de confirmation"}>
                                                        {isSearching && !hasAccepte ? (
                                                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                                        ) : (
                                                            <MdCheck className="text-[11px]" />
                                                        )}
                                                    </div>

                                                    {/* Icon 2: Arrive */}
                                                    <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-xs ring-2 ring-white dark:ring-slate-900 shadow-sm transition-all ${
                                                        hasArrive 
                                                            ? 'bg-blue-500 text-white' 
                                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                                                    }`} title="Arrivé au magasin">
                                                        <MdStorefront className="text-[10.5px]" />
                                                    </div>

                                                    {/* Icon 3: En route */}
                                                    <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-xs ring-2 ring-white dark:ring-slate-900 shadow-sm transition-all ${
                                                        hasEnRoute 
                                                            ? 'bg-[#172554] text-white animate-pulse' 
                                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                                                    }`} title="En route vers le client">
                                                        <MdTwoWheeler className="text-[11px]" />
                                                    </div>

                                                    {/* Icon 4: Livree */}
                                                    <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-xs ring-2 ring-white dark:ring-slate-900 shadow-sm transition-all ${
                                                        hasLivree 
                                                            ? 'bg-yellow-400 text-slate-950 font-black' 
                                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                                                    }`} title="Livrée">
                                                        <MdDoneAll className="text-[11px]" />
                                                    </div>
                                                </div>

                                                {/* Labels */}
                                                <div className="grid grid-cols-4 text-center mt-0.5">
                                                    <span className={`text-[10.5px] font-bold ${
                                                        hasAccepte 
                                                            ? 'text-emerald-600 dark:text-emerald-400' 
                                                            : isSearching 
                                                            ? 'text-purple-600 dark:text-purple-400 font-extrabold flex items-center justify-center gap-0.5' 
                                                            : isConfirmed 
                                                            ? 'text-sky-600 dark:text-sky-400 font-bold' 
                                                            : 'text-slate-400 dark:text-slate-500'
                                                    }`}>
                                                        {isSearching && !hasAccepte && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />}
                                                        {hasAccepte ? 'accepte' : isSearching ? 'diffusée' : isConfirmed ? 'confirmée' : 'accepte'}
                                                    </span>
                                                    <span className="text-[10.5px] font-bold text-blue-600 dark:text-blue-400">
                                                        arrive
                                                    </span>
                                                    <span className="text-[10.5px] font-bold text-[#1e3a8a] dark:text-[#93c5fd]">
                                                        en route
                                                    </span>
                                                    <span className="text-[10.5px] font-bold text-yellow-500 dark:text-yellow-400">
                                                        livree
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Draggable Divider Handle */}
                <div
                    onMouseDown={handleMouseDownResizer}
                    onDoubleClick={() => setWidthPreset(480)}
                    title="Glisser pour ajuster la largeur des commandes (Double-clic pour réinitialiser)"
                    className={`hidden lg:flex items-center justify-center w-2 hover:w-3 cursor-col-resize select-none z-20 group transition-all duration-150 shrink-0 ${
                        isDraggingResizer 
                            ? "bg-blue-500 w-3 cursor-col-resize ring-2 ring-blue-500/50" 
                            : "bg-slate-200/80 dark:bg-slate-800 hover:bg-blue-400 dark:hover:bg-blue-500"
                    }`}
                >
                    <div className="w-0.5 h-8 rounded-full bg-slate-400 group-hover:bg-white transition-colors" />
                </div>

                {/* 2. MIDDLE PANEL: GOOGLE MAP (Flex-1 / takes remaining space) */}
                <div className="flex-1 min-w-0 relative bg-slate-950 flex flex-col h-full overflow-hidden border-r border-slate-200 dark:border-slate-800">
                    <DispatchMap
                        livreurs={livreurs}
                        commandes={commandes}
                        selectedWilaya={selectedWilaya}
                        selectedOrder={selectedOrder}
                        selectedLivreur={selectedLivreur}
                        onSelectOrder={(ord) => setSelectedOrder(ord)}
                        onSelectLivreur={(liv) => setSelectedLivreur(liv)}
                        onAssignOrder={(ord) => setDispatchOrder(ord)}
                        onToggleBlockLivreur={async (liv) => {
                            const isCurrentlyBlocked = Boolean(liv.is_blocked || liv.user?.bloquer);
                            const ok = await toggleBlockLivreur({ livreur_id: liv.id, bloquer: !isCurrentlyBlocked });
                            if (ok) {
                                fetchLivreurs();
                            }
                        }}
                    />
                </div>

                {/* Draggable Divider Handle for Livreurs Panel */}
                <div
                    onMouseDown={handleMouseDownLivResizer}
                    onDoubleClick={() => setLivWidthPreset(360)}
                    title="Glisser pour ajuster la largeur des livreurs (Double-clic pour réinitialiser)"
                    className={`hidden lg:flex items-center justify-center w-2 hover:w-3 cursor-col-resize select-none z-20 group transition-all duration-150 shrink-0 ${
                        isDraggingLivResizer 
                            ? "bg-emerald-500 w-3 cursor-col-resize ring-2 ring-emerald-500/50" 
                            : "bg-slate-200/80 dark:bg-slate-800 hover:bg-emerald-400 dark:hover:bg-emerald-500"
                    }`}
                >
                    <div className="w-0.5 h-8 rounded-full bg-slate-400 group-hover:bg-white transition-colors" />
                </div>

                {/* 3. RIGHT PANEL: LIVREURS & FLEET (Dynamically Resizable + Messenger Bubble Story View) */}
                <div 
                    suppressHydrationWarning
                    style={{ width: isMounted ? `${livPanelWidth}px` : undefined }}
                    className="w-full lg:w-auto shrink-0 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden"
                >
                    {/* Panel Header */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2 shrink-0 bg-white/95 dark:bg-slate-900/90">
                        {livPanelWidth < 220 ? (
                            /* Compact Bubble Header */
                            <div className="flex flex-col items-center text-center gap-1.5">
                                <div className="flex flex-col items-center">
                                    <h2 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider leading-tight">
                                        AGENTS<br />&<br />LIVREURS
                                    </h2>
                                    <span className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-300 border border-emerald-400/30">
                                        {counts.livOnline} EN LIGNE
                                    </span>
                                </div>

                                {/* Width Presets for Compact Header */}
                                <div className="flex items-center justify-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700 text-[9px] w-full">
                                    <button
                                        onClick={() => setLivWidthPreset(130)}
                                        title="Vue Cercles Messenger (130px)"
                                        className={`flex-1 py-0.5 font-bold rounded transition-all ${livPanelWidth < 200 ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                    >
                                        XS
                                    </button>
                                    <button
                                        onClick={() => setLivWidthPreset(360)}
                                        title="Agrandir en mode liste (360px)"
                                        className="flex-1 py-0.5 font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded transition-all"
                                    >
                                        M
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Standard Wide Header */
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                            Agents & Livreurs
                                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-400/30">
                                                {counts.livOnline} en ligne
                                            </span>
                                        </h2>
                                    </div>

                                    {/* Width Presets Controls for Livreurs */}
                                    <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700 text-[10px]">
                                        <button
                                            onClick={() => setLivWidthPreset(130)}
                                            title="Vue Cercles Messenger (130px)"
                                            className={`px-1.5 py-0.5 font-bold rounded transition-all ${livPanelWidth < 200 ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                        >
                                            XS
                                        </button>
                                        <button
                                            onClick={() => setLivWidthPreset(280)}
                                            title="Largeur compacte (280px)"
                                            className={`px-1.5 py-0.5 font-bold rounded transition-all ${livPanelWidth >= 200 && livPanelWidth <= 320 ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                        >
                                            S
                                        </button>
                                        <button
                                            onClick={() => setLivWidthPreset(380)}
                                            title="Largeur standard (380px)"
                                            className={`px-1.5 py-0.5 font-bold rounded transition-all ${livPanelWidth > 320 && livPanelWidth <= 420 ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                        >
                                            M
                                        </button>
                                        <button
                                            onClick={() => setLivWidthPreset(480)}
                                            title="Largeur large (480px)"
                                            className={`px-1.5 py-0.5 font-bold rounded transition-all ${livPanelWidth > 420 && livPanelWidth <= 540 ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                        >
                                            L
                                        </button>
                                        <button
                                            onClick={() => setLivWidthPreset(600)}
                                            title="Largeur maximale (600px)"
                                            className={`px-1.5 py-0.5 font-bold rounded transition-all ${livPanelWidth > 540 ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                        >
                                            XL
                                        </button>
                                    </div>
                                </div>

                                {/* Search Input */}
                                <div className="relative">
                                    <MdSearch className="absolute left-3 top-2.5 text-slate-400 text-base" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher livreur, nom, tel..."
                                        value={livreurSearch}
                                        onChange={(e) => setLivreurSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-950 text-xs text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    />
                                </div>

                                {/* Driver Status Tabs */}
                                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                    <button
                                        onClick={() => setSelectedLivreurTab("all")}
                                        className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                                            selectedLivreurTab === "all" ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold" : "hover:text-slate-900 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        ALL ({counts.livAll})
                                    </button>
                                    <button
                                        onClick={() => setSelectedLivreurTab("online")}
                                        className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                                            selectedLivreurTab === "online" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold" : "hover:text-slate-900 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        ONLINE ({counts.livOnline})
                                    </button>
                                    <button
                                        onClick={() => setSelectedLivreurTab("busy")}
                                        className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                                            selectedLivreurTab === "busy" ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold" : "hover:text-slate-900 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        BUSY ({counts.livBusy})
                                    </button>
                                    <button
                                        onClick={() => setSelectedLivreurTab("offline")}
                                        className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                                            selectedLivreurTab === "offline" ? "bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold" : "hover:text-slate-900 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        OFFLINE ({counts.livOffline})
                                    </button>
                                    <button
                                        onClick={() => setSelectedLivreurTab("blocked")}
                                        className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                                            selectedLivreurTab === "blocked" ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold" : "hover:text-slate-900 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        BLOCKED ({counts.livBlocked})
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Scrollable Livreurs List */}
                    <div className={`flex-1 overflow-y-auto ${livPanelWidth < 220 ? 'p-2 space-y-3 flex flex-col items-center' : 'p-2 space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60'}`}>
                        {loadingLivreurs ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 gap-2">
                                <TbLoader3 className="animate-spin text-3xl text-emerald-500" />
                                <span className="text-xs">Chargement...</span>
                            </div>
                        ) : filteredLivreurs.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                                Aucun livreur.
                            </div>
                        ) : (
                            filteredLivreurs.map((liv) => {
                                const isSelected = selectedLivreur?.id === liv.id;
                                const isOnline = liv.is_available;
                                const isBlocked = liv.is_blocked || liv.user?.bloquer;
                                const isBusy = liv.active_orders_count > 0;
                                const displayName = liv.user?.first_name || liv.user?.last_name || liv.user?.username || `Livreur #${liv.id}`;
                                const initial = liv.user?.first_name ? liv.user.first_name[0].toUpperCase() : "L";
                                const batteryVal = liv.battery !== undefined && liv.battery !== null 
                                    ? liv.battery 
                                    : ((liv as any).battery_level !== undefined && (liv as any).battery_level !== null ? (liv as any).battery_level : null);
                                const hasBattery = batteryVal !== null && !isNaN(batteryVal);
                                const batteryNum = hasBattery ? Math.min(Math.max(Math.round(batteryVal), 0), 100) : null;

                                if (livPanelWidth < 220) {
                                    /* 🔵 CIRCULAR MESSENGER / STORY BUBBLE VIEW (As in User Mockup) */
                                    return (
                                        <div
                                            key={liv.id}
                                            onClick={() => setSelectedLivreur(liv)}
                                            className={`group w-full max-w-[120px] flex flex-col items-center justify-center p-2 rounded-2xl transition-all cursor-pointer relative ${
                                                isSelected
                                                    ? "bg-emerald-50/90 dark:bg-slate-800 ring-2 ring-emerald-500 shadow-md scale-105"
                                                    : !isOnline
                                                    ? "hover:bg-slate-100 dark:hover:bg-slate-800/70 opacity-75"
                                                    : "hover:bg-slate-100 dark:hover:bg-slate-800/70"
                                            }`}
                                            title={`${displayName} - ${isBlocked ? "Bloqué" : isOnline ? "En ligne" : "Hors ligne"}${hasBattery ? ` • Batterie: ${batteryNum}%` : ''}`}
                                        >
                                            {/* Big Messenger Avatar Ring */}
                                            <div className="relative mb-1.5 flex items-center justify-center">
                                                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm border-[2.5px] ${
                                                    isBlocked
                                                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-500"
                                                        : isOnline
                                                        ? "bg-[#e2f7ea] dark:bg-[#072c19] text-[#1c6b3e] dark:text-[#55e090] border-[#22844d] dark:border-[#2ed573]"
                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-600"
                                                }`}>
                                                    <span className="text-2xl font-black">{initial}</span>
                                                </div>

                                                {/* Messenger Status Dot (Bottom-Right) */}
                                                <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${
                                                    isBlocked 
                                                        ? "bg-rose-500" 
                                                        : isOnline 
                                                        ? "bg-[#00d832]" 
                                                        : "bg-slate-400"
                                                }`} />

                                                {/* Busy Orders Badge */}
                                                {isBusy && (
                                                    <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black shadow-sm">
                                                        {liv.active_orders_count}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Name below avatar */}
                                            <p className={`text-xs font-bold text-center truncate w-full px-0.5 leading-tight ${
                                                isOnline ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
                                            }`}>
                                                {displayName}
                                            </p>

                                            {/* Status Text & Battery below name */}
                                            <div className="flex flex-col items-center gap-0.5 mt-0.5">
                                                <span className={`text-[9.5px] font-extrabold uppercase tracking-wider ${
                                                    isBlocked
                                                        ? "text-rose-500"
                                                        : isOnline
                                                        ? "text-[#1c6b3e] dark:text-[#42e883]"
                                                        : "text-slate-400"
                                                }`}>
                                                    {isBlocked ? "BLOQUÉ" : isOnline ? "EN LIGNE" : "HORS LIGNE"}
                                                </span>

                                                {/* Live Battery Badge (Compact) */}
                                                {hasBattery && (
                                                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[9px] font-black border ${
                                                        !isOnline
                                                            ? "bg-slate-200/60 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700"
                                                            : batteryNum! <= 20
                                                            ? "bg-rose-500/15 text-rose-500 border-rose-500/30 animate-pulse"
                                                            : batteryNum! <= 50
                                                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                                    }`}>
                                                        <span>{batteryNum! <= 20 ? '🪫' : '🔋'}</span>
                                                        <span>{batteryNum}%</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }

                                /* 📄 STANDARD RECTANGULAR CARD VIEW */
                                return (
                                    <div
                                        key={liv.id}
                                        onClick={() => setSelectedLivreur(liv)}
                                        className={`group rounded-2xl p-3.5 border transition-all cursor-pointer ${
                                            isSelected
                                                ? "bg-emerald-50/80 dark:bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500"
                                                : !isOnline
                                                ? "bg-slate-100/40 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/50 hover:bg-slate-100/70 opacity-80"
                                                : "bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/90 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700"
                                        }`}
                                    >
                                        {/* Row 1: Avatar, Name, Status, Battery & Block Icon */}
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="relative">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                                                        isBlocked
                                                            ? "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                                                            : isOnline
                                                            ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                            : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                                                    }`}>
                                                        {initial}
                                                    </div>
                                                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                                                        isBlocked 
                                                            ? "bg-rose-500" 
                                                            : isOnline 
                                                            ? "bg-emerald-500" 
                                                            : "bg-slate-400"
                                                    }`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                                        {displayName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 truncate">
                                                        ID: #{liv.id} {liv.wilaya ? `• ${liv.wilaya}` : ""}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Battery badge & Block/Unblock toggle */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {hasBattery && (
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                                                        batteryNum! <= 20
                                                            ? "bg-rose-500/15 text-rose-500 border-rose-500/30 animate-pulse"
                                                            : batteryNum! <= 50
                                                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                                    }`}
                                                    title={`Batterie du livreur: ${batteryNum}%`}
                                                    >
                                                        <span>{batteryNum! <= 20 ? '🪫' : '🔋'}</span>
                                                        <span>{batteryNum}%</span>
                                                    </span>
                                                )}

                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const ok = await toggleBlockLivreur({ livreur_id: liv.id, bloquer: !isBlocked });
                                                        if (ok) {
                                                            fetchLivreurs();
                                                        }
                                                    }}
                                                    className={`p-1.5 rounded-lg transition-colors ${
                                                        isBlocked
                                                            ? "text-rose-500 hover:bg-rose-500/10"
                                                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                    }`}
                                                    title={isBlocked ? "Débloquer le livreur" : "Bloquer le livreur"}
                                                >
                                                    {isBlocked ? <MdLock className="text-base" /> : <MdLockOpen className="text-base" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Row 2: Phone & Active Orders Count */}
                                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/80 dark:border-slate-800/60">
                                            <div className="flex items-center gap-1">
                                                <MdPhone className="text-xs text-blue-500" />
                                                <span>{liv.user?.phone || "Non renseigné"}</span>
                                            </div>
                                            <span className={`font-semibold px-2 py-0.5 rounded-md text-[10px] ${
                                                isBusy 
                                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" 
                                                    : "bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                            }`}>
                                                {liv.active_orders_count || 0} en cours
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Colis Image Lightbox Modal */}
            {previewColisImage && (
                <div 
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setPreviewColisImage(null)}
                >
                    <div 
                        className="relative max-w-xl max-h-[85vh] bg-slate-900 rounded-3xl p-3 border border-purple-500 shadow-2xl overflow-hidden flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                            <span className="text-sm font-bold text-white flex items-center gap-2">
                                <span className="p-1 rounded-lg bg-purple-600 text-white text-xs">📦</span>
                                Photo du Colis / Produit
                            </span>
                            <button 
                                onClick={() => setPreviewColisImage(null)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <img 
                            src={previewColisImage.startsWith('http') ? previewColisImage : `${process.env.NEXT_PUBLIC_SERVER || 'http://127.0.0.1:8000'}${previewColisImage}`} 
                            alt="Photo du produit"
                            className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-md"
                        />
                    </div>
                </div>
            )}
            {/* Dispatch Modal */}
            {dispatchOrder && (
                <DispatchModal
                    order={dispatchOrder}
                    token={token}
                    onClose={() => setDispatchOrder(null)}
                    onSuccess={() => {
                        setDispatchOrder(null);
                        fetchCommandes();
                        fetchLivreurs();
                    }}
                />
            )}

            {/* Order Details Modal */}
            {detailsOrder && (
                <OrderDetailsModal
                    order={detailsOrder}
                    onClose={() => setDetailsOrder(null)}
                    onOpenDispatch={(ord) => {
                        setDetailsOrder(null);
                        setDispatchOrder(ord);
                    }}
                    onOrderUpdated={(updatedOrder: Order) => {
                        setCommandes(prev => prev.map(c => c.id === updatedOrder.id ? { ...c, ...updatedOrder } : c));
                        setDetailsOrder(null);
                    }}
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

            {/* Driver Tracking Timeline Dialog */}
            {driverTimelineOrder && (
                <DriverTimelineDialog
                    order={driverTimelineOrder}
                    onClose={() => setDriverTimelineOrder(null)}
                />
            )}
        </div>
    );
}
