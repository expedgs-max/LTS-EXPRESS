import { ModifieProduct } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { handleInputChange } from '@/lib/tools/tools';
import { MdOutlineClose, MdOutlinePhotoCamera } from 'react-icons/md';
import { FaBox, FaTag, FaAlignLeft, FaLayerGroup } from 'react-icons/fa';

export default function ModifyProduct({ pro, option, onsub, partner }: { pro: Produit, option: Catalogue[], onsub: (value: null) => void, partner: Partenaire | null }) {
    const router = useRouter();
    const [variants, setVariants] = useState<number>(pro.prixstar_shop.length || 1);
    const [image, setImage] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isStarshop = partner?.type_compte?.name === "starshop";

    const previewUrl = image
        ? URL.createObjectURL(image)
        : pro.image
        ? `${process.env.NEXT_PUBLIC_IMGS_DOMAIN}${pro.image}`
        : null;

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) setImage(file);
    };

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const loadingToastId = toast.loading('Mise à jour en cours...');
        const formData = new FormData(e.currentTarget);
        const formObject = Object.fromEntries(formData.entries());

        const imgFile = formData.get("image") as File | null;

        const filteredData = Object.fromEntries(
            Object.entries(formObject).filter(([, value]) => value !== "")
        );

        if (!imgFile || imgFile.size === 0) {
            delete filteredData.image;
        }

        if (isStarshop) {
            const quantities: number[] = [];
            const prices: number[] = [];

            for (let i = 0; i < variants; i++) {
                const qty = parseFloat(formData.get(`prix_starshop[${i}][quantity]`) as string);
                const prx = parseFloat(formData.get(`prix_starshop[${i}][prix]`) as string);
                if (!isNaN(qty) && !isNaN(prx)) {
                    quantities.push(qty);
                    prices.push(prx);
                }
            }

            let isValid = true;
            for (let i = 1; i < quantities.length; i++) {
                if (quantities[i] > quantities[i - 1] && prices[i] >= prices[i - 1]) { isValid = false; break; }
                if (quantities[i] < quantities[i - 1] && prices[i] <= prices[i - 1]) { isValid = false; break; }
            }

            if (!isValid) {
                toast.error("Tarification invalide : une quantité plus élevée doit avoir un prix plus bas.", { id: loadingToastId });
                return;
            }
        }

        const res = await ModifieProduct({ id: pro.id, ...filteredData });

        if (res.success) {
            toast.success(res.message, { id: loadingToastId });
            router.refresh();
            onsub(null);
        } else {
            toast.error(res.message, { id: loadingToastId });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={() => onsub(null)} />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <FaBox className="text-sm" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Modifier le produit</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">#{pro.id} — {pro.name}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onsub(null)}
                        className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-colors"
                    >
                        <MdOutlineClose className="text-lg" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleCreate} encType="multipart/form-data" className="p-6 flex flex-col gap-6">

                    {/* Image upload */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <MdOutlinePhotoCamera className="text-base text-slate-400" />
                            Image du produit
                        </label>
                        <div
                            className={`relative group cursor-pointer border-2 border-dashed rounded-xl overflow-hidden transition-colors ${
                                isDragging
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50 dark:bg-slate-800/50'
                            }`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                        >
                            {previewUrl ? (
                                <div className="relative w-full h-48">
                                    <Image
                                        src={previewUrl}
                                        alt="Aperçu produit"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-semibold">
                                        <MdOutlinePhotoCamera className="text-xl" />
                                        Changer l&apos;image
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                    <MdOutlinePhotoCamera className="text-4xl mb-2" />
                                    <p className="text-sm font-medium">Glisser-déposer ou cliquer pour sélectionner</p>
                                    <p className="text-xs mt-1">PNG, JPG, WEBP — max 5 Mo</p>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
                            accept="image/*"
                            name="image"
                            className="hidden"
                        />
                        {image && (
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                ✓ Nouvelle image sélectionnée : {image.name}
                            </p>
                        )}
                    </div>

                    {/* Statut disponibilité */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Disponibilité</p>
                            <p className="text-xs text-slate-400">Actuellement :
                                <span className={`ml-1 font-bold ${pro.disponibilite ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {pro.disponibilite ? 'Disponible' : 'Non disponible'}
                                </span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <input type="radio" id="valide" name="is_available" defaultChecked={pro.disponibilite} value="true" className="peer hidden" />
                                <label htmlFor="valide" className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg cursor-pointer border border-slate-200 dark:border-slate-600 transition-all peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:border-emerald-500 text-slate-500 hover:text-emerald-600">
                                    Disponible
                                </label>
                            </div>
                            <div className="relative">
                                <input type="radio" id="noValide" name="is_available" defaultChecked={!pro.disponibilite} value="false" className="peer hidden" />
                                <label htmlFor="noValide" className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg cursor-pointer border border-slate-200 dark:border-slate-600 transition-all peer-checked:bg-red-500 peer-checked:text-white peer-checked:border-red-500 text-slate-500 hover:text-red-500">
                                    Désactivé
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Catégorie */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <FaLayerGroup className="text-xs text-slate-400" />
                            Catégorie
                        </label>
                        <select name="catalogue_id" className="p-3 w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all">
                            <option value={pro.catalogue ?? ""}>{pro.catalogue ? (option || []).find(o => o.id === pro.catalogue)?.name : 'Sélectionner une catégorie'}</option>
                            {(option || []).map((o, i) => {
                                if (pro.catalogue !== o.id) {
                                    return <option key={i} value={o.id}>{o.name}</option>;
                                }
                            })}
                        </select>
                    </div>

                    {/* Nom produit */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <FaBox className="text-xs text-slate-400" />
                            Nom du produit
                        </label>
                        <input
                            type="text"
                            name="name"
                            defaultValue={pro.name}
                            placeholder="Nom du produit"
                            className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                        />
                    </div>

                    {/* Prix + Classement + Quantité (starshop) */}
                    <div className={`grid grid-cols-1 ${isStarshop ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <FaTag className="text-xs text-slate-400" />
                                Prix (DA)
                            </label>
                            <input
                                onChange={handleInputChange}
                                type="text"
                                name="price"
                                defaultValue={pro.price}
                                placeholder="Ex: 500"
                                className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                🏅 Classement / Ordre (1, 2, 3...)
                            </label>
                            <input
                                type="number"
                                min="1"
                                name="ordre"
                                defaultValue={pro.ordre && pro.ordre < 999 ? pro.ordre : ""}
                                placeholder="Ex: 1, 2, 3..."
                                className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                            />
                        </div>
                        {isStarshop && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Stock actuel :
                                    <span className="ml-1 text-indigo-600 dark:text-indigo-400 font-bold">{pro.quantity_stock} pièces</span>
                                </label>
                                <input
                                    onChange={handleInputChange}
                                    type="text"
                                    name="quantity_stock"
                                    placeholder="Ajouter stock"
                                    className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                                />
                            </div>
                        )}
                    </div>

                    {/* Prix de gros (starshop) */}
                    {isStarshop && (
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/40">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Prix de gros (paliers)</p>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setVariants(v => v > 1 ? v - 1 : v)} className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/30 text-red-600 font-bold flex items-center justify-center hover:bg-red-200 transition-colors">−</button>
                                    <span className="w-7 text-center text-sm font-bold text-slate-700 dark:text-slate-200">{variants}</span>
                                    <button type="button" onClick={() => setVariants(v => v + 1)} className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 font-bold flex items-center justify-center hover:bg-emerald-200 transition-colors">+</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold px-1">
                                <span>Quantité</span>
                                <span>Prix (DA)</span>
                            </div>
                            {Array.from({ length: variants }).map((_, i) => (
                                <div key={i} className="grid grid-cols-2 gap-2">
                                    <input onChange={handleInputChange} type="text" name={`prix_starshop[${i}][quantity]`} defaultValue={pro.prixstar_shop[i]?.quantity || ""} placeholder={`Qté palier ${i + 1}`} className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-slate-800 dark:text-slate-200" />
                                    <input onChange={handleInputChange} type="text" name={`prix_starshop[${i}][prix]`} defaultValue={pro.prixstar_shop[i]?.prix || ""} placeholder={`Prix palier ${i + 1}`} className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-slate-800 dark:text-slate-200" />
                                    {pro.prixstar_shop?.[i]?.id && (
                                        <input readOnly name={`prix_starshop[${i}][id]`} className="hidden" value={pro.prixstar_shop[i].id} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <FaAlignLeft className="text-xs text-slate-400" />
                            Description
                        </label>
                        <textarea
                            name="description"
                            defaultValue={pro.description ?? ""}
                            placeholder="Description du produit..."
                            rows={3}
                            className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => onsub(null)}
                            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all"
                        >
                            Enregistrer les modifications
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
