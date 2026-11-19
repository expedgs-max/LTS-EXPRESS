"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaRegUser, FaShoppingBag } from "react-icons/fa";
import { MdKeyboardArrowDown } from "react-icons/md";
import { HiOutlineSparkles } from "react-icons/hi2";
import Notification from "@/components/windows/notification";
import { useNotificationStore, userInformation } from "@/lib/tools/store/web_socket";
import DropDown from "@/components/windows/drop_down";
import { toast } from "react-toastify";
import { checkInternet } from "../options/useNetwork";
import { PartenaireInformation } from "@/lib/tools/store/pertnerStore";
import { UpdateMagasin } from "@/lib/stores_api";
import ThemeToggle from "../theme_toggle";
import { useSidebarStore } from "@/lib/tools/store/sidebarStore";
import { getImageUrl } from "@/lib/tools/tools";

export default function Header({ user, token, mag }: { user: Users; token: string; mag: Magasin | null }) {
    const [show, setShow] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const { notifications, setNotifications, addNotification, removeNotification, setSocket, setIsConnected, isConnected } = useNotificationStore();
    const { setUser } = userInformation();
    const { setPertner } = PartenaireInformation();
    const { isCollapsed } = useSidebarStore();

    useEffect(() => {
        if (user) {
            setUser(user);
        }
    }, [user, setUser]);

    const loadingId = useRef<string | number | null>(null);

    useEffect(() => {
        if (!token || user?.role !== "partener") return;
        if (mag) {
            setPertner(mag.owner);
        }
        const audio = new Audio("/notification2.mp3");
        let socket: WebSocket;
        let reconnectTimeout: NodeJS.Timeout;
        let connectivityInterval: NodeJS.Timeout;
        let loadingToastId: string | number | null = null;

        const connectWebSocket = () => {
            socket = new WebSocket(`${process.env.NEXT_PUBLIC_WS_SERVER}/ws/commandes/magasin/?token=${token}`);
            setSocket(socket);

            socket.onopen = () => {
                console.log("✅ Connected to WebSocket server");
                if (loadingToastId) {
                    toast.update(loadingToastId, {
                        render: "Connexion réussie",
                        type: "success",
                        isLoading: false,
                        autoClose: 3000,
                        closeButton: true,
                        onClose: () => {
                            loadingToastId = null;
                        },
                    });
                }

                connectivityInterval = setInterval(async () => {
                    const isOnline = await checkInternet();
                    if (!isOnline) {
                        socket.close();
                        console.warn("❌ No internet connection, closing socket...");
                    }
                }, 20000);
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (Array.isArray(data.message)) {
                    setNotifications(data.message);
                } else {
                    if (data.message?.status === "pending") {
                        audio.play();
                        toast(`Nouvelle commande reçue`, {
                            autoClose: 4000,
                            closeButton: true,
                        });
                        addNotification(data.message);
                    } else {
                        if (data.message) removeNotification(data.message.id);
                    }
                }
            };

            socket.onerror = () => {
                console.warn("❌ WebSocket error");
            };

            socket.onclose = () => {
                console.warn("🔌 Disconnected from WebSocket. Reconnecting...");
                if (!loadingToastId) {
                    loadingToastId = toast.loading("Reconnexion ...", {
                        position: "top-center",
                        hideProgressBar: true,
                    });
                }
                clearInterval(connectivityInterval);
                reconnectTimeout = setTimeout(connectWebSocket, 5000);
                setIsConnected(false);
            };
        };

        connectWebSocket();
        return () => {
            clearTimeout(reconnectTimeout);
            clearInterval(connectivityInterval);
            socket?.close();
        };
    }, [token, user?.role, mag, addNotification, setSocket, setNotifications, removeNotification, setIsConnected, setPertner]);

    const handleStatusChange = async (magasin_id: number, EtatOuverture: boolean) => {
        loadingId.current = toast.loading("Mise à jour du statut...", {
            position: "bottom-right",
            hideProgressBar: true,
        });

        const updateStatus = await UpdateMagasin({ magasin_id, EtatOuverture });

        if (updateStatus.code === 200) {
            toast.update(loadingId.current, {
                render: EtatOuverture ? "Magasin Ouvert" : "Magasin Fermé",
                type: "success",
                isLoading: false,
                autoClose: 3000,
                closeButton: true,
                onClose: () => {
                    loadingId.current = null;
                },
            });
            setIsConnected(EtatOuverture);
        } else {
            toast.error(typeof updateStatus === "string" ? updateStatus : "Erreur lors de la mise à jour");
        }
    };

    const getRoleDisplayName = (role?: string) => {
        switch (role) {
            case "admin":
            case "adminossama":
                return "Administrateur";
            case "chef_bureau":
                return "Chef de Bureau";
            case "agent_administratif":
                return "Agent Administratif";
            case "superviseur":
                return "Superviseur";
            case "partener":
                return "Partenaire";
            case "livreur":
                return "Livreur";
            case "comptable":
                return "Comptable";
            default:
                return role || "Utilisateur";
        }
    };

    return (
        <header
            className={`fixed top-0 right-0 z-30 transition-all duration-300 left-0 ${
                isCollapsed ? "md:left-20" : "md:left-80"
            } bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-800/80 shadow-xs h-16 sm:h-20 flex items-center`}
        >
            <div className="w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-4">
                {/* Left Title / Badge (Spaced on mobile to avoid hamburger overlap) */}
                <div className="flex items-center gap-3 pl-12 md:pl-0">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>LTC Express Platform</span>
                    </div>

                    {user?.type_account === "premium" && (
                        <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-500 border border-amber-500/30">
                            <HiOutlineSparkles className="text-amber-500" />
                            Premium
                        </span>
                    )}
                </div>

                {/* Right Action Icons & User Profile */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Partner Store Opening Status Switch */}
                    {user && user.role === "partener" && mag?.owner?.type_compte?.name !== "starshop" && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60">
                            <span className="text-xs font-medium">
                                {isConnected ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Ouvert
                                    </span>
                                ) : (
                                    <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                        Fermé
                                    </span>
                                )}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isConnected}
                                    onChange={(e) => mag?.id !== undefined && handleStatusChange(mag.id, e.target.checked)}
                                />
                                <div className="w-9 h-5 bg-slate-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>
                    )}

                    {/* Partner Shopping Notification */}
                    {user && user.role === "partener" && (
                        <button
                            className="relative flex items-center justify-center text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200/80 dark:border-zinc-700/80 rounded-xl w-9 h-9 sm:w-10 sm:h-10 bg-slate-100/80 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 active:scale-95 shadow-xs"
                            onClick={() => setShow(true)}
                            aria-label="Notifications commandes"
                        >
                            {notifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-900 animate-bounce">
                                    {notifications.length}
                                </span>
                            )}
                            <FaShoppingBag className="text-base sm:text-lg" />
                        </button>
                    )}

                    {/* Theme Mode Toggle */}
                    <ThemeToggle />

                    {/* User Account Profile Pill */}
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsOpen((prev) => !prev)}
                                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100/80 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700/80 border border-slate-200/80 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-100 transition-all duration-200 group active:scale-98 shadow-xs"
                            >
                                <div className="relative shrink-0">
                                    <div className="overflow-hidden rounded-full h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-slate-200 dark:ring-zinc-700 group-hover:ring-emerald-500/50 transition-all">
                                        <Image
                                            width={36}
                                            height={36}
                                            src={user.image_url ? getImageUrl(user.image_url) : "/placeholder.svg"}
                                            alt={user.username || "User"}
                                            className="object-cover h-full w-full"
                                        />
                                    </div>
                                    {/* Prominent, Unclipped Online Green Status Dot */}
                                    <span className="absolute -bottom-0.5 -right-0.5 z-10 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#00e639] ring-2 ring-white dark:ring-zinc-900 shadow-xs" />
                                </div>

                                <div className="hidden sm:flex flex-col text-left">
                                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 max-w-28 truncate leading-tight">
                                        {user.username}
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium leading-tight">
                                        {getRoleDisplayName(user.role)}
                                    </span>
                                </div>

                                <MdKeyboardArrowDown
                                    className={`text-slate-400 dark:text-zinc-400 transition-transform duration-200 ${
                                        isOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {isOpen && (
                                <div className="absolute right-0 mt-2 z-50">
                                    <div
                                        onClick={() => setIsOpen(false)}
                                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs"
                                    />
                                    <div className="relative z-50">
                                        <DropDown onClose={setIsOpen} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-red-600/20 transition-all"
                        >
                            <FaRegUser className="text-sm" />
                            <span>Connexion</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Notification Modal / Drawer */}
            {show && (
                <div>
                    <div onClick={() => setShow(false)} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs" />
                    <div className="absolute z-50 top-18 p-2 md:right-32">
                        <Notification not={notifications} onsub={setShow} />
                    </div>
                </div>
            )}
        </header>
    );
}
