"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaSearch, FaFilter, FaStore, FaCamera, FaBoxOpen, FaPlus } from 'react-icons/fa';
import { ConfirmationMagasin } from '@/lib/confirmation_action';
import { Wilaya } from '@/lib/tools/named';
import { getImageUrl } from '@/lib/tools/tools';
import MagasinManageModal from '../windows/confirmation_win/magasin_manage_modal';
import MagasinCreateModal from '../windows/confirmation_win/magasin_create_modal';

interface ConfirmationMagasinsProps {
    magasins: ConfirmationMagasin[];
    initialWilaya?: string;
    initialEtat?: string;
    initialSearch?: string;
}

export default function ConfirmationMagasins({
    magasins,
    initialWilaya = "",
    initialEtat = "",
    initialSearch = ""
}: ConfirmationMagasinsProps) {
    const router = useRouter();
    const [selectedMagasin, setSelectedMagasin] = useState<ConfirmationMagasin | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className='py-6 px-4 sm:px-8 w-full'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6'>
                <div>
                    <div className='flex items-center gap-2 text-sm text-slate-500 mb-1'>
                        <Link href="/dashboard" className='hover:text-blue-600 font-medium'>Tableau de bord</Link>
                        <span>/</span>
                        <span className='text-slate-800 font-semibold'>Confirmation</span>
                        <span>/</span>
                        <span>Magasins</span>
                    </div>
                    <h1 className='text-2xl sm:text-3xl font-bold text-slate-900'>
                        État des Magasins
                    </h1>
                </div>

                {/* Header Actions: Create Store Button */}
                <div className='flex items-center gap-3'>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className='bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2'
                    >
                        <FaPlus /> Créer un Magasin
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className='bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6'>
                <form method='GET' className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                    {/* Search */}
                    <div className='relative'>
                        <FaSearch className='absolute left-3.5 top-3.5 text-slate-400' />
                        <input
                            type='text'
                            name='search'
                            defaultValue={initialSearch}
                            placeholder='Nom magasin, contact, gérant...'
                            className='w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500'
                        />
                    </div>

                    {/* Wilaya Filter */}
                    <div>
                        <select
                            name='wilaya'
                            defaultValue={initialWilaya}
                            className='w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white'
                        >
                            <option value="">Toutes les Wilayas</option>
                            {Wilaya.map((w) => (
                                <option key={w.code} value={w.name}>
                                    {String(w.code).padStart(2, '0')} - {w.name} ({w.ar_name})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* État Ouvert / Fermé */}
                    <div>
                        <select
                            name='etat'
                            defaultValue={initialEtat}
                            className='w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white'
                        >
                            <option value="">Tous les États</option>
                            <option value="ouvert">Ouvert (Open)</option>
                            <option value="ferme">Fermé (Closed)</option>
                        </select>
                    </div>

                    {/* Submit Button */}
                    <div className='flex gap-2'>
                        <button
                            type='submit'
                            className='flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2'
                        >
                            <FaFilter /> Filtrer
                        </button>
                        {(initialSearch || initialWilaya || initialEtat) && (
                            <Link
                                href="/dashboard/confirmation/magasins"
                                className='px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors flex items-center justify-center'
                            >
                                Réinitialiser
                            </Link>
                        )}
                    </div>
                </form>
            </div>

            {/* Magasins Grid / Table */}
            <div className='bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden'>
                <div className='overflow-x-auto'>
                    <table className='w-full text-left text-sm text-slate-600'>
                        <thead className='bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100'>
                            <tr>
                                <th className='px-5 py-4'>#ID</th>
                                <th className='px-5 py-4'>Classement</th>
                                <th className='px-5 py-4'>Magasin</th>
                                <th className='px-5 py-4'>Wilaya</th>
                                <th className='px-5 py-4'>Contact / Propriétaire</th>
                                <th className='px-5 py-4'>Catégories</th>
                                <th className='px-5 py-4'>État d&apos;Ouverture</th>
                                <th className='px-5 py-4'>Actif</th>
                                <th className='px-5 py-4 text-right'>Actions</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {magasins.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className='text-center py-12 text-slate-400'>
                                        Aucun magasin trouvé selon ces critères.
                                    </td>
                                </tr>
                            ) : (
                                magasins.map((mag) => (
                                    <tr
                                        key={mag.id}
                                        onClick={() => setSelectedMagasin(mag)}
                                        className='hover:bg-blue-50/50 cursor-pointer transition-colors group'
                                    >
                                        <td className='px-5 py-4 font-bold text-slate-900'>
                                            #{mag.id}
                                        </td>
                                        <td className='px-5 py-4'>
                                            {mag.ordre !== undefined && mag.ordre !== null && mag.ordre < 999 ? (
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                        mag.ordre === 1
                                                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                                            : mag.ordre === 2
                                                            ? 'bg-slate-200 text-slate-800 border border-slate-300'
                                                            : mag.ordre === 3
                                                            ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    }`}
                                                >
                                                    <span>{mag.ordre === 1 ? '🥇' : mag.ordre === 2 ? '🥈' : mag.ordre === 3 ? '🥉' : '🏅'}</span>
                                                    <span>#{mag.ordre}</span>
                                                </span>
                                            ) : (
                                                <span className='inline-flex items-center px-2 py-0.5 rounded text-xs text-slate-400 bg-slate-50 border border-slate-200 font-medium'>
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className='px-5 py-4'>
                                            <div className='flex items-center gap-3'>
                                                <div className='relative w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0 shadow-sm'>
                                                    {mag.image ? (
                                                        <Image
                                                            src={
                                                                getImageUrl(mag.image)
                                                            }
                                                            alt={mag.name}
                                                            fill
                                                            className='object-cover'
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <FaStore className='text-lg text-slate-400' />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className='flex items-center gap-1.5 flex-wrap'>
                                                        <p className='font-bold text-slate-800 group-hover:text-blue-600 transition-colors'>
                                                            {mag.name}
                                                        </p>
                                                        {mag.ordre !== undefined && mag.ordre !== null && mag.ordre < 999 && (
                                                            <span className='px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300'>
                                                                #{mag.ordre}
                                                            </span>
                                                        )}
                                                        {mag.is_livraison_gratuite_active && (
                                                            <span className='px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1'>
                                                                <span>🎁</span>
                                                                <span>Gratuit</span>
                                                            </span>
                                                        )}
                                                        {Boolean(mag.pourcentage_remise && mag.pourcentage_remise > 0) && (
                                                            <span className='px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300'>
                                                                -{mag.pourcentage_remise}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className='text-xs text-slate-400'>{mag.address || 'Adresse non spécifiée'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className='px-5 py-4'>
                                            <span className='px-2.5 py-1 bg-slate-100 text-slate-700 font-medium rounded-lg text-xs'>
                                                {mag.wilaya || 'N/A'}
                                            </span>
                                        </td>
                                        <td className='px-5 py-4'>
                                            <p className='font-medium text-slate-800'>{mag.owner?.first_name || mag.owner?.username || 'N/A'}</p>
                                            <p className='text-xs text-slate-400'>{mag.contact || mag.owner?.phone || 'N/A'}</p>
                                        </td>
                                        <td className='px-5 py-4'>
                                            <div className='flex flex-wrap gap-1'>
                                                {mag.categories && mag.categories.length > 0 ? (
                                                    mag.categories.map((c, i) => (
                                                        <span key={i} className='px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md'>
                                                            {c}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className='text-xs text-slate-400'>Aucune</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className='px-5 py-4'>
                                            {mag.EtatOuverture ? (
                                                <span className='px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 flex items-center gap-1.5 w-fit'>
                                                    <span className='w-2 h-2 rounded-full bg-green-500 animate-pulse' />
                                                    Ouvert
                                                </span>
                                            ) : (
                                                <span className='px-3 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-700 flex items-center gap-1.5 w-fit'>
                                                    <span className='w-2 h-2 rounded-full bg-rose-500' />
                                                    Fermé
                                                </span>
                                            )}
                                        </td>
                                        <td className='px-5 py-4'>
                                            {mag.is_active ? (
                                                <span className='text-xs text-green-600 font-medium'>Actif</span>
                                            ) : (
                                                <span className='text-xs text-slate-400 font-medium'>Inactif</span>
                                            )}
                                        </td>
                                        <td className='px-5 py-4 text-right'>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedMagasin(mag);
                                                }}
                                                className='py-1.5 px-3 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 ml-auto'
                                            >
                                                <FaCamera className='text-[10px]' />
                                                <FaBoxOpen className='text-[10px]' />
                                                <span>Gérer</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Magasin Profile, Catalogues & Products Dialog */}
            {selectedMagasin && (
                <MagasinManageModal
                    magasin={selectedMagasin}
                    onClose={() => setSelectedMagasin(null)}
                    onMagasinUpdated={() => {
                        router.refresh();
                    }}
                />
            )}

            {/* Quick Magasin Creation Modal */}
            {isCreateModalOpen && (
                <MagasinCreateModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={() => {
                        router.refresh();
                    }}
                    initialWilaya={initialWilaya}
                />
            )}
        </div>
    );
}

