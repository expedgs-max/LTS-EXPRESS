"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HiOutlineLockClosed, HiArrowLeft } from "react-icons/hi";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { TbLoader3 } from "react-icons/tb";
import { changePassword } from "@/lib/auth";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function Reset({ token, id }: { token: string; id: string }) {
    const router = useRouter();
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [showPass, setShowPass] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!newPassword || newPassword !== confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas.");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }

        setIsSubmitting(true);
        const loadingToastId = toast.loading("Mise à jour du mot de passe...");

        try {
            const response = await changePassword({
                new_password: newPassword,
                token: token,
                uid: id,
            });

            if (response && typeof response === "object" && response.code === 200) {
                toast.success("Mot de passe modifié avec succès ! Redirection...", { id: loadingToastId });
                setTimeout(() => {
                    router.push("/login");
                }, 1500);
            } else {
                toast.error(typeof response === "string" ? response : "Une erreur est survenue.", { id: loadingToastId });
            }
        } catch {
            toast.error("Problème de connexion avec le serveur", { id: loadingToastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0d0f12] relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
            {/* Ambient Background Glows */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-800/15 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl shadow-black/60 p-8 sm:p-10 relative z-10">
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="p-2.5 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg shadow-red-600/30 inline-block mb-4">
                        <Image
                            src="/ltc-logo.png"
                            alt="LTC Express"
                            width={110}
                            height={32}
                            className="h-7 w-auto object-contain brightness-0 invert"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Nouveau mot de passe</h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        Veuillez définir votre nouveau mot de passe sécurisé.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="new_password"
                            className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
                        >
                            Nouveau mot de passe
                        </label>
                        <div className="relative rounded-xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                <HiOutlineLockClosed className="text-lg" />
                            </div>
                            <input
                                type={showPass ? "text" : "password"}
                                name="new_password"
                                id="new_password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                placeholder="••••••••••••"
                                className="block w-full pl-10 pr-11 py-3 bg-zinc-800/60 border border-zinc-700/80 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none"
                            >
                                {showPass ? <FaEyeSlash className="text-base" /> : <FaEye className="text-base" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="confirm_password"
                            className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
                        >
                            Confirmer le mot de passe
                        </label>
                        <div className="relative rounded-xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                <HiOutlineLockClosed className="text-lg" />
                            </div>
                            <input
                                type={showPass ? "text" : "password"}
                                name="confirm_password"
                                id="confirm_password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="••••••••••••"
                                className="block w-full pl-10 pr-4 py-3 bg-zinc-800/60 border border-zinc-700/80 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-600/25 hover:shadow-red-600/40 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                    >
                        {isSubmitting ? (
                            <>
                                <TbLoader3 className="animate-spin text-lg" />
                                <span>Mise à jour en cours...</span>
                            </>
                        ) : (
                            <span>Valider le nouveau mot de passe</span>
                        )}
                    </button>

                    <div className="text-center pt-2">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                        >
                            <HiArrowLeft className="text-base" />
                            Retour à la connexion
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
