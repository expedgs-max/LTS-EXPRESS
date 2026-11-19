"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import {
    MdKeyboardArrowUp,
    MdLogin,
    MdContactSupport,
    MdOutlineDashboard,
    MdOutlinePendingActions,
    MdAttachMoney,
    MdOutlineAdminPanelSettings,
    MdDeliveryDining,
    MdLocalTaxi,
    MdOutlineStorefront,
    MdOutlineReport,
    MdOutlineRequestQuote,
    MdOutlineShoppingBasket,
    MdGroup,
    MdVideoSettings,
    MdOutlineConfirmationNumber,
    MdMap,
    MdChevronLeft,
    MdChevronRight,
    MdLogout,
    MdLocalOffer,
    MdCampaign,
    MdAmpStories,
    MdAddCircle,
    MdAltRoute,
    MdPeopleAlt,
    MdLocalShipping
} from "react-icons/md";
import { TbRecharging } from "react-icons/tb";
import { GrValidate, GrUserWorker } from "react-icons/gr";
import { FaTrophy } from "react-icons/fa6";
import Image from 'next/image';
import { SignOut } from '@/lib/auth';
import { toast } from "react-hot-toast";
import { MenuParams } from "./params";
import LoadingFirst from '../loading';
import { getTotalDemande, getTotalNoGroup } from '@/lib/action_client';
import { PartenaireInformation } from '@/lib/tools/store/pertnerStore';
import { getTotalNoConfirmed } from '@/lib/tutorial_api';
import { useSidebarStore } from '@/lib/tools/store/sidebarStore';

type Props = {
    user: Users;
    token: string;
};

export default function Menu({ user, token }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const search = useSearchParams();

    const { isCollapsed, toggleSidebar } = useSidebarStore();

    const [isFaqOpen, setIsFaqOpen] = useState(Array(4).fill(false));
    const [isCaisseOpen, setIsCaisseOpen] = useState(false);
    const [isVtcOpen, setIsVtcOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [countState, setCountState] = useState<number | null>(null);
    const [countPart, setCountPart] = useState<number | null>(null);
    const [countConfirmation, setCountConfirmation] = useState<number | null>(null);

    const { pertner } = PartenaireInformation();

    // VTC Configurable Permissions
    const canCommissionVtc = user?.role === "admin" || (
        user?.permission_commission_vtc !== undefined && user?.permission_commission_vtc !== null
            ? Boolean(user.permission_commission_vtc)
            : (user?.commission_vtc !== undefined && user?.commission_vtc !== null
                ? Boolean(user.commission_vtc)
                : (user?.role === "validation_vtc"))
    );

    const canCompteVtc = user?.role === "admin" || (
        user?.permission_compte_vtc !== undefined && user?.permission_compte_vtc !== null
            ? Boolean(user.permission_compte_vtc)
            : (user?.compte_vtc !== undefined && user?.compte_vtc !== null
                ? Boolean(user.compte_vtc)
                : (user?.role === "validation_vtc" || user?.role === "suivi_vtc" || user?.role === "chef_bureau"))
    );

    const canListCourse = user?.role === "admin" || (
        user?.permission_list_course !== undefined && user?.permission_list_course !== null
            ? Boolean(user.permission_list_course)
            : (user?.list_course !== undefined && user?.list_course !== null
                ? Boolean(user.list_course)
                : (user?.role === "validation_vtc" || user?.role === "suivi_vtc"))
    );

    const canVtcDetaille = user?.role === "admin" || (
        user?.permission_vtc_detaille !== undefined && user?.permission_vtc_detaille !== null
            ? Boolean(user.permission_vtc_detaille)
            : (user?.vtc_detaille !== undefined && user?.vtc_detaille !== null
                ? Boolean(user.vtc_detaille)
                : (user?.role === "validation_vtc" || user?.role === "suivi_vtc"))
    );

    const canTransporteurs = user?.role === "admin" || (
        user?.permission_transporteurs !== undefined && user?.permission_transporteurs !== null
            ? Boolean(user.permission_transporteurs)
            : (user?.role === "validation_vtc" || user?.role === "suivi_vtc")
    );

    const canCaisses = user?.role === "admin" || (
        user?.permission_caisses !== undefined && user?.permission_caisses !== null
            ? Boolean(user.permission_caisses)
            : (user?.role === "comptable" || user?.role === "chef_bureau" || user?.role === "validation_vtc" || user?.role === "suivi_vtc")
    );

    const canCaisseVtc = user?.role === "admin" || (
        user?.permission_caisse_vtc !== undefined && user?.permission_caisse_vtc !== null
            ? Boolean(user.permission_caisse_vtc)
            : (user?.role === "validation_vtc" || user?.role === "suivi_vtc" || user?.role === "comptable" || user?.role === "aide_comptable")
    );

    const canCaisseLivreur = user?.role === "admin" || (
        user?.permission_caisse_livreur !== undefined && user?.permission_caisse_livreur !== null
            ? Boolean(user.permission_caisse_livreur)
            : (user?.role === "comptable" || user?.role === "aide_comptable" || user?.role === "chef_bureau" || user?.role === "validation_vtc" || user?.role === "suivi_vtc")
    );

    // Permissions Opérationnelles & Confirmation Configurable
    const canDispatch = user?.role === "admin" || (
        user?.permission_dispatch !== undefined && user?.permission_dispatch !== null
            ? Boolean(user.permission_dispatch)
            : (user?.role === "confirmation" || user?.role === "centre_appel")
    );

    const canCommandes = user?.role === "admin" || (
        user?.permission_commandes !== undefined && user?.permission_commandes !== null
            ? Boolean(user.permission_commandes)
            : (user?.role === "confirmation" || user?.role === "centre_appel")
    );

    const canMagasins = user?.role === "admin" || (
        user?.permission_magasins !== undefined && user?.permission_magasins !== null
            ? Boolean(user.permission_magasins)
            : (user?.role === "centre_appel" || user?.role === "gestion_commercial")
    );

    const canLivreurs = user?.role === "admin" || (
        user?.permission_livreurs !== undefined && user?.permission_livreurs !== null
            ? Boolean(user.permission_livreurs)
            : (user?.role === "centre_appel")
    );

    const canAppleCenter = user?.role === "admin" || (
        user?.permission_apple_center !== undefined && user?.permission_apple_center !== null
            ? Boolean(user.permission_apple_center)
            : (user?.role === "centre_appel" || user?.role === "chef_bureau" || user?.role === "agent_administratif")
    );

    const canPromo = user?.role === "admin" || (
        user?.permission_promo !== undefined && user?.permission_promo !== null
            ? Boolean(user.permission_promo)
            : (user?.role === "centre_appel")
    );

    const canObjectifs = user?.role === "admin" || (
        user?.permission_objectifs !== undefined && user?.permission_objectifs !== null
            ? Boolean(user.permission_objectifs)
            : (user?.role === "centre_appel")
    );

    const canValidation = user?.role === "admin" || (
        user?.permission_vlider !== undefined && user?.permission_vlider !== null
            ? Boolean(user.permission_vlider)
            : (user?.role === "superviseur" || user?.role === "centre_appel")
    );

    const canCommissionLivreur = user?.role === "admin" || (
        user?.permission_commission_livreur !== undefined && user?.permission_commission_livreur !== null
            ? Boolean(user.permission_commission_livreur)
            : (user?.role === "comptable" || user?.role === "centre_appel")
    );

    const canDeliveries = user?.role === "admin" || (
        user?.permission_deliveries !== undefined && user?.permission_deliveries !== null
            ? Boolean(user.permission_deliveries)
            : (user?.role === "chef_bureau" || user?.role === "agent_administratif")
    );

    const canPartenaire = user?.role === "admin" || (
        user?.permission_partenaire !== undefined && user?.permission_partenaire !== null
            ? Boolean(user.permission_partenaire)
            : (user?.role === "gestion_commercial")
    );

    const canRapports = user?.role === "admin" || (
        user?.permission_rapports !== undefined && user?.permission_rapports !== null
            ? Boolean(user.permission_rapports)
            : (user?.role === "superviseur")
    );

    const canRecharge = user?.role === "admin" || (
        user?.permission_recharge !== undefined && user?.permission_recharge !== null
            ? Boolean(user.permission_recharge)
            : (user?.role === "superviseur")
    );

    const canActionsVtc = user?.role === "admin" || (
        user?.permission_actions_vtc !== undefined && user?.permission_actions_vtc !== null
            ? Boolean(user.permission_actions_vtc)
            : (user?.role === "validation_vtc" || user?.role === "suivi_vtc")
    );

    const canDemandesVtc = user?.role === "admin" || (
        user?.permission_demandes_vtc !== undefined && user?.permission_demandes_vtc !== null
            ? Boolean(user.permission_demandes_vtc)
            : (user?.role === "validation_vtc" || user?.role === "suivi_vtc")
    );

    const canDispatchVtc = user?.role === "admin" || (
        user?.permission_dispatch_vtc !== undefined && user?.permission_dispatch_vtc !== null
            ? Boolean(user.permission_dispatch_vtc)
            : (user?.role === "validation_vtc" || user?.role === "suivi_vtc")
    );

    const isRouteActive = (url: string) => {
        if (!pathname) return false;
        if (pathname === url) return true;
        if (url === '/dashboard' || url === '/dashboard/confirmation') {
            return pathname === url;
        }
        return pathname.startsWith(url + '/');
    };

    const handleMenu = (url: string | null) => {
        if (window.innerWidth < 768) {
            setIsMenuOpen(!isMenuOpen);
        }
        if ((url === pathname && search.size === 0) || url == null) {
            return;
        }
        setIsLoading(true);
        if (url != null) router.push(url);
    };

    useEffect(() => {
        setIsLoading(false);
    }, [pathname, search]);

    useEffect(() => {
        if (!token || (user?.role !== "validation_vtc" && user?.role !== "suivi_vtc" && user?.role !== "centre_appel" && user?.role !== "confirmation" && user?.role !== "admin")) {
            setCountState(null);
            setCountPart(null);
            return;
        }
        const fetchCount = async () => {
            try {
                const num = await getTotalDemande();
                setCountState(num);
            } catch {
                setCountState(null);
            }
        };

        const fetchNoGroup = async () => {
            try {
                const total = await getTotalNoGroup();
                setCountPart(total);
            } catch {
                setCountPart(null);
            }
        };

        const fetchNoConfirme = async () => {
            try {
                const total = await getTotalNoConfirmed();
                setCountConfirmation(total);
            } catch {
                setCountConfirmation(null);
            }
        };

        if (user?.role === "centre_appel" || user?.role === "confirmation" || user?.role === "admin") {
            fetchNoConfirme();
        }
        if (user?.role === "centre_appel") {
            fetchNoGroup();
        }
        if (user?.role === "validation_vtc" || user?.role === "suivi_vtc") {
            fetchCount();
        }
    }, [pathname, search, user, token]);

    function handleClick(index: number) {
        setIsFaqOpen((prevExpanded) =>
            prevExpanded.map((isExpanded, i) => (i === index ? !isExpanded : isExpanded))
        );
    }

    const isCaisseActive = isRouteActive("/dashboard/caisses") || isRouteActive("/dashboard/caisse_vtc") || isRouteActive("/dashboard/caisse_livreur");

    useEffect(() => {
        if (isCaisseActive) {
            setIsCaisseOpen(true);
        }
    }, [pathname]);

    const renderCaisseDropdown = () => {
        if (!canCaisses && !canCaisseVtc && !canCaisseLivreur) return null;

        return (
            !isCollapsed ? (
                <div className='my-0.5'>
                    <div
                        onClick={() => setIsCaisseOpen((prev) => !prev)}
                        className={`flex justify-between p-3 items-center font-bold hover:bg-slate-100 dark:hover:bg-zinc-800/70 rounded-2xl text-sm cursor-pointer transition-all my-0.5 ${
                            isCaisseActive
                                ? 'bg-slate-100 dark:bg-zinc-800/80 text-amber-600 dark:text-amber-400'
                                : 'text-slate-700 dark:text-zinc-200'
                        }`}
                    >
                        <h1 className='flex items-center gap-3'>
                            <MdAttachMoney className='text-xl text-amber-500' />
                            <span className='font-semibold'>Caisse</span>
                        </h1>
                        <MdKeyboardArrowUp className={`text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${isCaisseOpen ? 'rotate-180' : ''}`} />
                    </div>
                    <div className={`transition-all duration-200 overflow-hidden ${isCaisseOpen ? 'max-h-96' : 'max-h-0'}`}>
                        <ul className='flex flex-col gap-1 p-2 ml-4 border-l-2 border-slate-200 dark:border-zinc-800'>
                            {canCaisses && (
                                <li className='cursor-pointer text-xs font-semibold'>
                                    <div
                                        onClick={() => handleMenu("/dashboard/caisses")}
                                        className={`flex items-center gap-2 py-2 px-2.5 rounded-xl transition-all ${
                                            isRouteActive("/dashboard/caisses")
                                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-md shadow-red-600/30'
                                                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                                        }`}
                                    >
                                        <MdAttachMoney className='text-base shrink-0 text-amber-500' />
                                        <span>Caisse globale</span>
                                    </div>
                                </li>
                            )}
                            {canCaisseVtc && (
                                <li className='cursor-pointer text-xs font-semibold'>
                                    <div
                                        onClick={() => handleMenu("/dashboard/caisse_vtc")}
                                        className={`flex items-center gap-2 py-2 px-2.5 rounded-xl transition-all ${
                                            isRouteActive("/dashboard/caisse_vtc")
                                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-md shadow-amber-500/30'
                                                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                                        }`}
                                    >
                                        <MdLocalTaxi className='text-base shrink-0 text-amber-500' />
                                        <span>Caisse VTC</span>
                                    </div>
                                </li>
                            )}
                            {canCaisseLivreur && (
                                <li className='cursor-pointer text-xs font-semibold'>
                                    <div
                                        onClick={() => handleMenu("/dashboard/caisse_livreur")}
                                        className={`flex items-center gap-2 py-2 px-2.5 rounded-xl transition-all ${
                                            isRouteActive("/dashboard/caisse_livreur")
                                                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold shadow-md shadow-emerald-600/30'
                                                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                                        }`}
                                    >
                                        <MdDeliveryDining className='text-base shrink-0 text-emerald-500' />
                                        <span>Caisse Livreur</span>
                                    </div>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            ) : (
                <>
                    {canCaisses && (
                        <MenuParams
                            title='Caisse Globale'
                            icon={<MdAttachMoney className='text-amber-500' />}
                            onEvent={() => handleMenu("/dashboard/caisses")}
                            isCollapsed={isCollapsed}
                            isActive={isRouteActive("/dashboard/caisses")}
                        />
                    )}
                    {canCaisseVtc && (
                        <MenuParams
                            title='Caisse VTC'
                            icon={<MdLocalTaxi className='text-amber-500' />}
                            onEvent={() => handleMenu("/dashboard/caisse_vtc")}
                            isCollapsed={isCollapsed}
                            isActive={isRouteActive("/dashboard/caisse_vtc")}
                        />
                    )}
                    {canCaisseLivreur && (
                        <MenuParams
                            title='Caisse Livreur'
                            icon={<MdDeliveryDining className='text-emerald-500' />}
                            onEvent={() => handleMenu("/dashboard/caisse_livreur")}
                            isCollapsed={isCollapsed}
                            isActive={isRouteActive("/dashboard/caisse_livreur")}
                        />
                    )}
                </>
            )
        );
    };

    const isVtcActive = isRouteActive("/dashboard/chauffeurs") || isRouteActive("/dashboard/courses") || isRouteActive("/dashboard/transporteurs") || isRouteActive("/dashboard/vtc_dispatch");

    useEffect(() => {
        if (isVtcActive) {
            setIsVtcOpen(true);
        }
    }, [pathname]);

    const renderVtcDropdown = () => {
        if (!canTransporteurs && !canCompteVtc && !canListCourse && !canDispatchVtc) return null;
        return (
            !isCollapsed ? (
                <div className='my-0.5'>
                    <div
                        onClick={() => setIsVtcOpen((prev) => !prev)}
                        className={`flex justify-between p-3 items-center font-bold hover:bg-slate-100 dark:hover:bg-zinc-800/70 rounded-2xl text-sm cursor-pointer transition-all my-0.5 ${
                            isVtcActive
                                ? 'bg-slate-100 dark:bg-zinc-800/80 text-amber-600 dark:text-amber-400'
                                : 'text-slate-700 dark:text-zinc-200'
                        }`}
                    >
                        <h1 className='flex items-center gap-3'>
                            <MdLocalTaxi className='text-xl text-amber-500' />
                            <span className='font-semibold'>VTC & Transport</span>
                        </h1>
                        <MdKeyboardArrowUp className={`text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${isVtcOpen ? 'rotate-180' : ''}`} />
                    </div>
                    <div className={`transition-all duration-200 overflow-hidden ${isVtcOpen ? 'max-h-96' : 'max-h-0'}`}>
                        <ul className='flex flex-col gap-1 p-2 ml-4 border-l-2 border-slate-200 dark:border-zinc-800'>
                            {canDispatchVtc && (
                                <li className='cursor-pointer text-xs font-semibold'>
                                    <div
                                        onClick={() => handleMenu("/dashboard/vtc_dispatch")}
                                        className={`flex items-center gap-2 py-2 px-2.5 rounded-xl transition-all ${
                                            isRouteActive("/dashboard/vtc_dispatch")
                                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-md shadow-amber-500/30'
                                                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                                        }`}
                                    >
                                        <MdMap className='text-base shrink-0 text-amber-500' />
                                        <span>Dispatch Carte Live</span>
                                    </div>
                                </li>
                            )}
                            {canTransporteurs && (
                                <li className='cursor-pointer text-xs font-semibold'>
                                    <div
                                        onClick={() => handleMenu("/dashboard/transporteurs")}
                                        className={`flex items-center gap-2 py-2 px-2.5 rounded-xl transition-all ${
                                            isRouteActive("/dashboard/transporteurs")
                                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-md shadow-amber-500/30'
                                                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                                        }`}
                                    >
                                        <MdLocalShipping className='text-base shrink-0 text-amber-500' />
                                        <span>Transporteurs & Fret</span>
                                    </div>
                                </li>
                            )}
                            {canCompteVtc && (
                                <li className='cursor-pointer text-xs font-semibold'>
                                    <div
                                        onClick={() => handleMenu("/dashboard/chauffeurs")}
                                        className={`flex items-center gap-2 py-2 px-2.5 rounded-xl transition-all ${
                                            isRouteActive("/dashboard/chauffeurs")
                                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-md shadow-amber-500/30'
                                                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                                        }`}
                                    >
                                        <MdLocalTaxi className='text-base shrink-0 text-amber-500' />
                                        <span>Compte VTC</span>
                                    </div>
                                </li>
                            )}
                            {canListCourse && (
                                <li className='cursor-pointer text-xs font-semibold'>
                                    <div
                                        onClick={() => handleMenu("/dashboard/courses")}
                                        className={`flex items-center gap-2 py-2 px-2.5 rounded-xl transition-all ${
                                            isRouteActive("/dashboard/courses")
                                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-md shadow-amber-500/30'
                                                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                                        }`}
                                    >
                                        <MdAltRoute className='text-base shrink-0 text-amber-500' />
                                        <span>List course</span>
                                    </div>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            ) : (
                <>
                    {canDispatchVtc && (
                        <MenuParams
                            title='Dispatch VTC'
                            icon={<MdMap className='text-amber-500' />}
                            onEvent={() => handleMenu("/dashboard/vtc_dispatch")}
                            isCollapsed={isCollapsed}
                            isActive={isRouteActive("/dashboard/vtc_dispatch")}
                        />
                    )}
                    {canTransporteurs && (
                        <MenuParams
                            title='Transporteurs'
                            icon={<MdLocalShipping className='text-amber-500' />}
                            onEvent={() => handleMenu("/dashboard/transporteurs")}
                            isCollapsed={isCollapsed}
                            isActive={isRouteActive("/dashboard/transporteurs")}
                        />
                    )}
                    {canCompteVtc && (
                        <MenuParams
                            title='Compte VTC'
                            icon={<MdLocalTaxi className='text-amber-500' />}
                            onEvent={() => handleMenu("/dashboard/chauffeurs")}
                            isCollapsed={isCollapsed}
                            isActive={isRouteActive("/dashboard/chauffeurs")}
                        />
                    )}
                    {canListCourse && (
                        <MenuParams
                            title='List course'
                            icon={<MdAltRoute className='text-amber-500' />}
                            onEvent={() => handleMenu("/dashboard/courses")}
                            isCollapsed={isCollapsed}
                            isActive={isRouteActive("/dashboard/courses")}
                        />
                    )}
                </>
            )
        );
    };

    const handleSubmit = async () => {
        const loadingToastId = toast.loading('Déconnexion...');
        try {
            const result = await SignOut();
            if (result) {
                toast.success('Déconnecté avec succès', { id: loadingToastId });
                router.push('/login');
                setIsLoading(true);
            } else {
                toast.error('Problème lors de la déconnexion', { id: loadingToastId });
            }
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message, { id: loadingToastId });
            } else {
                toast.error('Une erreur est survenue', { id: loadingToastId });
            }
        }
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsMenuOpen(false);
            } else {
                setIsMenuOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <>
            {/* Mobile Hamburger Button */}
            <div
                onClick={() => handleMenu(null)}
                className={`fixed z-50 top-6 left-3 transition-all ${isMenuOpen ? "translate-x-64" : ""} flex flex-col justify-center gap-y-2 w-10 h-9 cursor-pointer md:hidden`}
            >
                <div className={`relative w-full h-1.5 bg-third transition-all duration-500 ${isMenuOpen ? 'top-3.5 -rotate-45' : ''} `}></div>
                <div className={`w-full h-1.5 bg-third transition-all duration-500 ${isMenuOpen ? ' -rotate-45' : ''} `}></div>
                <div className={`relative w-full h-1.5 bg-third transition-all duration-500 ${isMenuOpen ? '-top-3.5  rotate-45' : ''} `}></div>
                {((user?.role === "validation_vtc" || user?.role === "suivi_vtc") && (countState || countPart)) ? (
                    <span className='absolute -top-3 -right-3 py-0.5 px-2 text-sm rounded-full text-white font-bold bg-red-600'>
                        {(countState || 0) + (countPart || 0)}
                    </span>
                ) : null}
            </div>

            {/* Sidebar Navigation Drawer */}
            <div
                className={`fixed z-40 top-0 overflow-y-auto no-scrollbar left-0 bottom-0 transition-all duration-300 ${isMenuOpen ? "" : "-translate-x-80"
                    } md:translate-x-0 ${user?.type_account === "premium"
                        ? 'bg-gradient-to-b from-gold5 via-gold6 to-gold5 text-white'
                        : 'bg-white text-slate-800 dark:bg-[#111318] dark:text-zinc-100 border-r border-slate-200/80 dark:border-zinc-800/80 shadow-lg dark:shadow-2xl'
                    } ${isCollapsed ? "md:w-20 px-2" : "md:w-80 px-4"
                    } w-80 flex flex-col justify-between`}
            >
                <div>
                    {/* Top Logo & Collapse Toggle Bar */}
                    <div className='flex items-center justify-between py-3 border-b border-slate-200/80 dark:border-zinc-800/80 mb-2'>
                        {!isCollapsed ? (
                            <div onClick={() => handleMenu('/dashboard')} className='flex items-center gap-2 cursor-pointer truncate py-1'>
                                {pertner?.type_compte?.name === "starshop" ? (
                                    <Image height={44} width={150} src="/logo_star_white.png" alt="StarShop" className='h-10 w-auto object-contain' />
                                ) : (
                                    <>
                                        {/* Light Theme Logo */}
                                        <Image
                                            height={52}
                                            width={170}
                                            src="/ltc_logo_brand.svg"
                                            alt="LTC Express"
                                            className='h-12 w-auto object-contain dark:hidden transition-transform hover:scale-[1.02]'
                                            priority
                                        />
                                        {/* Dark Theme Logo */}
                                        <Image
                                            height={52}
                                            width={170}
                                            src="/ltc_logo_brand_white.svg"
                                            alt="LTC Express"
                                            className='h-12 w-auto object-contain hidden dark:block transition-transform hover:scale-[1.02]'
                                            priority
                                        />
                                    </>
                                )}
                            </div>
                        ) : (
                            <div onClick={() => handleMenu('/dashboard')} className='mx-auto cursor-pointer flex items-center justify-center py-1'>
                                {/* Light Theme Collapsed Logo */}
                                <Image
                                    height={36}
                                    width={48}
                                    src="/ltc_logo_brand.svg"
                                    alt="LTC Express"
                                    className='h-7 w-auto object-contain dark:hidden transition-transform hover:scale-105'
                                    priority
                                />
                                {/* Dark Theme Collapsed Logo */}
                                <Image
                                    height={36}
                                    width={48}
                                    src="/ltc_logo_brand_white.svg"
                                    alt="LTC Express"
                                    className='h-7 w-auto object-contain hidden dark:block transition-transform hover:scale-105'
                                    priority
                                />
                            </div>
                        )}

                        {/* Desktop Collapse / Expand Toggle Button */}
                        <button
                            onClick={toggleSidebar}
                            title={isCollapsed ? "Agrandir le menu" : "Réduire le menu (logos seuls)"}
                            className='hidden md:flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 dark:text-zinc-200 transition-all shadow-xs shrink-0'
                        >
                            {isCollapsed ? <MdChevronRight className="text-xl" /> : <MdChevronLeft className="text-xl" />}
                        </button>
                    </div>

                    {/* Menu Navigation Links */}
                    <div className='flex flex-col gap-1 py-1'>
                        {user && (
                            <>
                                <MenuParams
                                    title='Tableau de bord'
                                    icon={<MdOutlineDashboard className='text-blue-500' />}
                                    onEvent={() => handleMenu("/dashboard")}
                                    isCollapsed={isCollapsed}
                                    isActive={isRouteActive("/dashboard")}
                                />

                                {/* CHEF BUREAU & AGENT ADMINISTRATIF */}
                                {(user.role === "chef_bureau" || user.role === "agent_administratif") && (
                                    <>
                                        <MenuParams
                                            title='Livraisons'
                                            icon={<MdDeliveryDining />}
                                            onEvent={() => handleMenu("/dashboard/deliveries")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/deliveries")}
                                        />
                                        <MenuParams
                                            title='Tutorial'
                                            icon={<MdVideoSettings />}
                                            onEvent={() => handleMenu("/dashboard/tutorial")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/tutorial")}
                                        />

                                        {user.role === "chef_bureau" && (
                                            <>
                                                <MenuParams
                                                    title='Les Actions'
                                                    icon={<MdOutlinePendingActions />}
                                                    onEvent={() => handleMenu("/dashboard/actions")}
                                                    isCollapsed={isCollapsed}
                                                    isActive={isRouteActive("/dashboard/actions")}
                                                />
                                                {renderCaisseDropdown()}

                                                {!isCollapsed ? (
                                                    <>
                                                        <div onClick={() => handleClick(1)} className='flex justify-between p-3 items-center font-bold hover:bg-slate-100 dark:hover:bg-zinc-800/70 rounded-2xl text-sm cursor-pointer transition-all my-0.5'>
                                                            <h1 className='flex items-center gap-3'><MdOutlineAdminPanelSettings className='text-xl text-slate-500 dark:text-zinc-400' /> <span className='text-slate-700 dark:text-zinc-200 font-semibold'>Agent administratif</span></h1>
                                                            <MdKeyboardArrowUp className={`text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${isFaqOpen[1] ? 'rotate-180' : ''}`} />
                                                        </div>
                                                        <div className={`transition-all duration-200 overflow-hidden ${isFaqOpen[1] ? 'max-h-screen' : 'max-h-0'}`}>
                                                            <ul className='flex flex-col gap-1 p-2 ml-4 border-l border-slate-200 dark:border-zinc-800'>
                                                                <li className='cursor-pointer text-xs font-semibold'>
                                                                    <div
                                                                        onClick={() => handleMenu("/dashboard/ajoute_agent")}
                                                                        className={`py-1.5 px-2.5 rounded-xl transition-all ${isRouteActive("/dashboard/ajoute_agent") ? 'bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-md shadow-red-600/30' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60'}`}
                                                                    >
                                                                        + Ajouter agents
                                                                    </div>
                                                                </li>
                                                                <li className='cursor-pointer text-xs font-semibold'>
                                                                    <div
                                                                        onClick={() => handleMenu("/dashboard/agent_administratif")}
                                                                        className={`py-1.5 px-2.5 rounded-xl transition-all ${isRouteActive("/dashboard/agent_administratif") ? 'bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-md shadow-red-600/30' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60'}`}
                                                                    >
                                                                        Listes d&apos;agents
                                                                    </div>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <MenuParams
                                                        title='Agent administratif'
                                                        icon={<MdOutlineAdminPanelSettings />}
                                                        onEvent={() => handleMenu("/dashboard/agent_administratif")}
                                                        isCollapsed={isCollapsed}
                                                        isActive={isRouteActive("/dashboard/agent_administratif")}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </>
                                )}

                                {/* GESTION COMMERCIALE */}
                                {user.role === "gestion_commercial" && (
                                    <>
                                        <MenuParams
                                            title='Partenaire'
                                            icon={<MdLocalTaxi />}
                                            onEvent={() => handleMenu("/dashboard/partenaire")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/partenaire")}
                                        />
                                        <MenuParams
                                            title='Magasin'
                                            icon={<MdOutlineStorefront />}
                                            onEvent={() => handleMenu("/dashboard/magasin")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/magasin")}
                                        />
                                        <MenuParams
                                            title='Gestion Employés'
                                            icon={<MdPeopleAlt className='text-rose-500' />}
                                            onEvent={() => handleMenu("/dashboard/employees")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/employees")}
                                        />
                                        <MenuParams
                                            title='Agent administratif'
                                            icon={<GrUserWorker />}
                                            onEvent={() => handleMenu("/dashboard/agent_administratif")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/agent_administratif")}
                                        />

                                        {!isCollapsed ? (
                                            <>
                                                <div onClick={() => handleClick(2)} className='flex justify-between p-3 items-center font-bold hover:bg-slate-100 dark:hover:bg-zinc-800/70 rounded-2xl text-sm cursor-pointer transition-all my-0.5'>
                                                    <h1 className='flex items-center gap-3'><MdOutlineAdminPanelSettings className='text-xl text-slate-500 dark:text-zinc-400' /> <span className='text-slate-700 dark:text-zinc-200 font-semibold'>Superviseur</span></h1>
                                                    <MdKeyboardArrowUp className={`text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${isFaqOpen[2] ? 'rotate-180' : ''}`} />
                                                </div>
                                                <div className={`transition-all duration-200 overflow-hidden ${isFaqOpen[2] ? 'max-h-screen' : 'max-h-0'}`}>
                                                    <ul className='flex flex-col gap-1 p-2 ml-4 border-l border-slate-200 dark:border-zinc-800'>
                                                        <li className='cursor-pointer text-xs font-semibold'>
                                                            <div
                                                                onClick={() => handleMenu("/dashboard/ajoute_superviseur")}
                                                                className={`py-1.5 px-2.5 rounded-xl transition-all ${isRouteActive("/dashboard/ajoute_superviseur") ? 'bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-md shadow-red-600/30' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60'}`}
                                                            >
                                                                + Créer
                                                            </div>
                                                        </li>
                                                        <li className='cursor-pointer text-xs font-semibold'>
                                                            <div
                                                                onClick={() => handleMenu("/dashboard/modifie_superviseur")}
                                                                className={`py-1.5 px-2.5 rounded-xl transition-all ${isRouteActive("/dashboard/modifie_superviseur") ? 'bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-md shadow-red-600/30' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60'}`}
                                                            >
                                                                Modifier
                                                            </div>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </>
                                        ) : (
                                            <MenuParams
                                                title='Superviseur'
                                                icon={<MdOutlineAdminPanelSettings />}
                                                onEvent={() => handleMenu("/dashboard/modifie_superviseur")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/modifie_superviseur")}
                                            />
                                        )}
                                    </>
                                )}

                                {/* CENTRE D'APPEL */}
                                {user.role === "centre_appel" && (
                                    <>
                                        <MenuParams
                                            title='Dispatch & Carte Live'
                                            icon={<MdMap className='text-emerald-400' />}
                                            onEvent={() => handleMenu("/dashboard/confirmation/dispatch")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/confirmation/dispatch")}
                                        />
                                        <MenuParams
                                            title='Groupes'
                                            icon={<MdGroup />}
                                            onEvent={() => handleMenu("/dashboard/groupes")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/groupes")}
                                        />
                                        <MenuParams
                                            title='Gestion Employés'
                                            icon={<MdPeopleAlt className='text-indigo-400' />}
                                            onEvent={() => handleMenu("/dashboard/employees")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/employees") || isRouteActive("/dashboard/confirmation/employees")}
                                        />
                                        <div className='relative'>
                                            <MenuParams
                                                title='Confirmation'
                                                icon={<MdOutlineConfirmationNumber />}
                                                onEvent={() => handleMenu("/dashboard/confirmation")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/confirmation")}
                                            />
                                            {countConfirmation && countConfirmation !== 0 ? (
                                                <span className={`absolute ${isCollapsed ? "-top-1 -right-1" : "top-3.5 right-10"} py-0.5 px-2 text-xs rounded-full text-white font-bold bg-red-600 shadow`}>
                                                    {countConfirmation}
                                                </span>
                                            ) : null}
                                        </div>
                                        <MenuParams
                                            title='Validation'
                                            icon={<GrValidate />}
                                            onEvent={() => handleMenu("/dashboard/validation")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/validation")}
                                        />
                                        {/* <MenuParams
                                            title='Créer Livreur'
                                            icon={<MdDeliveryDining />}
                                            onEvent={() => handleMenu("/dashboard/ajoute_livreur")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/ajoute_livreur")}
                                        />
                                        <MenuParams
                                            title='Créer Magasin'
                                            icon={<MdOutlineStorefront />}
                                            onEvent={() => handleMenu("/dashboard/ajoute_magasin")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/ajoute_magasin")}
                                        /> */}
                                        <MenuParams
                                            title='Liste Livreurs'
                                            icon={<MdDeliveryDining />}
                                            onEvent={() => handleMenu("/dashboard/livreurs")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/livreurs")}
                                        />
                                        <MenuParams
                                            title='Codes Promo'
                                            icon={<MdLocalOffer className='text-amber-500' />}
                                            onEvent={() => handleMenu("/dashboard/confirmation/promo")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/confirmation/promo")}
                                        />
                                        <MenuParams
                                            title='Publicités & Bannières'
                                            icon={<MdCampaign className='text-pink-500' />}
                                            onEvent={() => handleMenu("/dashboard/confirmation/publicites")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/confirmation/publicites")}
                                        />
                                        <MenuParams
                                            title='Stories Mobile'
                                            icon={<MdAmpStories className='text-purple-500' />}
                                            onEvent={() => handleMenu("/dashboard/confirmation/stories")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/confirmation/stories")}
                                        />
                                        <MenuParams
                                            title='Objectifs & Primes'
                                            icon={<FaTrophy className='text-amber-400' />}
                                            onEvent={() => handleMenu("/dashboard/objectifs")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/objectifs") || isRouteActive("/dashboard/confirmation/objectifs")}
                                        />
                                        {renderVtcDropdown()}
                                        {renderCaisseDropdown()}
                                    </>
                                )}

                                {/* ROLE ADMINISTRATEUR */}
                                {user.role === "admin" && (
                                    <>
                                        <MenuParams
                                            title='Dispatch & Carte Live'
                                            icon={<MdMap className='text-emerald-400' />}
                                            onEvent={() => handleMenu("/dashboard/confirmation/dispatch")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/confirmation/dispatch")}
                                        />
                                        <MenuParams
                                            title='Dispatch VTC & Carte Live'
                                            icon={<MdMap className='text-amber-500' />}
                                            onEvent={() => handleMenu("/dashboard/vtc_dispatch")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/vtc_dispatch")}
                                        />
                                        <div className='relative'>
                                            <MenuParams
                                                title='Confirmation'
                                                icon={<MdOutlineConfirmationNumber className='text-teal-500' />}
                                                onEvent={() => handleMenu("/dashboard/confirmation")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/confirmation")}
                                            />
                                            {countConfirmation && countConfirmation !== 0 ? (
                                                <span className={`absolute ${isCollapsed ? "-top-1 -right-1" : "top-3.5 right-10"} py-0.5 px-2 text-xs rounded-full text-white font-bold bg-red-600 shadow`}>
                                                    {countConfirmation}
                                                </span>
                                            ) : null}
                                        </div>

                                        <MenuParams
                                            title='Gestion Employés'
                                            icon={<MdPeopleAlt className='text-indigo-400' />}
                                            onEvent={() => handleMenu("/dashboard/employees")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/employees") || isRouteActive("/dashboard/confirmation/employees")}
                                        />
                                        <MenuParams
                                            title='+ Créer Commande'
                                            icon={<MdAddCircle className='text-emerald-500' />}
                                            onEvent={() => handleMenu("/dashboard/confirmation/create_commande")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/confirmation/create_commande")}
                                        />
                                        <MenuParams
                                            title='Commandes par Wilaya'
                                            icon={<MdOutlineConfirmationNumber className='text-violet-500' />}
                                            onEvent={() => handleMenu("/dashboard/confirmation/commandes")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/confirmation/commandes")}
                                        />
                                        <MenuParams
                                            title='Magasins'
                                            icon={<MdOutlineStorefront className='text-rose-500' />}
                                            onEvent={() => handleMenu("/dashboard/confirmation/magasins")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/confirmation/magasins")}
                                        />
                                        <MenuParams
                                            title='Livreurs'
                                            icon={<MdDeliveryDining className='text-orange-500' />}
                                            onEvent={() => handleMenu("/dashboard/confirmation/livreurs")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/confirmation/livreurs")}
                                        />
                                        <MenuParams
                                            title="Centre d'appel"
                                            icon={<MdContactSupport className='text-sky-500' />}
                                            onEvent={() => handleMenu("/dashboard/apple_center")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/apple_center")}
                                        />
                                        <MenuParams
                                            title='Codes Promo'
                                            icon={<MdLocalOffer className='text-amber-500' />}
                                            onEvent={() => handleMenu("/dashboard/confirmation/promo")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/confirmation/promo")}
                                        />
                                        <MenuParams
                                            title='Publicités & Bannières'
                                            icon={<MdCampaign className='text-pink-500' />}
                                            onEvent={() => handleMenu("/dashboard/confirmation/publicites")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/confirmation/publicites")}
                                        />
                                        <MenuParams
                                            title='Stories Mobile'
                                            icon={<MdAmpStories className='text-purple-500' />}
                                            onEvent={() => handleMenu("/dashboard/confirmation/stories")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/confirmation/stories")}
                                        />
                                        {canCommissionVtc && (
                                            <MenuParams
                                                title='Commission VTC'
                                                icon={<MdAttachMoney className='text-amber-400' />}
                                                onEvent={() => handleMenu("/dashboard/commission_vtc")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/commission_vtc")}
                                            />
                                        )}
                                        <MenuParams
                                            title='Commission Livreur'
                                            icon={<MdDeliveryDining className='text-emerald-500' />}
                                            onEvent={() => handleMenu("/dashboard/commission_livreur")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/commission_livreur")}
                                        />
                                        <MenuParams
                                            title='Objectifs & Primes'
                                            icon={<FaTrophy className='text-amber-400' />}
                                            onEvent={() => handleMenu("/dashboard/objectifs")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/objectifs") || isRouteActive("/dashboard/confirmation/objectifs")}
                                        />
                                        {renderVtcDropdown()}
                                        {renderCaisseDropdown()}
                                    </>
                                )}

                                {/* ROLE CONFIRMATION (Pages de base + pages configurables par l'admin) */}
                                {user.role === "confirmation" && (
                                    <>
                                        {/* 1. Page Dispatch & Carte Live */}
                                        {canDispatch && (
                                            <MenuParams
                                                title='Dispatch & Carte Live'
                                                icon={<MdMap className='text-emerald-400' />}
                                                onEvent={() => handleMenu("/dashboard/confirmation/dispatch")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/confirmation/dispatch")}
                                            />
                                        )}

                                        {/* 2. Page Confirmation */}
                                        <div className='relative'>
                                            <MenuParams
                                                title='Confirmation'
                                                icon={<MdOutlineConfirmationNumber className='text-teal-500' />}
                                                onEvent={() => handleMenu("/dashboard/confirmation")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/confirmation")}
                                            />
                                            {countConfirmation && countConfirmation !== 0 ? (
                                                <span className={`absolute ${isCollapsed ? "-top-1 -right-1" : "top-3.5 right-10"} py-0.5 px-2 text-xs rounded-full text-white font-bold bg-red-600 shadow`}>
                                                    {countConfirmation}
                                                </span>
                                            ) : null}
                                        </div>

                                        {/* 3. Page Ajouter Commande & 4. Page Commande par Wilaya */}
                                        {canCommandes && (
                                            <>
                                                <MenuParams
                                                    title='+ Créer Commande'
                                                    icon={<MdAddCircle className='text-emerald-500' />}
                                                    onEvent={() => handleMenu("/dashboard/confirmation/create_commande")}
                                                    isCollapsed={isCollapsed}
                                                    isActive={isRouteActive("/dashboard/confirmation/create_commande")}
                                                />
                                                <MenuParams
                                                    title='Commandes par Wilaya'
                                                    icon={<MdOutlineConfirmationNumber className='text-violet-500' />}
                                                    onEvent={() => handleMenu("/dashboard/confirmation/commandes")}
                                                    isCollapsed={isCollapsed}
                                                    isActive={isRouteActive("/dashboard/confirmation/commandes")}
                                                />
                                            </>
                                        )}

                                        {/* PAGES CONFIGURABLES (ACCÈS ACCORDÉ PAR L'ADMIN VIA LES PERMISSIONS) */}
                                        {canValidation && (
                                            <MenuParams
                                                title='Validation'
                                                icon={<GrValidate />}
                                                onEvent={() => handleMenu("/dashboard/validation")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/validation")}
                                            />
                                        )}
                                        {canMagasins && (
                                            <MenuParams
                                                title='Magasins'
                                                icon={<MdOutlineStorefront className='text-rose-500' />}
                                                onEvent={() => handleMenu("/dashboard/confirmation/magasins")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/confirmation/magasins")}
                                            />
                                        )}
                                        {canLivreurs && (
                                            <MenuParams
                                                title='Livreurs'
                                                icon={<MdDeliveryDining className='text-orange-500' />}
                                                onEvent={() => handleMenu("/dashboard/confirmation/livreurs")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/confirmation/livreurs")}
                                            />
                                        )}
                                        {canAppleCenter && (
                                            <MenuParams
                                                title="Centre d'appel"
                                                icon={<MdContactSupport className='text-sky-500' />}
                                                onEvent={() => handleMenu("/dashboard/apple_center")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/apple_center")}
                                            />
                                        )}
                                        {canPromo && (
                                            <>
                                                <MenuParams
                                                    title='Codes Promo'
                                                    icon={<MdLocalOffer className='text-amber-500' />}
                                                    onEvent={() => handleMenu("/dashboard/confirmation/promo")}
                                                    isCollapsed={isCollapsed}
                                                    isActive={isRouteActive("/dashboard/confirmation/promo")}
                                                />
                                                <MenuParams
                                                    title='Publicités & Bannières'
                                                    icon={<MdCampaign className='text-pink-500' />}
                                                    onEvent={() => handleMenu("/dashboard/confirmation/publicites")}
                                                    isCollapsed={isCollapsed}
                                                    isActive={isRouteActive("/dashboard/confirmation/publicites")}
                                                />
                                                <MenuParams
                                                    title='Stories Mobile'
                                                    icon={<MdAmpStories className='text-purple-500' />}
                                                    onEvent={() => handleMenu("/dashboard/confirmation/stories")}
                                                    isCollapsed={isCollapsed}
                                                    isActive={isRouteActive("/dashboard/confirmation/stories")}
                                                />
                                            </>
                                        )}
                                        {canCommissionVtc && (
                                            <MenuParams
                                                title='Commission VTC'
                                                icon={<MdAttachMoney className='text-amber-400' />}
                                                onEvent={() => handleMenu("/dashboard/commission_vtc")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/commission_vtc")}
                                            />
                                        )}
                                        {canCommissionLivreur && (
                                            <MenuParams
                                                title='Commission Livreur'
                                                icon={<MdDeliveryDining className='text-emerald-500' />}
                                                onEvent={() => handleMenu("/dashboard/commission_livreur")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/commission_livreur")}
                                            />
                                        )}
                                        {canObjectifs && (
                                            <MenuParams
                                                title='Objectifs & Primes'
                                                icon={<FaTrophy className='text-amber-400' />}
                                                onEvent={() => handleMenu("/dashboard/objectifs")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/objectifs") || isRouteActive("/dashboard/confirmation/objectifs")}
                                            />
                                        )}
                                        {canDeliveries && (
                                            <MenuParams
                                                title='Suivi des Livraisons'
                                                icon={<MdDeliveryDining className='text-blue-500' />}
                                                onEvent={() => handleMenu("/dashboard/deliveries")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/deliveries")}
                                            />
                                        )}
                                        {canPartenaire && (
                                            <MenuParams
                                                title='Partenaire'
                                                icon={<MdLocalTaxi className='text-indigo-500' />}
                                                onEvent={() => handleMenu("/dashboard/partenaire")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/partenaire")}
                                            />
                                        )}
                                        {canRapports && (
                                            <MenuParams
                                                title='Rapports'
                                                icon={<MdOutlineReport className='text-purple-500' />}
                                                onEvent={() => handleMenu("/dashboard/rapports")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/rapports")}
                                            />
                                        )}
                                        {canRecharge && (
                                            <MenuParams
                                                title='Recharger'
                                                icon={<TbRecharging className='text-amber-500' />}
                                                onEvent={() => handleMenu("/dashboard/recharge")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/recharge")}
                                            />
                                        )}
                                        {renderVtcDropdown()}
                                        {renderCaisseDropdown()}
                                    </>
                                )}

                                {/* SUPERVISEUR */}
                                {user.role === "superviseur" && (
                                    <>
                                        <MenuParams
                                            title='Validation'
                                            icon={<GrValidate />}
                                            onEvent={() => handleMenu("/dashboard/validation")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/validation")}
                                        />
                                        <MenuParams
                                            title='Rapports'
                                            icon={<MdOutlineReport />}
                                            onEvent={() => handleMenu("/dashboard/rapports")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/rapports")}
                                        />
                                        <MenuParams
                                            title='Recharger'
                                            icon={<TbRecharging />}
                                            onEvent={() => handleMenu("/dashboard/recharge")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/recharge")}
                                        />
                                    </>
                                )}

                                {/* VALIDATION VTC */}
                                {user.role === "validation_vtc" && (
                                    <>
                                        {canDispatchVtc && (
                                            <MenuParams
                                                title='Dispatch VTC & Carte Live'
                                                icon={<MdMap className='text-amber-500' />}
                                                onEvent={() => handleMenu("/dashboard/vtc_dispatch")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/vtc_dispatch")}
                                            />
                                        )}
                                        {canVtcDetaille && (
                                            <MenuParams
                                                title='VTC par détail'
                                                icon={<MdLocalTaxi className='text-amber-500' />}
                                                onEvent={() => handleMenu("/dashboard/courses")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/courses")}
                                            />
                                        )}
                                        {canVtcDetaille && (
                                            <MenuParams
                                                title='VTC par groupe'
                                                icon={<MdLocalTaxi className='text-amber-500' />}
                                                onEvent={() => handleMenu("/dashboard/vtc_rapide")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/vtc_rapide")}
                                            />
                                        )}
                                        {canCommissionVtc && (
                                            <MenuParams
                                                title='Commission VTC'
                                                icon={<MdAttachMoney className='text-amber-400' />}
                                                onEvent={() => handleMenu("/dashboard/commission_vtc")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/commission_vtc")}
                                            />
                                        )}
                                        {renderVtcDropdown()}
                                        {renderCaisseDropdown()}
                                        {canActionsVtc && (
                                            <MenuParams
                                                title='Actions'
                                                icon={<MdOutlinePendingActions className='text-indigo-500' />}
                                                onEvent={() => handleMenu("/dashboard/center_actions")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/center_actions")}
                                            />
                                        )}
                                        {canDemandesVtc && (
                                            <div className='relative'>
                                                <MenuParams
                                                    title='Demandes'
                                                    icon={<MdOutlineRequestQuote className='text-teal-500' />}
                                                    onEvent={() => handleMenu("/dashboard/demande")}
                                                    isCollapsed={isCollapsed}
                                                    isActive={isRouteActive("/dashboard/demande")}
                                                />
                                                {countState && countState !== 0 ? (
                                                    <span className={`absolute ${isCollapsed ? "-top-1 -right-1" : "top-3.5 right-10"} py-0.5 px-2 text-xs rounded-full text-white font-bold bg-red-600 shadow`}>
                                                        {countState}
                                                    </span>
                                                ) : null}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* SUIVI VTC */}
                                {user.role === "suivi_vtc" && (
                                    <>
                                        {canDispatchVtc && (
                                            <MenuParams
                                                title='Dispatch VTC & Carte Live'
                                                icon={<MdMap className='text-amber-500' />}
                                                onEvent={() => handleMenu("/dashboard/vtc_dispatch")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/vtc_dispatch")}
                                            />
                                        )}
                                        {canListCourse && (
                                            <MenuParams
                                                title='Courses VTC'
                                                icon={<MdLocalTaxi className='text-amber-500' />}
                                                onEvent={() => handleMenu("/dashboard/courses")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/courses")}
                                            />
                                        )}
                                        {canVtcDetaille && (
                                            <MenuParams
                                                title='VTC par groupe'
                                                icon={<MdLocalTaxi className='text-amber-500' />}
                                                onEvent={() => handleMenu("/dashboard/vtc_rapide")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/vtc_rapide")}
                                            />
                                        )}
                                        {canCommissionVtc && (
                                            <MenuParams
                                                title='Commission VTC'
                                                icon={<MdAttachMoney className='text-amber-400' />}
                                                onEvent={() => handleMenu("/dashboard/commission_vtc")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/commission_vtc")}
                                            />
                                        )}
                                        {renderVtcDropdown()}
                                        {renderCaisseDropdown()}
                                        {canActionsVtc && (
                                            <MenuParams
                                                title='Actions'
                                                icon={<MdOutlinePendingActions className='text-indigo-500' />}
                                                onEvent={() => handleMenu("/dashboard/center_actions")}
                                                isCollapsed={isCollapsed}
                                                isActive={isRouteActive("/dashboard/center_actions")}
                                            />
                                        )}
                                        {canDemandesVtc && (
                                            <div className='relative'>
                                                <MenuParams
                                                    title='Demandes'
                                                    icon={<MdOutlineRequestQuote className='text-teal-500' />}
                                                    onEvent={() => handleMenu("/dashboard/demande")}
                                                    isCollapsed={isCollapsed}
                                                    isActive={isRouteActive("/dashboard/demande")}
                                                />
                                                {countState && countState !== 0 ? (
                                                    <span className={`absolute ${isCollapsed ? "-top-1 -right-1" : "top-3.5 right-10"} py-0.5 px-2 text-xs rounded-full text-white font-bold bg-red-600 shadow`}>
                                                        {countState}
                                                    </span>
                                                ) : null}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* COMPTABLE */}
                                {user.role === "comptable" && (
                                    <>
                                        {renderCaisseDropdown()}
                                        <MenuParams
                                            title='Actions par groupe'
                                            icon={<MdOutlinePendingActions />}
                                            onEvent={() => handleMenu("/dashboard/group_actions")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/group_actions")}
                                        />
                                    </>
                                )}

                                {(user.role === "superviseur" || user.role === "agent_administratif" || user.role === "gestion_commercial" || user.role === "aide_comptable") && (
                                    renderCaisseDropdown()
                                )}

                                {/* PARTENAIRE */}
                                {user.role === "partener" && (
                                    <>
                                        <MenuParams
                                            title='Gestion Produit'
                                            icon={<MdOutlineStorefront />}
                                            onEvent={() => handleMenu("/dashboard/product_management")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/product_management")}
                                        />
                                        <MenuParams
                                            title='Commandes'
                                            icon={<MdOutlineShoppingBasket />}
                                            onEvent={() => handleMenu("/dashboard/commandes")}
                                            isCollapsed={isCollapsed}
                                            isActive={isRouteActive("/dashboard/commandes")}
                                        />
                                    </>
                                )}

                                {(user.role === "admin" || user.role === "centre_appel") && (
                                    <MenuParams
                                        title='Tutorial'
                                        icon={<MdVideoSettings className='text-red-500' />}
                                        onEvent={() => handleMenu("/dashboard/tutorial")}
                                        isCollapsed={isCollapsed}
                                        isActive={isRouteActive("/dashboard/tutorial")}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Bottom Logout / Account Section */}
                <div className='py-4 border-t border-slate-200/80 dark:border-zinc-800/80 mt-auto'>
                    {user ? (
                        <div
                            onClick={handleSubmit}
                            title="Se déconnecter"
                            className={`group flex items-center ${isCollapsed ? "justify-center p-3" : "justify-between p-3"} font-bold hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl cursor-pointer transition-all`}
                        >
                            <div className='flex items-center gap-3 text-sm'>
                                <MdLogout className='text-xl shrink-0' />
                                {!isCollapsed && <span className='font-semibold'>Déconnexion</span>}
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => handleMenu("/login")}
                            className={`flex items-center ${isCollapsed ? "justify-center p-3" : "justify-between p-3"} font-bold hover:bg-slate-100 dark:hover:bg-zinc-800/70 text-slate-700 dark:text-zinc-300 rounded-2xl cursor-pointer transition-all`}
                        >
                            <div className='flex items-center gap-3 text-sm'>
                                <MdLogin className='text-xl shrink-0' />
                                {!isCollapsed && <span className='font-semibold'>Se connecter</span>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile backdrop */}
            {isMenuOpen && (
                <div
                    onClick={() => handleMenu(null)}
                    className='fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm md:hidden'
                />
            )}

            {isLoading && <LoadingFirst />}
        </>
    );
}
