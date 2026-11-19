"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SignIn } from "@/lib/auth";
import { toast } from "react-hot-toast";
import React, { useState } from "react";
import LoadingFirst from "../loading";
import { TbLoader3 } from "react-icons/tb";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { HiOutlineUser, HiOutlineLockClosed, HiShieldCheck } from "react-icons/hi2";
import { MdOutlineLocalShipping, MdOutlineBolt, MdOutlineHeadsetMic } from "react-icons/md";

export default function Login() {
    const [isLoading, setLoading] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showPass, setShowPass] = useState<boolean>(false);
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [rememberMe, setRememberMe] = useState<boolean>(true);

    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!username.trim() || !password.trim()) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setIsSubmitting(true);
        const loadingToastId = toast.loading("Connexion en cours...");

        try {
            const result = await SignIn({ username: username.trim(), password });

            if (result && typeof result === "object" && "code" in result && result.code === 200) {
                setLoading(true);
                toast.success("Connexion réussie ! Redirection...", { id: loadingToastId });
                router.push("/dashboard");
                return;
            } else {
                const errorText = typeof result === "string"
                    ? result
                    : (result as { message?: string })?.message || "Nom d'utilisateur ou mot de passe incorrect";

                if (
                    errorText.includes("192.168.") ||
                    errorText.includes("localhost") ||
                    errorText.includes("ngrok") ||
                    errorText.includes("Network Error")
                ) {
                    toast.error("Impossible de joindre le serveur. Vérifiez votre connexion.", { id: loadingToastId });
                } else if (
                    errorText.toLowerCase().includes("incorrect") ||
                    errorText.toLowerCase().includes("faux") ||
                    errorText.toLowerCase().includes("wrong") ||
                    errorText.toLowerCase().includes("invalide") ||
                    errorText.toLowerCase().includes("password") ||
                    errorText.toLowerCase().includes("username")
                ) {
                    toast.error("Identifiants incorrects. Veuillez réessayer.", { id: loadingToastId });
                } else {
                    toast.error(errorText, { id: loadingToastId });
                }
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error("Erreur de connexion au serveur", { id: loadingToastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0d0f12] relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
            {/* Ambient Background Glows */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-800/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-950/10 rounded-full blur-[140px] pointer-events-none" />

            {/* Main Auth Container */}
            <div className="w-full max-w-5xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden grid lg:grid-cols-12 relative z-10">
                
                {/* Left Brand Showcase (Visible on lg screens) */}
                <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-10 flex-col justify-between relative border-r border-zinc-800/60">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-red-600/10 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Brand Top Header */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-900/90 border border-zinc-800 rounded-xl shadow-lg shadow-black/40">
                                <Image
                                    src="/ltc_logo_brand_white.svg"
                                    alt="LTC Express"
                                    width={140}
                                    height={44}
                                    className="h-10 w-auto object-contain"
                                    priority
                                />
                            </div>
                        </div>
                        <div className="mt-8">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                Plateforme Entreprise
                            </span>
                            <h2 className="mt-4 text-2xl xl:text-3xl font-bold text-white tracking-tight leading-snug">
                                Gestion Logistique & <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">Livraison Intelligente</span>
                            </h2>
                            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                                Accédez à votre tableau de bord centralisé pour piloter vos courses, livreurs, partenaires et flux en temps réel.
                            </p>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="relative z-10 space-y-4 my-8">
                        <div className="flex items-start gap-3.5 p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/30">
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                                <MdOutlineLocalShipping className="text-xl" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-zinc-200">Suivi Flotte & Commandes</h4>
                                <p className="text-xs text-zinc-400">Supervision en direct de toutes les expéditions.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5 p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/30">
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                                <MdOutlineBolt className="text-xl" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-zinc-200">Dispatch Instantané</h4>
                                <p className="text-xs text-zinc-400">Optimisation intelligente des trajets et assignations.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5 p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/30">
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                                <HiShieldCheck className="text-xl" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-zinc-200">Accès Sécurisé</h4>
                                <p className="text-xs text-zinc-400">Protection des données et gestion fine des rôles.</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer note */}
                    <div className="relative z-10 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
                        <span>© {new Date().getFullYear()} LTC Express</span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Système opérationnel
                        </span>
                    </div>
                </div>

                {/* Right Form Container */}
                <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-zinc-900/60">
                    
                    {/* Mobile Brand Header (Visible on small screens) */}
                    <div className="lg:hidden flex flex-col items-center text-center mb-8">
                        <div className="p-2 bg-zinc-900/90 border border-zinc-800 rounded-xl shadow-lg shadow-black/40 inline-block mb-3">
                            <Image
                                src="/ltc_logo_brand_white.svg"
                                alt="LTC Express"
                                width={130}
                                height={40}
                                className="h-9 w-auto object-contain"
                            />
                        </div>
                        <h2 className="text-xl font-bold text-white">Espace d&apos;administration</h2>
                    </div>

                    <div className="max-w-md w-full mx-auto">
                        <div className="mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                Connexion
                            </h1>
                            <p className="mt-2 text-sm text-zinc-400">
                                Entrez vos identifiants pour accéder à votre tableau de bord.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Username Field */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="username"
                                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
                                >
                                    Nom d&apos;utilisateur
                                </label>
                                <div className="relative rounded-xl shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                        <HiOutlineUser className="text-lg" />
                                    </div>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        autoComplete="username"
                                        placeholder="Ex: admin ou nom d'utilisateur"
                                        className="block w-full pl-10 pr-4 py-3 bg-zinc-800/60 border border-zinc-700/80 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label
                                        htmlFor="password"
                                        className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
                                    >
                                        Mot de passe
                                    </label>
                                    <Link
                                        href="/forget"
                                        className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        Mot de passe oublié ?
                                    </Link>
                                </div>
                                <div className="relative rounded-xl shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                        <HiOutlineLockClosed className="text-lg" />
                                    </div>
                                    <input
                                        type={showPass ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        placeholder="••••••••••••"
                                        className="block w-full pl-10 pr-11 py-3 bg-zinc-800/60 border border-zinc-700/80 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none"
                                        aria-label={showPass ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                    >
                                        {showPass ? <FaEyeSlash className="text-base" /> : <FaEye className="text-base" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember me & Helper */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-red-600 focus:ring-red-500/30 focus:ring-offset-0 transition-colors"
                                    />
                                    <span className="text-xs text-zinc-400 hover:text-zinc-300">Se souvenir de moi</span>
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-600/25 hover:shadow-red-600/40 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                            >
                                {isSubmitting ? (
                                    <>
                                        <TbLoader3 className="animate-spin text-lg" />
                                        <span>Connexion en cours...</span>
                                    </>
                                ) : (
                                    <span>Se connecter</span>
                                )}
                            </button>
                        </form>

                        {/* Extra Links */}
                        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
                            <span>Vous êtes partenaire ?</span>
                            <Link
                                href="/register"
                                className="font-semibold text-red-400 hover:text-red-300 transition-colors underline-offset-4 hover:underline"
                            >
                                Inscription Partenaire StarShop →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading && <LoadingFirst />}
        </div>
    );
}
