"use client"

import { Wilaya } from '@/lib/tools/named'
import { handleInputChange } from '@/lib/tools/tools'
import Link from 'next/link'
import React, { useState } from 'react'
import { FaRegCheckCircle, FaSearch } from 'react-icons/fa'
import ActiveCompte from '../windows/chef_win/active-compte'
import { MdClose, MdOutlineDisabledByDefault } from 'react-icons/md'
import { useSearchLoader } from '../options/useSearchLoader'
import LoadingFirst from '../loading'
import { useRouter } from 'next/navigation'

export default function LivreursList({ users }: { users: Partenaire[] }) {
    const { isLoading, handleSearch } = useSearchLoader(['search', 'wilaya', 'is_active']);
    const [user, setUser] = useState<{ id: number, statue: boolean } | null>(null);
    const router = useRouter();

    const livreurRows = users.map((pre, index) => {
        return (
            <tr key={index} className="bg-white border-b text-black hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 font-semibold text-slate-700">
                    {pre.id}
                </td>
                <td className="px-4 py-4">
                    {pre.user.first_name} {pre.user.last_name}
                </td>
                <td className="px-4 py-4 text-slate-500 font-medium">
                    {pre.user.username}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                    {pre.user.email}
                </td>
                <td className="px-4 py-4 font-medium text-slate-800">
                    {pre.user.phone_number_1}
                </td>
                <td className="px-4 py-4">
                    <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded border border-slate-200">
                        {pre.user.wilaya}
                    </span>
                </td>
                <td className="px-4 py-4 text-sm">
                    {pre.vihucule ? (
                        <div>
                            <span className="font-semibold text-slate-700">{pre.vihucule.marque || ""} {pre.vihucule.modele || ""}</span>
                            <span className="block text-xs text-slate-500">{pre.vihucule.type_vehicule || "Moto"}</span>
                        </div>
                    ) : (
                        <span className="text-slate-400 italic">Aucun</span>
                    )}
                </td>
                <td className="px-4 py-4 text-sm font-mono text-slate-600">
                    {pre.vihucule?.matricule || "Aucun"}
                </td>
                <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-sm rounded-lg border border-blue-100">
                        📦 {pre.user.nbr_commandes ?? 0}
                    </span>
                </td>
                <td className="px-4 py-4">
                    {pre.user.is_active ? (
                        <button onClick={() => setUser({ id: pre.user.id, statue: pre.user.is_active })} className="bg-red-700 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-all shadow-sm">
                            Désactiver <MdOutlineDisabledByDefault size={14} />
                        </button>
                    ) : (
                        <button onClick={() => setUser({ id: pre.user.id, statue: pre.user.is_active })} className="bg-green-700 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-all shadow-sm">
                            Activer <FaRegCheckCircle size={14} />
                        </button>
                    )}
                </td>
            </tr>
        )
    });

    return (
        <div className="py-5 px-5 sm:px-16">
            <div className="flex items-center gap-2 px-5 pb-5 text-xs lg:text-xl">
                <Link href="/dashboard" className="font-semibold text-third">Tableau de bord /</Link>
                <h1 className="font-bold">Livreurs</h1>
            </div>

            <div className="p-5 pb-20 bg-white md:p-10 rounded-xl shadow-lg border border-slate-100">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 mb-8">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-grow sm:flex-grow-0">
                            <FaSearch className="absolute left-3 top-3.5 text-slate-400" />
                            <input onChange={handleInputChange} type="text" name="search" placeholder="Recherche par numéro" className="border border-slate-300 rounded-lg outline-none py-2.5 pl-10 pr-4 w-full sm:w-64 focus:ring-2 focus:ring-third focus:border-transparent transition-all text-sm" />
                        </div>

                        <select name="wilaya" className="border border-slate-300 rounded-lg outline-none py-2.5 px-4 focus:ring-2 focus:ring-third focus:border-transparent transition-all bg-white text-sm">
                            <option value="">Toutes les Wilayas</option>
                            {Wilaya.map(pre => (
                                <option key={pre.id} value={pre.id}>{pre.id} - {pre.name}</option>
                            ))}
                        </select>

                        <div className="inline-flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                            <div className="relative">
                                <input type="radio" id="all" name="is_active" defaultChecked value="" className="peer hidden" />
                                <label htmlFor="all" className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-slate-500 bg-transparent rounded-md cursor-pointer transition-all duration-200 ease-in-out hover:text-slate-900 peer-checked:bg-white peer-checked:text-third peer-checked:shadow-sm">
                                    Tous
                                </label>
                            </div>
                            <div className="relative">
                                <input type="radio" id="valide" name="is_active" value="true" className="peer hidden" />
                                <label htmlFor="valide" className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-slate-500 bg-transparent rounded-md cursor-pointer transition-all duration-200 ease-in-out hover:text-slate-900 peer-checked:bg-green-600 peer-checked:text-white peer-checked:shadow-sm">
                                    Actifs
                                </label>
                            </div>
                            <div className="relative">
                                <input type="radio" id="noValide" name="is_active" value="false" className="peer hidden" />
                                <label htmlFor="noValide" className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-slate-500 bg-transparent rounded-md cursor-pointer transition-all duration-200 ease-in-out hover:text-slate-900 peer-checked:bg-red-600 peer-checked:text-white peer-checked:shadow-sm">
                                    Inactifs
                                </label>
                            </div>
                        </div>

                        <button className="bg-third hover:bg-fourth text-white font-semibold py-2.5 px-6 rounded-lg text-sm shadow-sm transition-all">
                            Recherche
                        </button>
                    </form>

                    <Link href="/dashboard/ajoute_livreur" className="bg-primer hover:bg-slate-800 text-white font-semibold py-2.5 px-6 rounded-lg text-sm shadow-sm transition-all w-full lg:w-auto text-center">
                        + Nouveau Livreur
                    </Link>
                </div>

                <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-slate-100">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">ID</th>
                                <th className="px-4 py-3">Nom et Prénom</th>
                                <th className="px-4 py-3">Username</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Téléphone</th>
                                <th className="px-4 py-3">Wilaya</th>
                                <th className="px-4 py-3">Véhicule</th>
                                <th className="px-4 py-3">Matricule</th>
                                <th className="px-4 py-3">Commande Livrées</th>
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.length > 0 ? (
                                livreurRows
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-4 py-10 text-center text-slate-400 font-medium bg-slate-50">
                                        Aucun chauffeur livreur trouvé
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {user && (
                <div>
                    <button onClick={() => setUser(null)} className="fixed z-50 top-28 right-10 bg-white shadow-md rounded-full text-third p-2 font-bold text-4xl"><MdClose /></button>
                    <ActiveCompte onClose={setUser} user={user} refresh={router.refresh} />
                </div>
            )}

            {isLoading && (
                <LoadingFirst />
            )}
        </div>
    )
}
