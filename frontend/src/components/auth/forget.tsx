"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HiOutlineMail, HiArrowLeft } from "react-icons/hi";
import { TbLoader3 } from "react-icons/tb";
import { sendForget } from "@/lib/auth";
import { toast } from "react-hot-toast";

export default function Forget() {
    const [email, setEmail] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!email || email.trim() === "") {
            toast.error("Veuillez saisir votre adresse e-mail.");
            return;
        }

        setIsSubmitting(true);
        const loadingToastId = toast.loading("Envoi du lien de réinitialisation...");

        try {
            const formData = new FormData(event.currentTarget);
            const formObject = Object.fromEntries(formData.entries());
            const response = await sendForget(formObject);

            if (response && typeof response === "object" && response.code === 200) {
                toast.success("E-mail envoyé avec succès ! Vérifiez votre boîte de réception.", { id: loadingToastId });
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
                {/* Logo & Header */}
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
                    <h1 className="text-2xl font-bold text-white tracking-tight">Mot de passe oublié</h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        Entrez votre adresse e-mail pour recevoir les instructions de réinitialisation.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="email"
                            className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
                        >
                            Adresse E-mail
                        </label>
                        <div className="relative rounded-xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                <HiOutlineMail className="text-lg" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="exemple@entreprise.com"
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
                                <span>Envoi en cours...</span>
                            </>
                        ) : (
                            <span>Envoyer le lien</span>
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
