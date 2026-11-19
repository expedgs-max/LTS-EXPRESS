"use client";

import React, { useState, useEffect } from "react";
import getMagasin from "@/lib/stores_api";
import { userInformation } from "@/lib/tools/store/web_socket";
import LoadingFirst from "../loading";
import Satistic from "./statistic";
import Chart from "./chart";
import MapDz from "./map-dz";
import MagasinSection from "./magasin-section";
import ConfirmationDashboard from "../confirmation_app/confirmation_dashboard";
import OperationalStats from "./operational_stats";
import { ConfirmationStats } from "@/lib/confirmation_action";
import Link from "next/link";
import { MdOutlineDashboard, MdDeliveryDining, MdOutlinePendingActions, MdLocalTaxi, MdAttachMoney } from "react-icons/md";

export default function Dashboard({
    data,
    initialConfirmationStats
}: {
    data: Context | null;
    initialConfirmationStats?: ConfirmationStats | null;
}) {
    const [magasin, setMagasin] = useState<Magasin | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const { user } = userInformation();

    // Fetch magasin on client side if user is a partner
    useEffect(() => {
        const fetchMagasin = async () => {
            if (user?.role === "partener") {
                const fetchedMagasin = await getMagasin();
                if (!fetchedMagasin) {
                    setIsLoading(false);
                } else {
                    setMagasin(fetchedMagasin);
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };

        fetchMagasin();
    }, [user]);

    const renderContent = () => {
        if (user?.role === "gestion_commercial" || user?.role === "admin") {
            return (
                <div className="w-full space-y-4">
                    {user?.role === "admin" && (
                        <div className="pt-5 px-3 sm:px-6">
                            <OperationalStats initialStats={initialConfirmationStats} />
                        </div>
                    )}
                    <div className="py-2 px-3 sm:px-6">
                        <div className="grid grid-cols-1 w-full">
                            <Satistic data={data} />
                        </div>
                    </div>
                    <div className="py-2 px-2 sm:px-16">
                        {user?.role === "admin" && (
                            <div>
                                <Chart data={data} user={user} />
                            </div>
                        )}
                        <div className="mt-4">
                            <MapDz />
                        </div>
                    </div>
                </div>
            );
        }

        if (user?.role === "partener" && !isLoading && magasin) {
            return <MagasinSection magasin={magasin} />;
        }

        if (user?.role === "confirmation") {
            return <ConfirmationDashboard />;
        }

        if (user?.role === "centre_appel") {
            return (
                <div className="relative w-full top-20 sm:top-10 mx-auto px-3 py-5 flex justify-center">
                    <MapDz />
                </div>
            );
        }

        // Clean welcome portal for other roles
        return (
            <div className="w-full max-w-4xl mx-auto py-10 px-4">
                <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-sm p-8 sm:p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-500 mb-6">
                        <MdOutlineDashboard className="text-3xl" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                        Bienvenue sur votre espace LTC Express
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-md mx-auto mb-8">
                        Utilisez le menu latéral pour accéder directement à vos modules de gestion et fonctionnalités opérationnelles.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
                        {user?.role === "chef_bureau" && (
                            <>
                                <Link
                                    href="/dashboard/deliveries"
                                    className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:border-red-500/50 bg-slate-50 dark:bg-zinc-800/50 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all flex items-center gap-3"
                                >
                                    <MdDeliveryDining className="text-2xl text-red-500" />
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Livraisons</h4>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400">Gérer les expéditions</p>
                                    </div>
                                </Link>
                                <Link
                                    href="/dashboard/actions"
                                    className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:border-red-500/50 bg-slate-50 dark:bg-zinc-800/50 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all flex items-center gap-3"
                                >
                                    <MdOutlinePendingActions className="text-2xl text-red-500" />
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Actions</h4>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400">Historique et suivi</p>
                                    </div>
                                </Link>
                                <Link
                                    href="/dashboard/caisses"
                                    className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:border-red-500/50 bg-slate-50 dark:bg-zinc-800/50 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all flex items-center gap-3"
                                >
                                    <MdAttachMoney className="text-2xl text-red-500" />
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Caisses</h4>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400">Gestion financière</p>
                                    </div>
                                </Link>
                            </>
                        )}

                        {(user?.role === "validation_vtc" || user?.role === "suivi_vtc") && (
                            <>
                                <Link
                                    href="/dashboard/courses"
                                    className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:border-red-500/50 bg-slate-50 dark:bg-zinc-800/50 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all flex items-center gap-3"
                                >
                                    <MdLocalTaxi className="text-2xl text-red-500" />
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Courses VTC</h4>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400">Validation des courses</p>
                                    </div>
                                </Link>
                                <Link
                                    href="/dashboard/vtc_rapide"
                                    className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:border-red-500/50 bg-slate-50 dark:bg-zinc-800/50 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all flex items-center gap-3"
                                >
                                    <MdLocalTaxi className="text-2xl text-red-500" />
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">VTC Rapide</h4>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400">Courses en direct</p>
                                    </div>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center justify-between w-full">
            {renderContent()}
            {isLoading && <LoadingFirst />}
        </div>
    );
}
