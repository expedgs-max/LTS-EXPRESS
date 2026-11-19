import { SignOut } from "@/lib/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaRegUserCircle } from "react-icons/fa";
import { HiOutlineLogout } from "react-icons/hi";
import LoadingFirst from "../loading";

export default function DropDown({ onClose }: { onClose: (value: false) => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading) {
            onClose(false);
        }
    }, [pathname, isLoading, onClose]);

    const handleSubmit = async () => {
        const loadingToastId = toast.loading("Déconnexion en cours...");
        try {
            const result = await SignOut();

            if (result) {
                toast.success("Déconnecté avec succès", { id: loadingToastId });
                setIsLoading(true);
                router.push("/login");
            } else {
                toast.error("Problème lors de la déconnexion", { id: loadingToastId });
            }
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message, { id: loadingToastId });
            } else {
                toast.error("Une erreur inattendue est survenue", { id: loadingToastId });
            }
        }
    };

    return (
        <div className="w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800/80 mb-1">
                <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Mon Compte</p>
            </div>
            <ul className="flex flex-col gap-1">
                <li>
                    <Link
                        href="/dashboard/profile"
                        onClick={() => pathname !== "/dashboard/profile" && setIsLoading(true)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-200 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors group"
                    >
                        <FaRegUserCircle className="text-base text-slate-400 dark:text-zinc-400 group-hover:text-red-500 transition-colors" />
                        <span>Profil & Paramètres</span>
                    </Link>
                </li>
                <li className="pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                    <button
                        onClick={handleSubmit}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors group"
                    >
                        <HiOutlineLogout className="text-lg group-hover:translate-x-0.5 transition-transform" />
                        <span>Se déconnecter</span>
                    </button>
                </li>
            </ul>
            {isLoading && <LoadingFirst />}
        </div>
    );
}
