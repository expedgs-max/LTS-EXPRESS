"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
    FaStore,
    FaCamera,
    FaImage,
    FaPlus,
    FaTrash,
    FaTags,
    FaBoxOpen,
    FaCheckCircle,
    FaTimesCircle,
    FaSearch,
    FaSave,
    FaTimes,
    FaSpinner,
    FaPhoneAlt,
    FaMapMarkerAlt,
    FaUser,
    FaInfoCircle,
    FaCheck,
    FaPen,
    FaTruck,
    FaPercentage,
    FaCalendarAlt
} from "react-icons/fa";
import {
    ConfirmationMagasin,
    StoreProduct,
    CatalogueItem,
    getStoreProducts,
    uploadStorePhotos,
    updateConfirmationMagasin,
    getAllCatalogues,
    createCatalogue,
    addCatalogueToStore,
    removeCatalogueFromStore,
    createStoreProduct,
    deleteStoreProduct,
    toggleStoreProductAvailability,
    updateStoreProduct
} from "@/lib/confirmation_action";
import { Wilaya } from "@/lib/tools/named";
import { getImageUrl } from "@/lib/tools/tools";
import toast from "react-hot-toast";

interface MagasinManageModalProps {
    magasin: ConfirmationMagasin;
    onClose: () => void;
    onMagasinUpdated?: () => void;
}

export default function MagasinManageModal({
    magasin,
    onClose,
    onMagasinUpdated
}: MagasinManageModalProps) {
    const [activeTab, setActiveTab] = useState<"info" | "photos" | "catalogues" | "products" | "livraison">("info");

    // Store Info States
    const [storeName, setStoreName] = useState(magasin.name || "");
    const [storeContact, setStoreContact] = useState(magasin.contact || magasin.owner?.phone || "");
    const [storeAddress, setStoreAddress] = useState(magasin.address || "");
    const [storeWilaya, setStoreWilaya] = useState(magasin.wilaya || "");
    const [storeDesc, setStoreDesc] = useState(magasin.descprition || magasin.description || "");
    const [storeEtatOuverture, setStoreEtatOuverture] = useState(Boolean(magasin.EtatOuverture));
    const [storeIsActive, setStoreIsActive] = useState(Boolean(magasin.is_active));
    const [ownerFirstName, setOwnerFirstName] = useState(magasin.owner?.first_name || "");
    const [ownerLastName, setOwnerLastName] = useState(magasin.owner?.last_name || "");
    const [ownerPhone, setOwnerPhone] = useState(magasin.owner?.phone || "");
    const [storeOrdre, setStoreOrdre] = useState<string>(
        magasin.ordre !== undefined && magasin.ordre !== null && magasin.ordre < 999 ? String(magasin.ordre) : ""
    );
    const [storeLivraisonGratuite, setStoreLivraisonGratuite] = useState(Boolean(magasin.livraison_gratuite));
    const [storeDateDebutLivraison, setStoreDateDebutLivraison] = useState(
        magasin.date_debut_livraison_gratuite ? magasin.date_debut_livraison_gratuite.substring(0, 10) : ""
    );
    const [storeDateFinLivraison, setStoreDateFinLivraison] = useState(
        magasin.date_fin_livraison_gratuite ? magasin.date_fin_livraison_gratuite.substring(0, 10) : ""
    );
    const [storeTarifLivraison, setStoreTarifLivraison] = useState(
        magasin.tarif_livraison !== undefined && magasin.tarif_livraison !== null ? String(magasin.tarif_livraison) : ""
    );
    const [storePourcentageCommission, setStorePourcentageCommission] = useState(
        magasin.pourcentage_commission !== undefined && magasin.pourcentage_commission !== null ? String(magasin.pourcentage_commission) : "0"
    );
    const [storePourcentageRemise, setStorePourcentageRemise] = useState(
        magasin.pourcentage_remise !== undefined && magasin.pourcentage_remise !== null ? String(magasin.pourcentage_remise) : "0"
    );
    const [isSavingInfo, setIsSavingInfo] = useState(false);


    // Active status calculation for free delivery
    const isFreeDeliveryCurrentlyActive = useMemo(() => {
        if (!storeLivraisonGratuite) return false;
        const today = new Date().toISOString().substring(0, 10);
        if (storeDateDebutLivraison && today < storeDateDebutLivraison) return false;
        if (storeDateFinLivraison && today > storeDateFinLivraison) return false;
        return true;
    }, [storeLivraisonGratuite, storeDateDebutLivraison, storeDateFinLivraison]);

    // Photo States
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [profilePreview, setProfilePreview] = useState<string | null>(
        magasin.image ? getImageUrl(magasin.image) : null
    );
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [bgPreview, setBgPreview] = useState<string | null>(
        magasin.image_background ? getImageUrl(magasin.image_background) : null
    );
    const [isSavingPhotos, setIsSavingPhotos] = useState(false);

    // Catalogues States
    const [catalogues, setCatalogues] = useState<CatalogueItem[]>([]);
    const [storeCatalogues, setStoreCatalogues] = useState<{ id: number; name: string }[]>(
        magasin.catalogues || magasin.categories.map((c, i) => ({ id: i + 1, name: c }))
    );
    const [selectedCatId, setSelectedCatId] = useState<string>("");
    const [newCatName, setNewCatName] = useState("");
    const [newCatDesc, setNewCatDesc] = useState("");
    const [isAddingCatalogue, setIsAddingCatalogue] = useState(false);

    // Products States
    const [products, setProducts] = useState<StoreProduct[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [productSearch, setProductSearch] = useState("");
    const [productCatFilter, setProductCatFilter] = useState("");
    const [showAddProductForm, setShowAddProductForm] = useState(false);

    // New Product Form State
    const [newProdName, setNewProdName] = useState("");
    const [newProdPrice, setNewProdPrice] = useState("");
    const [newProdOrdre, setNewProdOrdre] = useState("");
    const [newProdCatId, setNewProdCatId] = useState("");
    const [newProdDesc, setNewProdDesc] = useState("");
    const [newProdImage, setNewProdImage] = useState<File | null>(null);
    const [newProdImagePreview, setNewProdImagePreview] = useState<string | null>(null);
    const [isSavingProduct, setIsSavingProduct] = useState(false);

    // Edit Product States
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [editProdName, setEditProdName] = useState("");
    const [editProdPrice, setEditProdPrice] = useState("");
    const [editProdOrdre, setEditProdOrdre] = useState("");
    const [editProdDesc, setEditProdDesc] = useState("");
    const [editProdCatId, setEditProdCatId] = useState("");
    const [editProdImage, setEditProdImage] = useState<File | null>(null);
    const [editProdImagePreview, setEditProdImagePreview] = useState<string | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Fetch Catalogues
    const fetchCatalogues = useCallback(async () => {
        const data = await getAllCatalogues();
        if (data) setCatalogues(data);
    }, []);

    // Fetch Products for this store
    const fetchProducts = useCallback(async () => {
        setIsLoadingProducts(true);
        const res = await getStoreProducts(magasin.id, {
            name: productSearch,
            catalogue: productCatFilter
        });
        if (res) {
            setProducts(res.result);
        }
        setIsLoadingProducts(false);
    }, [magasin.id, productSearch, productCatFilter]);

    useEffect(() => {
        fetchCatalogues();
        fetchProducts();
    }, [fetchCatalogues, fetchProducts]);

    // Save Store Information
    const handleSaveStoreInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeName.trim()) {
            toast.error("Le nom du magasin est requis");
            return;
        }

        const parsedOrdre = storeOrdre.trim() !== "" ? parseInt(storeOrdre.trim()) : 999;
        const parsedTarif = storeTarifLivraison.trim() !== "" ? parseFloat(storeTarifLivraison.trim()) : null;
        const parsedCommission = storePourcentageCommission.trim() !== "" ? parseFloat(storePourcentageCommission.trim()) : 0;
        const parsedRemise = storePourcentageRemise.trim() !== "" ? parseFloat(storePourcentageRemise.trim()) : 0;

        setIsSavingInfo(true);
        const res = await updateConfirmationMagasin({
            magasin_id: magasin.id,
            name: storeName.trim(),
            contact: storeContact.trim(),
            address: storeAddress.trim(),
            wilaya: storeWilaya.trim(),
            descprition: storeDesc.trim(),
            EtatOuverture: storeEtatOuverture,
            is_active: storeIsActive,
            ordre: isNaN(parsedOrdre) ? 999 : parsedOrdre,
            owner_first_name: ownerFirstName.trim(),
            owner_last_name: ownerLastName.trim(),
            owner_phone: ownerPhone.trim(),
            livraison_gratuite: storeLivraisonGratuite,
            date_debut_livraison_gratuite: storeDateDebutLivraison || null,
            date_fin_livraison_gratuite: storeDateFinLivraison || null,
            tarif_livraison: parsedTarif !== null && !isNaN(parsedTarif) ? parsedTarif : null,
            pourcentage_commission: isNaN(parsedCommission) ? 0 : parsedCommission,
            pourcentage_remise: isNaN(parsedRemise) ? 0 : parsedRemise,
        });
        setIsSavingInfo(false);

        if (res.success) {
            magasin.name = storeName.trim();
            magasin.contact = storeContact.trim();
            magasin.address = storeAddress.trim();
            magasin.wilaya = storeWilaya.trim();
            magasin.descprition = storeDesc.trim();
            magasin.description = storeDesc.trim();
            magasin.EtatOuverture = storeEtatOuverture;
            magasin.is_active = storeIsActive;
            magasin.ordre = isNaN(parsedOrdre) ? 999 : parsedOrdre;
            magasin.livraison_gratuite = storeLivraisonGratuite;
            magasin.date_debut_livraison_gratuite = storeDateDebutLivraison || null;
            magasin.date_fin_livraison_gratuite = storeDateFinLivraison || null;
            magasin.tarif_livraison = parsedTarif !== null && !isNaN(parsedTarif) ? parsedTarif : null;
            magasin.pourcentage_commission = isNaN(parsedCommission) ? 0 : parsedCommission;
            magasin.pourcentage_remise = isNaN(parsedRemise) ? 0 : parsedRemise;
            magasin.is_livraison_gratuite_active = isFreeDeliveryCurrentlyActive;
            if (magasin.owner) {
                magasin.owner.first_name = ownerFirstName.trim();
                magasin.owner.last_name = ownerLastName.trim();
                magasin.owner.phone = ownerPhone.trim();
            }
            if (onMagasinUpdated) onMagasinUpdated();
        }
    };


    // Handle Profile Image Selection
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileFile(file);
            setProfilePreview(URL.createObjectURL(file));
        }
    };

    // Handle Background Image Selection
    const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setBgFile(file);
            setBgPreview(URL.createObjectURL(file));
        }
    };

    // Save Store Photos
    const handleSavePhotos = async () => {
        if (!profileFile && !bgFile) {
            toast.error("Veuillez sélectionner au moins une image à enregistrer");
            return;
        }

        setIsSavingPhotos(true);
        const res = await uploadStorePhotos(magasin.id, profileFile, bgFile);
        setIsSavingPhotos(false);

        if (res.success) {
            if (res.image) setProfilePreview(res.image);
            if (res.image_background) setBgPreview(res.image_background);
            setProfileFile(null);
            setBgFile(null);
            if (onMagasinUpdated) onMagasinUpdated();
        }
    };

    // Handle Add Existing Catalogue to Store
    const handleAddExistingCatalogue = async () => {
        if (!selectedCatId) return;
        const catIdNum = parseInt(selectedCatId, 10);
        const catObj = catalogues.find((c) => c.id === catIdNum);
        if (!catObj) return;

        const res = await addCatalogueToStore(magasin.id, catIdNum);
        if (res.success) {
            setStoreCatalogues((prev) => [...prev.filter((c) => c.id !== catIdNum), { id: catIdNum, name: catObj.name }]);
            setSelectedCatId("");
            if (onMagasinUpdated) onMagasinUpdated();
        }
    };

    // Handle Create & Assign New Catalogue
    const handleCreateCatalogue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim()) {
            toast.error("Le nom du catalogue est requis");
            return;
        }

        setIsAddingCatalogue(true);
        const res = await createCatalogue(newCatName.trim(), newCatDesc.trim(), magasin.id);
        setIsAddingCatalogue(false);

        if (res.success && res.catalogue) {
            setStoreCatalogues((prev) => [...prev, { id: res.catalogue!.id, name: res.catalogue!.name }]);
            setCatalogues((prev) => [...prev, res.catalogue!]);
            setNewCatName("");
            setNewCatDesc("");
            if (onMagasinUpdated) onMagasinUpdated();
        }
    };

    // Handle Remove Catalogue from Store
    const handleRemoveCatalogue = async (catId: number) => {
        const res = await removeCatalogueFromStore(magasin.id, catId);
        if (res.success) {
            setStoreCatalogues((prev) => prev.filter((c) => c.id !== catId));
            if (onMagasinUpdated) onMagasinUpdated();
        }
    };

    // Handle New Product Image
    const handleNewProdImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewProdImage(file);
            setNewProdImagePreview(URL.createObjectURL(file));
        }
    };

    // Handle Add Product Submit
    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newProdName.trim()) {
            toast.error("Le nom du produit est requis");
            return;
        }
        if (!newProdPrice || isNaN(Number(newProdPrice))) {
            toast.error("Le prix du produit doit être valide");
            return;
        }
        if (!newProdCatId) {
            toast.error("Veuillez sélectionner un catalogue pour le produit");
            return;
        }
        if (!newProdImage) {
            toast.error("Une photo est requise pour le produit");
            return;
        }

        setIsSavingProduct(true);
        const res = await createStoreProduct({
            magasin_id: magasin.id,
            name: newProdName.trim(),
            price: Number(newProdPrice),
            description: newProdDesc.trim(),
            catalogue_id: newProdCatId,
            image: newProdImage,
            ordre: newProdOrdre ? Number(newProdOrdre) : undefined
        });
        setIsSavingProduct(false);

        if (res.success) {
            setShowAddProductForm(false);
            setNewProdName("");
            setNewProdPrice("");
            setNewProdOrdre("");
            setNewProdDesc("");
            setNewProdCatId("");
            setNewProdImage(null);
            setNewProdImagePreview(null);
            fetchProducts();
            if (onMagasinUpdated) onMagasinUpdated();
        }
    };

    // Handle Toggle Availability
    const handleToggleAvailability = async (productId: number, currentStatus: boolean) => {
        const ok = await toggleStoreProductAvailability(productId, !currentStatus);
        if (ok) {
            setProducts((prev) =>
                prev.map((p) => (p.id === productId ? { ...p, disponibilite: !currentStatus } : p))
            );
        }
    };

    // Handle Delete Product
    const handleDeleteProduct = async (productId: number) => {
        if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;
        const ok = await deleteStoreProduct(productId);
        if (ok) {
            setProducts((prev) => prev.filter((p) => p.id !== productId));
        }
    };

    // Open edit form for a product
    const handleStartEdit = (p: StoreProduct) => {
        setEditingProductId(p.id);
        setEditProdName(p.name);
        setEditProdPrice(String(p.price));
        setEditProdOrdre(p.ordre && p.ordre < 999 ? String(p.ordre) : "");
        setEditProdDesc(p.description || "");
        setEditProdCatId(p.catalogue != null ? String(p.catalogue) : (p.catalogue_id != null ? String(p.catalogue_id) : ""));
        setEditProdImage(null);
        const img = p.image ? getImageUrl(p.image) : null;
        setEditProdImagePreview(img);
        setShowAddProductForm(false);
    };

    // Submit product edit
    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProductId) return;
        setIsSavingEdit(true);
        const res = await updateStoreProduct({
            id: editingProductId,
            name: editProdName.trim(),
            price: editProdPrice,
            description: editProdDesc.trim(),
            catalogue_id: editProdCatId || undefined,
            image: editProdImage || undefined,
            ordre: editProdOrdre !== "" ? Number(editProdOrdre) : 999
        });
        setIsSavingEdit(false);
        if (res.success) {
            fetchProducts();
            setEditingProductId(null);
            if (onMagasinUpdated) onMagasinUpdated();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
                {/* Modal Top Bar */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                        title="Fermer"
                    >
                        <FaTimes className="text-lg" />
                    </button>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="relative w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                            {profilePreview ? (
                                <Image
                                    src={profilePreview}
                                    alt={storeName}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <FaStore className="text-2xl text-slate-300" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className="text-xl sm:text-2xl font-bold truncate">{storeName}</h2>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 border border-white/15 text-slate-200">
                                    #{magasin.id}
                                </span>
                                {storeOrdre && parseInt(storeOrdre) < 999 && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/25 text-amber-300 border border-amber-400/40 flex items-center gap-1 shadow-xs">
                                        <span>{parseInt(storeOrdre) === 1 ? '🥇' : parseInt(storeOrdre) === 2 ? '🥈' : parseInt(storeOrdre) === 3 ? '🥉' : '🏅'}</span>
                                        <span>#{storeOrdre}</span>
                                    </span>
                                )}
                                {storeEtatOuverture ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Ouvert
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                        Fermé
                                    </span>
                                )}
                                {storeIsActive ? (
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                        Actif
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                                        Inactif
                                    </span>
                                )}
                                {isFreeDeliveryCurrentlyActive && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 flex items-center gap-1 shadow-xs">
                                        <span>🎁</span>
                                        <span>Livraison Gratuite</span>
                                    </span>
                                )}
                                {parseFloat(storePourcentageRemise) > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/25 text-purple-300 border border-purple-400/40 flex items-center gap-1">
                                        <span>🏷️</span>
                                        <span>-{storePourcentageRemise}% Remise</span>
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-300 mt-2 flex-wrap">
                                {/* Prominent Phone Number Badge */}
                                <span className="flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-xl font-bold text-xs shadow-sm">
                                    <FaPhoneAlt className="text-blue-400 text-xs" />
                                    <span>{storeContact || magasin.contact || magasin.owner?.phone || "Numéro non renseigné"}</span>
                                </span>

                                {storeWilaya && (
                                    <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-xl text-slate-200">
                                        <FaMapMarkerAlt className="text-rose-400" /> {storeWilaya}
                                    </span>
                                )}

                                {(ownerFirstName || magasin.owner) && (
                                    <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-xl text-slate-200">
                                        <FaUser className="text-emerald-400" /> {ownerFirstName || magasin.owner?.first_name || magasin.owner?.username}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 mt-6 border-b border-white/10 flex-wrap">
                        <button
                            onClick={() => setActiveTab("info")}
                            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${activeTab === "info"
                                    ? "border-blue-500 text-blue-400"
                                    : "border-transparent text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            <FaStore /> Informations
                        </button>
                        <button
                            onClick={() => setActiveTab("photos")}
                            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${activeTab === "photos"
                                    ? "border-blue-500 text-blue-400"
                                    : "border-transparent text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            <FaCamera /> Photos
                        </button>
                        <button
                            onClick={() => setActiveTab("catalogues")}
                            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${activeTab === "catalogues"
                                    ? "border-blue-500 text-blue-400"
                                    : "border-transparent text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            <FaTags /> Catalogues ({storeCatalogues.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("products")}
                            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${activeTab === "products"
                                    ? "border-blue-500 text-blue-400"
                                    : "border-transparent text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            <FaBoxOpen /> Produits ({products.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("livraison")}
                            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${activeTab === "livraison"
                                    ? "border-emerald-500 text-emerald-400"
                                    : "border-transparent text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            <FaTruck /> Livraison & Pourcentages
                            {isFreeDeliveryCurrentlyActive && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-white animate-pulse">
                                    Gratuit
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Modal Body Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                    {/* TAB 1: INFORMATIONS DU MAGASIN */}
                    {activeTab === "info" && (
                        <div className="space-y-6 animate-fadeIn">

                            {/* FORMULAIRE DE MODIFICATION DES INFORMATIONS */}
                            <form onSubmit={handleSaveStoreInfo} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-5">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                    <div className="flex items-center gap-2 font-bold text-slate-800 text-base">
                                        <FaStore className="text-blue-600 text-lg" />
                                        <h3>Modifier les Informations du Magasin</h3>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        ID #{magasin.id}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Nom du magasin */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Nom du Magasin / Restaurant <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <FaStore className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                            <input
                                                type="text"
                                                value={storeName}
                                                onChange={(e) => setStoreName(e.target.value)}
                                                placeholder="Ex: Pizzeria Napoli"
                                                required
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Numéro de contact / Téléphone */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Numéro de Téléphone (Contact) <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <FaPhoneAlt className="absolute left-3.5 top-3.5 text-blue-500 text-sm" />
                                            <input
                                                type="tel"
                                                value={storeContact}
                                                onChange={(e) => setStoreContact(e.target.value)}
                                                placeholder="Ex: 0550123456"
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Wilaya */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Wilaya
                                        </label>
                                        <div className="relative">
                                            <FaMapMarkerAlt className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                            <select
                                                value={storeWilaya}
                                                onChange={(e) => setStoreWilaya(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Sélectionner une Wilaya</option>
                                                {Wilaya.map((w) => (
                                                    <option key={w.code} value={w.name}>
                                                        {String(w.code).padStart(2, "0")} - {w.name} ({w.ar_name})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Adresse */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Adresse du Magasin
                                        </label>
                                        <div className="relative">
                                            <FaMapMarkerAlt className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                            <input
                                                type="text"
                                                value={storeAddress}
                                                onChange={(e) => setStoreAddress(e.target.value)}
                                                placeholder="Ex: Rue 1er Novembre, Centre-ville"
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* État d'ouverture et Statut d'activité */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            État d&apos;Ouverture
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setStoreEtatOuverture(true)}
                                                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${storeEtatOuverture
                                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                Ouvert
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStoreEtatOuverture(false)}
                                                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${!storeEtatOuverture
                                                        ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                                                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                                                    }`}
                                            >
                                                Fermé
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Statut d&apos;Activité
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setStoreIsActive(true)}
                                                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${storeIsActive
                                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <FaCheckCircle className="text-xs" /> Actif
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStoreIsActive(false)}
                                                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${!storeIsActive
                                                        ? "bg-slate-700 text-white border-slate-700 shadow-sm"
                                                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <FaTimesCircle className="text-xs" /> Inactif
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Ordre de classement du magasin */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <span className="text-amber-500">🏅</span>
                                            <span>Ordre de Classement (1, 2, 3...)</span>
                                        </span>
                                        <span className="text-[11px] font-normal text-slate-400">
                                            (1 = affiché en premier, prioritaire)
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-2.5 text-amber-500 font-bold text-sm">#</span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={storeOrdre}
                                            onChange={(e) => setStoreOrdre(e.target.value)}
                                            placeholder="Ex: 1 (Premier), 2, 3... (999 par défaut)"
                                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Détermine la position d&apos;affichage de ce magasin dans l&apos;application cliente et sur la plateforme.
                                    </span>
                                </div>

                                {/* Description / Spécialité */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Description / Spécialité
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={storeDesc}
                                        onChange={(e) => setStoreDesc(e.target.value)}
                                        placeholder="Ex: Fast food & Pizzeria artisanale, livraison rapide..."
                                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Infos Propriétaire */}
                                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        <FaUser className="text-emerald-600" />
                                        <span>Informations du Gérant / Propriétaire</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                                Prénom
                                            </label>
                                            <input
                                                type="text"
                                                value={ownerFirstName}
                                                onChange={(e) => setOwnerFirstName(e.target.value)}
                                                placeholder="Prénom"
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                                Nom
                                            </label>
                                            <input
                                                type="text"
                                                value={ownerLastName}
                                                onChange={(e) => setOwnerLastName(e.target.value)}
                                                placeholder="Nom"
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                                Tél. Gérant
                                            </label>
                                            <input
                                                type="tel"
                                                value={ownerPhone}
                                                onChange={(e) => setOwnerPhone(e.target.value)}
                                                placeholder="Tél. gérant"
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </div>



                                {/* Save Store Info Button */}
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSavingInfo}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm py-2.5 px-6 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
                                    >
                                        {isSavingInfo ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                        Enregistrer les informations du magasin
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB 2: PHOTOS DU MAGASIN (LOGO & COUVERTURE) */}
                    {activeTab === "photos" && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Header Info */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl text-white shadow-md flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shadow-inner">
                                        📷
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Photos & Identité Visuelle</h3>
                                        <p className="text-xs text-blue-100">
                                            Téléchargez et personnalisez le logo ainsi que la bannière de couverture du magasin.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* PHOTOS DU MAGASIN */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Photo de Profil / Logo */}
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 font-semibold text-slate-800">
                                            <FaCamera className="text-blue-600" />
                                            <h3>Photo de Profil / Logo</h3>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-4">
                                            Image carrée affichée comme avatar du magasin (recommandé 500x500px, max 5 Mo).
                                        </p>

                                        <div className="flex items-center justify-center p-4 bg-white rounded-xl border border-dashed border-slate-300">
                                            {profilePreview ? (
                                                <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-md border-2 border-white">
                                                    <Image
                                                        src={profilePreview}
                                                        alt="Logo aperçu"
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-32 h-32 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                                                    <FaStore className="text-3xl mb-1" />
                                                    <span className="text-xs">Aucune image</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label
                                            htmlFor="profile-file-input"
                                            className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl border border-slate-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                                        >
                                            <FaCamera /> Choisir une nouvelle photo de profil
                                        </label>
                                        <input
                                            id="profile-file-input"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleProfileChange}
                                            className="hidden"
                                        />
                                        {profileFile && (
                                            <p className="text-xs text-emerald-600 font-medium mt-1.5 truncate">
                                                Fichier sélectionné : {profileFile.name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Photo de Couverture / Bannière */}
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 font-semibold text-slate-800">
                                            <FaImage className="text-emerald-600" />
                                            <h3>Photo de Couverture / Bannière</h3>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-4">
                                            Bannière d&apos;en-tête affichée en haut de la page du magasin (max 5 Mo).
                                        </p>

                                        <div className="flex items-center justify-center p-4 bg-white rounded-xl border border-dashed border-slate-300">
                                            {bgPreview ? (
                                                <div className="relative w-full h-32 rounded-2xl overflow-hidden shadow-md border-2 border-white">
                                                    <Image
                                                        src={bgPreview}
                                                        alt="Bannière aperçu"
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-full h-32 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                                                    <FaImage className="text-3xl mb-1" />
                                                    <span className="text-xs">Aucune bannière</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label
                                            htmlFor="bg-file-input"
                                            className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl border border-slate-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                                        >
                                            <FaImage /> Choisir une bannière de couverture
                                        </label>
                                        <input
                                            id="bg-file-input"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleBgChange}
                                            className="hidden"
                                        />
                                        {bgFile && (
                                            <p className="text-xs text-emerald-600 font-medium mt-1.5 truncate">
                                                Fichier sélectionné : {bgFile.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Save Button for Photos */}
                            {(profileFile || bgFile) && (
                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={handleSavePhotos}
                                        disabled={isSavingPhotos}
                                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm py-2.5 px-6 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
                                    >
                                        {isSavingPhotos ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                        Enregistrer les nouvelles photos
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: CATALOGUES & CATÉGORIES */}
                    {activeTab === "catalogues" && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Current Store Catalogues */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                                    Catalogues associés au magasin
                                </h3>

                                {storeCatalogues.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic">
                                        Aucun catalogue associé pour le moment.
                                    </p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {storeCatalogues.map((cat) => (
                                            <span
                                                key={cat.id}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-800 text-sm font-semibold rounded-xl border border-blue-200 flex items-center gap-2 shadow-sm"
                                            >
                                                {cat.name}
                                                <button
                                                    onClick={() => handleRemoveCatalogue(cat.id)}
                                                    className="w-5 h-5 rounded-full bg-blue-200 hover:bg-rose-200 text-blue-700 hover:text-rose-700 flex items-center justify-center text-xs transition-colors"
                                                    title="Dissocier ce catalogue"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Associer un catalogue existant */}
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <FaPlus className="text-blue-600" /> Associer un catalogue existant
                                    </h4>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedCatId}
                                            onChange={(e) => setSelectedCatId(e.target.value)}
                                            className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                        >
                                            <option value="">Sélectionner un catalogue global...</option>
                                            {catalogues
                                                .filter((c) => !storeCatalogues.some((sc) => sc.id === c.id))
                                                .map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                        </select>
                                        <button
                                            onClick={handleAddExistingCatalogue}
                                            disabled={!selectedCatId}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0 shadow-sm"
                                        >
                                            Associer
                                        </button>
                                    </div>
                                </div>

                                {/* Créer un nouveau catalogue personnalisé */}
                                <form
                                    onSubmit={handleCreateCatalogue}
                                    className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3"
                                >
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <FaTags className="text-emerald-600" /> Créer un nouveau catalogue
                                    </h4>
                                    <input
                                        type="text"
                                        value={newCatName}
                                        onChange={(e) => setNewCatName(e.target.value)}
                                        placeholder="Nom du catalogue (ex: Burgers, Desserts...)"
                                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                    />
                                    <input
                                        type="text"
                                        value={newCatDesc}
                                        onChange={(e) => setNewCatDesc(e.target.value)}
                                        placeholder="Description (optionnel)"
                                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isAddingCatalogue || !newCatName.trim()}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                                    >
                                        {isAddingCatalogue ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                                        Créer et associer au magasin
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: PRODUITS / ARTICLES */}
                    {activeTab === "products" && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Products Header Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                                <div className="flex gap-2 flex-1 w-full sm:w-auto">
                                    <div className="relative flex-1">
                                        <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                                        <input
                                            type="text"
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            placeholder="Rechercher un produit..."
                                            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <select
                                        value={productCatFilter}
                                        onChange={(e) => setProductCatFilter(e.target.value)}
                                        className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                                    >
                                        <option value="">Tous les catalogues</option>
                                        {storeCatalogues.map((c) => (
                                            <option key={c.id} value={c.name}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={() => setShowAddProductForm(!showAddProductForm)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2 px-4 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-colors shrink-0"
                                >
                                    <FaPlus /> {showAddProductForm ? "Fermer formulaire" : "Ajouter un produit"}
                                </button>
                            </div>

                            {/* Add Product Inline Form */}
                            {showAddProductForm && (
                                <form
                                    onSubmit={handleCreateProduct}
                                    className="bg-blue-50/50 p-5 rounded-2xl border border-blue-200 space-y-4 animate-fadeIn"
                                >
                                    <h4 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                                        <FaBoxOpen className="text-blue-600" /> Nouveau Produit pour {storeName}
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Nom du produit <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={newProdName}
                                                onChange={(e) => setNewProdName(e.target.value)}
                                                placeholder="Ex: Pizza Margherita"
                                                required
                                                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Prix (DZD) <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={newProdPrice}
                                                onChange={(e) => setNewProdPrice(e.target.value)}
                                                placeholder="Ex: 850"
                                                required
                                                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Classement / Ordre
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={newProdOrdre}
                                                onChange={(e) => setNewProdOrdre(e.target.value)}
                                                placeholder="Ex: 1, 2, 3..."
                                                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Catalogue / Catégorie <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={newProdCatId}
                                                onChange={(e) => setNewProdCatId(e.target.value)}
                                                required
                                                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                            >
                                                <option value="">Sélectionner un catalogue...</option>
                                                {storeCatalogues.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Description du produit
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={newProdDesc}
                                            onChange={(e) => setNewProdDesc(e.target.value)}
                                            placeholder="Ingrédients, portion, détails..."
                                            className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Photo du produit <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <label
                                                htmlFor="prod-image-input"
                                                className="py-2 px-4 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                                            >
                                                <FaCamera /> Sélectionner l&apos;image
                                            </label>
                                            <input
                                                id="prod-image-input"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleNewProdImageChange}
                                                className="hidden"
                                            />
                                            {newProdImage && (
                                                <span className="text-xs text-emerald-600 font-medium truncate">
                                                    {newProdImage.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddProductForm(false)}
                                            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSavingProduct}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm py-2 px-5 rounded-xl shadow-md transition-colors flex items-center gap-2"
                                        >
                                            {isSavingProduct ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                                            Ajouter le produit
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Products Grid List */}
                            {isLoadingProducts ? (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <FaSpinner className="animate-spin text-2xl text-blue-500" />
                                    <span className="text-xs">Chargement des produits...</span>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <FaBoxOpen className="text-3xl mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm font-medium">Aucun produit trouvé pour ce magasin.</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Cliquez sur &quot;Ajouter un produit&quot; ci-dessus pour en créer un.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {products.map((p) => {
                                        const prodImg = p.image ? getImageUrl(p.image) : null;

                                        return (
                                            <div
                                                key={p.id}
                                                className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${editingProductId === p.id
                                                        ? "border-indigo-400 ring-2 ring-indigo-200"
                                                        : "border-slate-200"
                                                    }`}
                                            >
                                                <div className="flex gap-3">
                                                    {/* Product image — click to change when editing */}
                                                    <div
                                                        className="relative w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 cursor-pointer group"
                                                        onClick={() => {
                                                            if (editingProductId === p.id) {
                                                                document.getElementById(`edit-img-${p.id}`)?.click();
                                                            }
                                                        }}
                                                    >
                                                        {(editingProductId === p.id && editProdImagePreview)
                                                            ? <Image src={editProdImagePreview} alt={p.name} fill className="object-cover" unoptimized />
                                                            : prodImg
                                                                ? <Image src={prodImg} alt={p.name} fill className="object-cover" unoptimized />
                                                                : <div className="w-full h-full flex items-center justify-center text-slate-300"><FaBoxOpen className="text-xl" /></div>
                                                        }
                                                        {editingProductId === p.id && (
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <FaCamera className="text-white text-sm" />
                                                            </div>
                                                        )}
                                                        <input
                                                            id={`edit-img-${p.id}`}
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const f = e.target.files?.[0];
                                                                if (f) {
                                                                    setEditProdImage(f);
                                                                    setEditProdImagePreview(URL.createObjectURL(f));
                                                                }
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        {editingProductId === p.id ? (
                                                            <>
                                                                <input
                                                                    type="text"
                                                                    value={editProdName}
                                                                    onChange={(e) => setEditProdName(e.target.value)}
                                                                    placeholder="Nom du produit"
                                                                    className="w-full px-2 py-1 border border-indigo-300 rounded-lg text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400"
                                                                />
                                                                <div className="flex gap-1.5 mt-1">
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={editProdPrice}
                                                                        onChange={(e) => setEditProdPrice(e.target.value)}
                                                                        placeholder="Prix DZD"
                                                                        className="w-1/2 px-2 py-1 border border-indigo-300 rounded-lg text-xs font-bold text-blue-700 outline-none focus:ring-2 focus:ring-indigo-400"
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={editProdOrdre}
                                                                        onChange={(e) => setEditProdOrdre(e.target.value)}
                                                                        placeholder="Ordre (ex: 1, 2...)"
                                                                        title="Classement / Ordre d'affichage"
                                                                        className="w-1/2 px-2 py-1 border border-indigo-300 rounded-lg text-xs font-bold text-amber-600 outline-none focus:ring-2 focus:ring-indigo-400"
                                                                    />
                                                                </div>
                                                                <select
                                                                    value={editProdCatId}
                                                                    onChange={(e) => setEditProdCatId(e.target.value)}
                                                                    className="w-full mt-1 px-2 py-1 border border-indigo-300 rounded-lg text-[10px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400"
                                                                >
                                                                    <option value="">Catégorie...</option>
                                                                    {storeCatalogues.map((c) => (
                                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                                    ))}
                                                                </select>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="flex items-center justify-between gap-1">
                                                                    <h5 className="font-bold text-sm text-slate-800 truncate">{p.name}</h5>
                                                                    {p.ordre && p.ordre < 999 ? (
                                                                        <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-extrabold text-[10px] border border-amber-200 shrink-0">
                                                                            🏅 #{p.ordre}
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                                <p className="text-xs text-blue-600 font-extrabold mt-0.5">{p.price} DZD</p>
                                                                {p.catalogue_name && (
                                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md">
                                                                        {p.catalogue_name}
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Description row */}
                                                {editingProductId === p.id ? (
                                                    <textarea
                                                        value={editProdDesc}
                                                        onChange={(e) => setEditProdDesc(e.target.value)}
                                                        placeholder="Description..."
                                                        rows={2}
                                                        className="w-full mt-2 px-2 py-1.5 border border-indigo-300 rounded-lg text-xs text-slate-600 outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                                                    />
                                                ) : (
                                                    p.description && (
                                                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{p.description}</p>
                                                    )
                                                )}

                                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 gap-2">
                                                    {editingProductId === p.id ? (
                                                        /* SAVE / CANCEL buttons */
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingProductId(null)}
                                                                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                                                            >
                                                                Annuler
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleUpdateProduct(e as unknown as React.FormEvent)}
                                                                disabled={isSavingEdit}
                                                                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                                                            >
                                                                {isSavingEdit ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                                                Enregistrer
                                                            </button>
                                                        </>
                                                    ) : (
                                                        /* NORMAL view: availability + edit + delete */
                                                        <>
                                                            <button
                                                                onClick={() => handleToggleAvailability(p.id, p.disponibilite)}
                                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${p.disponibilite
                                                                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                                        : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                                                    }`}
                                                            >
                                                                {p.disponibilite ? <FaCheckCircle /> : <FaTimesCircle />}
                                                                {p.disponibilite ? "Disponible" : "Épuisé"}
                                                            </button>

                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    onClick={() => handleStartEdit(p)}
                                                                    className="p-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                                                                    title="Modifier ce produit"
                                                                >
                                                                    <FaPen className="text-[9px]" /> Modifier
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteProduct(p.id)}
                                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                    title="Supprimer ce produit"
                                                                >
                                                                    <FaTrash className="text-xs" />
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: CONFIGURATION LIVRAISON, POURCENTAGES & PRODUIT LIVRAISON */}
                    {activeTab === "livraison" && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Header Banner */}
                            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 rounded-2xl text-white shadow-md flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shadow-inner">
                                        🚚
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Gestion & Paramètres de Livraison</h3>
                                        <p className="text-xs text-emerald-100">
                                            Configurez la gratuité programmée, le tarif, les pourcentages ou ajoutez la livraison comme produit.
                                        </p>
                                    </div>
                                </div>

                                {isFreeDeliveryCurrentlyActive ? (
                                    <div className="px-4 py-2 rounded-xl bg-white text-emerald-700 font-bold text-xs flex items-center gap-2 shadow-sm animate-pulse">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        <span>Livraison Gratuite ACTIVE</span>
                                    </div>
                                ) : storeLivraisonGratuite ? (
                                    <div className="px-4 py-2 rounded-xl bg-white/20 text-white font-bold text-xs flex items-center gap-2">
                                        <span>⏳ Offre Programmée</span>
                                    </div>
                                ) : (
                                    <div className="px-4 py-2 rounded-xl bg-black/20 text-emerald-100 font-medium text-xs">
                                        Tarif standard payant
                                    </div>
                                )}
                            </div>

                            {/* SECTION A: CONFIGURATION DE LA LIVRAISON */}
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-5">
                                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <FaTruck className="text-emerald-600 text-lg" />
                                        <h4 className="text-sm font-bold text-slate-800">
                                            1. Campagne & Tarifs de Livraison
                                        </h4>
                                    </div>
                                    {isFreeDeliveryCurrentlyActive && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                                            Actif aujourd&apos;hui 🎉
                                        </span>
                                    )}
                                </div>

                                {/* Toggle Gratuité */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4 shadow-xs">
                                    <div>
                                        <span className="text-sm font-bold text-slate-800 block">
                                            Activer l&apos;offre Livraison Gratuite
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            Lorsque cette offre est active, le prix de livraison pour ce magasin est automatiquement à 0 DZD.
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setStoreLivraisonGratuite(!storeLivraisonGratuite)}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${storeLivraisonGratuite ? "bg-emerald-600" : "bg-slate-300"
                                            }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${storeLivraisonGratuite ? "translate-x-5" : "translate-x-0"
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* Date Range if Free Delivery is active */}
                                {storeLivraisonGratuite && (
                                    <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                            <FaCalendarAlt className="text-emerald-600" />
                                            <span>Période programmée de livraison gratuite (ex: 17/06/2026 au 20/06/2026)</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                                    Date de début (inclus)
                                                </label>
                                                <input
                                                    type="date"
                                                    value={storeDateDebutLivraison}
                                                    onChange={(e) => setStoreDateDebutLivraison(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                                    Date de fin (inclus)
                                                </label>
                                                <input
                                                    type="date"
                                                    value={storeDateFinLivraison}
                                                    onChange={(e) => setStoreDateFinLivraison(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Quick shortcuts */}
                                        <div className="flex items-center gap-2 flex-wrap pt-1">
                                            <span className="text-[11px] text-slate-400 font-medium">Raccourcis rapides :</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const today = new Date();
                                                    const start = today.toISOString().substring(0, 10);
                                                    const end = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
                                                    setStoreDateDebutLivraison(start);
                                                    setStoreDateFinLivraison(end);
                                                }}
                                                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300 transition-colors"
                                            >
                                                +3 Jours
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const today = new Date();
                                                    const start = today.toISOString().substring(0, 10);
                                                    const end = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
                                                    setStoreDateDebutLivraison(start);
                                                    setStoreDateFinLivraison(end);
                                                }}
                                                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300 transition-colors"
                                            >
                                                1 Semaine
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const today = new Date();
                                                    const start = today.toISOString().substring(0, 10);
                                                    const end = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
                                                    setStoreDateDebutLivraison(start);
                                                    setStoreDateFinLivraison(end);
                                                }}
                                                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300 transition-colors"
                                            >
                                                1 Mois
                                            </button>
                                            {(storeDateDebutLivraison || storeDateFinLivraison) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setStoreDateDebutLivraison("");
                                                        setStoreDateFinLivraison("");
                                                    }}
                                                    className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                                >
                                                    Permanent (sans dates)
                                                </button>
                                            )}
                                        </div>

                                        {/* Status Message */}
                                        <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center gap-2">
                                            <FaInfoCircle className="text-emerald-600 shrink-0" />
                                            <span>
                                                {storeDateDebutLivraison && storeDateFinLivraison ? (
                                                    <>
                                                        Campagne du <strong>{storeDateDebutLivraison}</strong> au <strong>{storeDateFinLivraison}</strong>.{" "}
                                                        {isFreeDeliveryCurrentlyActive ? (
                                                            <span className="text-emerald-700 font-bold">✓ Active aujourd&apos;hui</span>
                                                        ) : (
                                                            <span className="text-amber-700 font-bold">⏰ Hors période active</span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>Offre permanente sans limite de date.</>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Specific Delivery Fee */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                                        <span>Tarif Spécifique de Livraison (DZD)</span>
                                        <span className="text-[11px] font-normal text-slate-400">
                                            (Optionnel - si non gratuit, remplace le calcul par distance)
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            step="10"
                                            disabled={storeLivraisonGratuite && isFreeDeliveryCurrentlyActive}
                                            value={storeTarifLivraison}
                                            onChange={(e) => setStoreTarifLivraison(e.target.value)}
                                            placeholder="Ex: 200, 250... (laisser vide pour calcul distance)"
                                            className={`w-full pl-4 pr-12 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${storeLivraisonGratuite && isFreeDeliveryCurrentlyActive ? "opacity-50 cursor-not-allowed bg-slate-100" : "text-slate-800"
                                                }`}
                                        />
                                        <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                                            DZD
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION B: CONFIGURATION DES POURCENTAGES */}
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                                    <FaPercentage className="text-indigo-600 text-lg" />
                                    <h4 className="text-sm font-bold text-slate-800">
                                        2. Pourcentages, Commissions & Remises
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Commission Plateforme (%)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={storePourcentageCommission}
                                                onChange={(e) => setStorePourcentageCommission(e.target.value)}
                                                placeholder="Ex: 10, 15..."
                                                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <span className="absolute right-3 top-2 text-sm font-bold text-slate-400">%</span>
                                        </div>
                                        <span className="text-[11px] text-slate-500 block">
                                            Pourcentage prélevé par Tawsilat Star sur les commandes.
                                        </span>
                                    </div>

                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Remise Commerciale (%)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={storePourcentageRemise}
                                                onChange={(e) => setStorePourcentageRemise(e.target.value)}
                                                placeholder="Ex: 5, 10..."
                                                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-rose-600 outline-none focus:ring-2 focus:ring-rose-500"
                                            />
                                            <span className="absolute right-3 top-2 text-sm font-bold text-slate-400">%</span>
                                        </div>
                                        <span className="text-[11px] text-slate-500 block">
                                            Remise accordée aux clients sur les articles de ce magasin.
                                        </span>
                                    </div>
                                </div>

                                {/* Simulation */}
                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                                    <span className="font-semibold text-slate-700 block">
                                        Simulation indicative (pour un panier de 1 000 DZD) :
                                    </span>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                                            <span className="text-[10px] text-slate-500 block">Remise Client</span>
                                            <span className="font-bold text-rose-600">
                                                -{(1000 * (parseFloat(storePourcentageRemise) || 0) / 100).toFixed(0)} DZD
                                            </span>
                                        </div>
                                        <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                                            <span className="text-[10px] text-slate-500 block">Commission Plateforme</span>
                                            <span className="font-bold text-indigo-600">
                                                +{(1000 * (parseFloat(storePourcentageCommission) || 0) / 100).toFixed(0)} DZD
                                            </span>
                                        </div>
                                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                                            <span className="text-[10px] text-emerald-700 block">Net Revenu Magasin</span>
                                            <span className="font-bold text-emerald-700">
                                                {(1000 - (1000 * (parseFloat(storePourcentageCommission) || 0) / 100) - (1000 * (parseFloat(storePourcentageRemise) || 0) / 100)).toFixed(0)} DZD
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button for Delivery & Margins */}
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={handleSaveStoreInfo}
                                        disabled={isSavingInfo}
                                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm py-2.5 px-6 rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all"
                                    >
                                        {isSavingInfo ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                        Enregistrer la configuration de livraison & pourcentages
                                    </button>
                                </div>
                            </div>


                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <p>
                        Magasin : <span className="font-semibold text-slate-700">{storeName}</span> • ID #{magasin.id}
                    </p>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
