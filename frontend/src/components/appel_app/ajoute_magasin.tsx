"use client"

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { AddMagasinUser } from '@/lib/call_action'
import { toast } from "react-hot-toast"
import { handleInputChange } from '@/lib/tools/tools'
import { TbLoader3 } from 'react-icons/tb'

export default function AjouteMagasin() {
    const formRef = useRef<HTMLFormElement>(null);
    const [isClicked, setIsClicked] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget)
        const formObject = Object.fromEntries(formData.entries())

        // Required fields check
        const requiredFields = [
            'username', 'password', 'pass', 'email', 'phone_number_1',
            'nom_de_magasin', 'adresse'
        ];

        const isInvalid = requiredFields.some((field) => !formObject[field]);
        const isUsernameInvalid = (formData.get('username') as string).length < 6;

        if (isInvalid) {
            toast.error('Certains champs obligatoires (*) sont vides');
            return;
        } else if (isUsernameInvalid) {
            toast.error('Le nom d\'utilisateur doit contenir au moins 6 caractères');
            return;
        }

        // Format phone number
        formObject.phone_number_1 = String(formObject.phone_number_1).replace(/^0+/, '');
        formObject.phone_number_1 = String(formObject.code) + String(formObject.phone_number_1);

        // Copy fields to match both backend keys (nom_de_magasin & name, adresse & address)
        formObject.name = formObject.nom_de_magasin;
        formObject.address = formObject.adresse;

        setIsClicked(true);

        const result = await AddMagasinUser(formObject);

        setIsClicked(false);
        if (result) {
            formRef.current?.reset();
        }
    };

    return (
        <div className='py-5 px-5 sm:px-16'>
            <div className='flex items-center gap-2 px-5 pb-5 text-xs lg:text-xl'>
                <Link href="/dashboard" className='font-semibold text-third'>Tableau de bord /</Link>
                <h1 className='font-semibold'>Centre d&apos;appel /</h1>
                <h1 className='font-bold'>Ajouté Magasin</h1>
            </div>
            <div className='py-8 max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden'>
                <div className='bg-gradient-to-r from-primer to-slate-800 py-6 px-8 text-white'>
                    <h1 className="text-2xl font-bold">Créer un nouveau compte Magasin / Restaurant</h1>
                    <p className='text-sm text-slate-300 mt-1'>Remplissez les informations ci-dessous pour ajouter un partenaire magasin</p>
                </div>

                <form onSubmit={handleSubmit} ref={formRef} className='flex flex-col gap-6 py-8 px-6 sm:px-10'>
                    {/* Section 1: Informations de compte */}
                    <div>
                        <h2 className='text-lg font-semibold text-third border-b pb-2 mb-4'>1. Informations du compte propriétaire</h2>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div className='flex flex-col gap-1'>
                                <p className='flex text-sm font-medium text-slate-700'><span>Nom d&apos;utilisateur</span><span className='text-red-600 ml-1'>*</span></p>
                                <input type="text" name="username" placeholder='username (min 6 caractères)' className='p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-third focus:border-transparent outline-none transition-all' />
                            </div>
                            <div className='flex flex-col gap-1'>
                                <p className='flex text-sm font-medium text-slate-700'><span>Email</span><span className='text-red-600 ml-1'>*</span></p>
                                <input type="email" name="email" placeholder='exemple@email.com' className='p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-third focus:border-transparent outline-none transition-all' />
                            </div>
                            <div className='flex flex-col gap-1'>
                                <p className='flex text-sm font-medium text-slate-700'><span>Numéro de téléphone</span><span className='text-red-600 ml-1'>*</span></p>
                                <div className='flex gap-2'>
                                    <input readOnly name='code' value="+213" className='p-3 border border-slate-300 rounded-md w-1/4 text-center bg-slate-50 font-semibold text-slate-600' />
                                    <input onChange={handleInputChange} type="text" name="phone_number_1" placeholder='Ex: 555123456' className='p-3 border border-slate-300 rounded-md w-full focus:ring-2 focus:ring-third focus:border-transparent outline-none transition-all' />
                                </div>
                            </div>
                            <div className='flex flex-col gap-1'>
                                <p className='flex text-sm font-medium text-slate-700'><span>Mot de passe</span><span className='text-red-600 ml-1'>*</span></p>
                                <input type="password" name="password" placeholder='Mot de passe' className='p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-third focus:border-transparent outline-none transition-all' />
                            </div>
                            <div className='flex flex-col gap-1 md:col-span-2'>
                                <p className='flex text-sm font-medium text-slate-700'><span>Confirmer le mot de passe</span><span className='text-red-600 ml-1'>*</span></p>
                                <input type="password" name="pass" placeholder='Confirmer le mot de passe' className='p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-third focus:border-transparent outline-none transition-all' />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Informations du Magasin */}
                    <div className='mt-4'>
                        <h2 className='text-lg font-semibold text-third border-b pb-2 mb-4'>2. Informations du magasin</h2>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div className='flex flex-col gap-1 md:col-span-2'>
                                <p className='flex text-sm font-medium text-slate-700'><span>Nom du magasin / restaurant</span><span className='text-red-600 ml-1'>*</span></p>
                                <input type="text" name="nom_de_magasin" placeholder='Ex: Pizzeria Bella Italia' className='p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-third focus:border-transparent outline-none transition-all' />
                            </div>
                            <div className='flex flex-col gap-1 md:col-span-2'>
                                <p className='flex text-sm font-medium text-slate-700'><span>Adresse complète</span><span className='text-red-600 ml-1'>*</span></p>
                                <input type="text" name="adresse" placeholder='Ex: 12 Rue de la liberté, Alger' className='p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-third focus:border-transparent outline-none transition-all' />
                            </div>
                            <div className='flex flex-col gap-1 md:col-span-2'>
                                <p className='text-sm font-medium text-slate-700'>Description / Catégorie</p>
                                <textarea name="description" placeholder='Description des produits ou spécialité' className='p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-third focus:border-transparent outline-none transition-all h-24 resize-none' />
                            </div>
                            <div className='flex flex-col gap-1'>
                                <p className='text-sm font-medium text-slate-700'>Latitude (Coordonnée GPS)</p>
                                <input type="text" name="latitude" placeholder='Ex: 36.7538' className='p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-third focus:border-transparent outline-none transition-all' />
                            </div>
                            <div className='flex flex-col gap-1'>
                                <p className='text-sm font-medium text-slate-700'>Longitude (Coordonnée GPS)</p>
                                <input type="text" name="longitude" placeholder='Ex: 3.0588' className='p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-third focus:border-transparent outline-none transition-all' />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Documents Administratifs */}
                    <div className='mt-4'>
                        <h2 className='text-lg font-semibold text-third border-b pb-2 mb-4'>3. Documents administratifs</h2>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div className='flex flex-col gap-1'>
                                <p className='text-sm font-medium text-slate-700'>Numéro d&apos;acte / Décision</p>
                                <input type="text" name="numero_act" placeholder='Ex: ACT-2026-90' className='p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-third focus:border-transparent outline-none transition-all' />
                            </div>
                            <div className='flex flex-col gap-1'>
                                <p className='text-sm font-medium text-slate-700'>Registre de Commerce (RC)</p>
                                <input type="text" name="RC" placeholder='Numéro RC' className='p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-third focus:border-transparent outline-none transition-all' />
                            </div>
                            <div className='flex flex-col gap-1'>
                                <p className='text-sm font-medium text-slate-700'>NIF</p>
                                <input type="text" name="Nif" placeholder='Numéro NIF' className='p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-third focus:border-transparent outline-none transition-all' />
                            </div>
                        </div>
                    </div>

                    {/* Bouton de validation */}
                    <div className="p-2 mt-6">
                        <button disabled={isClicked} className='bg-primer hover:bg-slate-800 w-full text-white text-xl p-3 rounded-lg font-semibold shadow-md transition-all duration-300 flex justify-center items-center gap-3 disabled:bg-opacity-50 disabled:cursor-not-allowed'>
                            {isClicked ? (
                                <>
                                    <TbLoader3 className="animate-spin text-2xl" /> Création en cours...
                                </>
                            ) : (
                                "Créer le compte Magasin"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
