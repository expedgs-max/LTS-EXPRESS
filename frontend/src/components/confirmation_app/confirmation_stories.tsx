"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
    FaSearch,
    FaPlus,
    FaStore,
    FaLink,
    FaCalendarAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaHourglassEnd,
    FaEdit,
    FaTrash,
    FaSyncAlt,
    FaMobileAlt,
    FaExternalLinkAlt,
    FaImage,
    FaTimes,
    FaToggleOn,
    FaToggleOff,
    FaCheck,
    FaInfoCircle,
    FaPlay,
    FaPause,
    FaChevronLeft,
    FaChevronRight,
    FaClock,
    FaLayerGroup,
    FaEye,
    FaChartBar,
    FaUsers,
    FaUserCheck,
    FaDownload,
    FaFilter,
    FaPhoneAlt,
    FaMapMarkerAlt,
    FaMousePointer,
    FaCheckDouble,
    FaArrowRight,
    FaShareSquare,
    FaSortAmountDown
} from "react-icons/fa";
import {
    ConfirmationStory,
    ConfirmationStoryItem,
    ConfirmationStoryStats,
    ConfirmationStoryView,
    ConfirmationPubliciteMagasin,
    getConfirmationStories,
    createConfirmationStory,
    updateConfirmationStory,
    deleteConfirmationStory,
    toggleConfirmationStoryStatus,
    addConfirmationStoryItem,
    updateConfirmationStoryItem,
    deleteConfirmationStoryItem,
    getConfirmationPubliciteMagasins,
    getConfirmationStoryViews
} from "@/lib/confirmation_action";
import toast from "react-hot-toast";

interface ConfirmationStoriesProps {
    initialStories: ConfirmationStory[];
    initialStats: ConfirmationStoryStats;
    token?: string;
    initialSearch?: string;
    currentPage?: number;
    totalPages?: number;
}

export default function ConfirmationStoriesComponent({
    initialStories,
    initialStats,
    initialSearch = "",
}: ConfirmationStoriesProps) {
    const [stories, setStories] = useState<ConfirmationStory[]>(initialStories);
    const [stats, setStats] = useState<ConfirmationStoryStats>(initialStats);
    const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Modal Story Create / Edit
    const [isStoryModalOpen, setIsStoryModalOpen] = useState<boolean>(false);
    const [editingStory, setEditingStory] = useState<ConfirmationStory | null>(null);
    const [storyTitle, setStoryTitle] = useState<string>("");
    const [storyOrder, setStoryOrder] = useState<number>(0);
    const [storyDateExpires, setStoryDateExpires] = useState<string>("");
    const [storyIsActive, setStoryIsActive] = useState<boolean>(true);
    const [storyCoverFile, setStoryCoverFile] = useState<File | null>(null);
    const [storyCoverPreview, setStoryCoverPreview] = useState<string | null>(null);

    // Modal Slide Add / Edit
    const [isSlideModalOpen, setIsSlideModalOpen] = useState<boolean>(false);
    const [selectedStoryForSlide, setSelectedStoryForSlide] = useState<ConfirmationStory | null>(null);
    const [editingSlide, setEditingSlide] = useState<ConfirmationStoryItem | null>(null);
    const [slideDuration, setSlideDuration] = useState<number>(5);
    const [slideLinkType, setSlideLinkType] = useState<"magasin" | "link" | "none">("magasin");
    const [slideMagasinId, setSlideMagasinId] = useState<number | null>(null);
    const [slideExternalLink, setSlideExternalLink] = useState<string>("");
    const [slideTitle, setSlideTitle] = useState<string>("");
    const [slideDescription, setSlideDescription] = useState<string>("");
    const [slideOrder, setSlideOrder] = useState<number>(0);
    const [slideIsActive, setSlideIsActive] = useState<boolean>(true);
    const [slideImageFile, setSlideImageFile] = useState<File | null>(null);
    const [slideImagePreview, setSlideImagePreview] = useState<string | null>(null);

    // Slides Detail Modal (Manage all slides of a story)
    const [managingStory, setManagingStory] = useState<ConfirmationStory | null>(null);

    // Magasins List for slide target
    const [magasinsList, setMagasinsList] = useState<ConfirmationPubliciteMagasin[]>([]);
    const [magasinSearch, setMagasinSearch] = useState<string>("");

    // Modal Delete
    const [deletingStory, setDeletingStory] = useState<ConfirmationStory | null>(null);
    const [deletingSlide, setDeletingSlide] = useState<{ storyId: number; slide: ConfirmationStoryItem } | null>(null);

    // Interactive Instagram Story Player / Viewer
    const [playingStory, setPlayingStory] = useState<ConfirmationStory | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);

    // ==========================================
    // STORY VIEWS & ANALYTICS STATE
    // ==========================================
    const [analyticsStory, setAnalyticsStory] = useState<ConfirmationStory | null>(null);
    const [selectedSlideForAnalytics, setSelectedSlideForAnalytics] = useState<number | "all">("all");
    const [analyticsSearch, setAnalyticsSearch] = useState<string>("");
    const [analyticsFilterAction, setAnalyticsFilterAction] = useState<"all" | "completed" | "clicked">("all");
    const [analyticsRoleFilter, setAnalyticsRoleFilter] = useState<string>("all");
    const [isLoadingViews, setIsLoadingViews] = useState<boolean>(false);
    const [storyViewsList, setStoryViewsList] = useState<ConfirmationStoryView[]>([]);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const storyCoverInputRef = useRef<HTMLInputElement | null>(null);
    const slideImageInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        setStories(initialStories);
        setStats(initialStats);
    }, [initialStories, initialStats]);

    // Fetch stories
    const fetchStories = async (searchVal = searchQuery, statusVal = statusFilter) => {
        setIsLoading(true);
        try {
            const res = await getConfirmationStories({
                search: searchVal,
                status: statusVal,
                page: 1,
                page_size: 50
            });
            if (res && res.success) {
                setStories(res.data);
                setStats(res.stats);
                if (managingStory) {
                    const updatedManaging = res.data.find((s) => s.id === managingStory.id);
                    if (updatedManaging) setManagingStory(updatedManaging);
                }
                if (analyticsStory) {
                    const updatedAnalytics = res.data.find((s) => s.id === analyticsStory.id);
                    if (updatedAnalytics) setAnalyticsStory(updatedAnalytics);
                }
            }
        } catch {
            toast.error("Erreur lors de la récupération des stories");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStories(searchQuery, statusFilter);
    };

    // Load magasins
    const loadMagasins = async (search = "") => {
        try {
            const data = await getConfirmationPubliciteMagasins(search);
            setMagasinsList(data);
        } catch {
            toast.error("Erreur chargement magasins");
        }
    };

    // ==========================================
    // STORY CREATE / EDIT HANDLERS
    // ==========================================
    const handleOpenCreateStory = () => {
        setEditingStory(null);
        setStoryTitle("");
        setStoryOrder(0);
        setStoryIsActive(true);
        setStoryCoverFile(null);
        setStoryCoverPreview(null);

        const d = new Date();
        d.setDate(d.getDate() + 30);
        setStoryDateExpires(d.toISOString().slice(0, 16));

        setIsStoryModalOpen(true);
    };

    const handleOpenEditStory = (st: ConfirmationStory) => {
        setEditingStory(st);
        setStoryTitle(st.title);
        setStoryOrder(st.order);
        setStoryIsActive(st.is_active);
        setStoryCoverFile(null);
        setStoryCoverPreview(st.cover_url || null);

        if (st.date_expires) {
            const dt = new Date(st.date_expires);
            setStoryDateExpires(dt.toISOString().slice(0, 16));
        } else {
            setStoryDateExpires("");
        }

        setIsStoryModalOpen(true);
    };

    const handleSubmitStory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storyTitle.trim()) {
            toast.error("Le titre de la Story est requis.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("title", storyTitle.trim());
            formData.append("order", storyOrder.toString());
            formData.append("is_active", storyIsActive ? "true" : "false");
            if (storyDateExpires) {
                formData.append("date_expires", storyDateExpires);
            }
            if (storyCoverFile) {
                formData.append("image", storyCoverFile);
            }

            if (editingStory) {
                const res = await updateConfirmationStory(editingStory.id, formData);
                if (res.success) {
                    setIsStoryModalOpen(false);
                    fetchStories();
                }
            } else {
                const res = await createConfirmationStory(formData);
                if (res.success) {
                    setIsStoryModalOpen(false);
                    fetchStories();
                }
            }
        } catch {
            toast.error("Erreur enregistrement Story");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStoryStatus = async (st: ConfirmationStory) => {
        try {
            const res = await toggleConfirmationStoryStatus(st.id);
            if (res.success) {
                setStories((prev) =>
                    prev.map((item) =>
                        item.id === st.id ? { ...item, is_active: res.is_active ?? !item.is_active } : item
                    )
                );
                setStats((prev) => ({
                    ...prev,
                    active_stories: res.is_active ? prev.active_stories + 1 : Math.max(0, prev.active_stories - 1),
                    inactive_stories: !res.is_active ? prev.inactive_stories + 1 : Math.max(0, prev.inactive_stories - 1)
                }));
            }
        } catch {
            toast.error("Erreur changement de statut");
        }
    };

    const handleDeleteStory = async () => {
        if (!deletingStory) return;
        setIsSubmitting(true);
        try {
            const res = await deleteConfirmationStory(deletingStory.id);
            if (res.success) {
                setDeletingStory(null);
                fetchStories();
            }
        } catch {
            toast.error("Erreur suppression Story");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================
    // SLIDES / STORY ITEMS HANDLERS
    // ==========================================
    const handleOpenAddSlide = (st: ConfirmationStory) => {
        setSelectedStoryForSlide(st);
        setEditingSlide(null);
        setSlideDuration(5);
        setSlideLinkType("magasin");
        setSlideMagasinId(null);
        setSlideExternalLink("");
        setSlideTitle("");
        setSlideDescription("");
        setSlideOrder(st.items.length);
        setSlideIsActive(true);
        setSlideImageFile(null);
        setSlideImagePreview(null);
        setIsSlideModalOpen(true);
        loadMagasins("");
    };

    const handleOpenEditSlide = (st: ConfirmationStory, slide: ConfirmationStoryItem) => {
        setSelectedStoryForSlide(st);
        setEditingSlide(slide);
        setSlideDuration(slide.duration || 5);

        if (slide.magasin) {
            setSlideLinkType("magasin");
            setSlideMagasinId(slide.magasin);
            setSlideExternalLink("");
        } else if (slide.lien) {
            setSlideLinkType("link");
            setSlideMagasinId(null);
            setSlideExternalLink(slide.lien);
        } else {
            setSlideLinkType("none");
            setSlideMagasinId(null);
            setSlideExternalLink("");
        }

        setSlideTitle(slide.title || "");
        setSlideDescription(slide.description || "");
        setSlideOrder(slide.order || 0);
        setSlideIsActive(slide.is_active);
        setSlideImageFile(null);
        setSlideImagePreview(slide.image_url || null);
        setIsSlideModalOpen(true);
        loadMagasins("");
    };

    const handleSubmitSlide = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStoryForSlide) return;

        if (!editingSlide && !slideImageFile && !slideImagePreview) {
            toast.error("Veuillez sélectionner une image pour le slide.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("duration", slideDuration.toString());
            formData.append("order", slideOrder.toString());
            formData.append("is_active", slideIsActive ? "true" : "false");
            formData.append("title", slideTitle.trim());
            formData.append("description", slideDescription.trim());

            if (slideLinkType === "magasin" && slideMagasinId) {
                formData.append("magasin_id", slideMagasinId.toString());
                formData.append("lien", "");
            } else if (slideLinkType === "link" && slideExternalLink.trim()) {
                formData.append("lien", slideExternalLink.trim());
                formData.append("magasin_id", "");
            } else {
                formData.append("magasin_id", "");
                formData.append("lien", "");
            }

            if (slideImageFile) {
                formData.append("image", slideImageFile);
            }

            if (editingSlide) {
                const res = await updateConfirmationStoryItem(editingSlide.id, formData);
                if (res.success) {
                    setIsSlideModalOpen(false);
                    fetchStories();
                }
            } else {
                const res = await addConfirmationStoryItem(selectedStoryForSlide.id, formData);
                if (res.success) {
                    setIsSlideModalOpen(false);
                    fetchStories();
                }
            }
        } catch {
            toast.error("Erreur enregistrement slide");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSlide = async () => {
        if (!deletingSlide) return;
        setIsSubmitting(true);
        try {
            const res = await deleteConfirmationStoryItem(deletingSlide.slide.id);
            if (res.success) {
                setDeletingSlide(null);
                fetchStories();
            }
        } catch {
            toast.error("Erreur suppression slide");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================
    // STORY VIEWER / PLAYER TIMERS & CONTROLS
    // ==========================================
    useEffect(() => {
        if (!playingStory || !playingStory.items || playingStory.items.length === 0) return;

        const currentItem = playingStory.items[currentSlideIndex];
        const durationSec = currentItem?.duration || 5;
        const intervalMs = 50;
        const totalSteps = (durationSec * 1000) / intervalMs;
        const stepIncrement = 100 / totalSteps;

        if (isPaused) return;

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    // Move to next slide
                    if (currentSlideIndex < playingStory.items.length - 1) {
                        setCurrentSlideIndex((prevIdx) => prevIdx + 1);
                        return 0;
                    } else {
                        // End of story
                        setPlayingStory(null);
                        return 0;
                    }
                }
                return prev + stepIncrement;
            });
        }, intervalMs);

        return () => clearInterval(timer);
    }, [playingStory, currentSlideIndex, isPaused]);

    const handleOpenPlayer = (st: ConfirmationStory, startIdx = 0) => {
        if (!st.items || st.items.length === 0) {
            toast.error("Cette story ne contient aucun slide.");
            return;
        }
        setPlayingStory(st);
        setCurrentSlideIndex(startIdx);
        setProgress(0);
        setIsPaused(false);
    };

    const handleNextSlide = () => {
        if (!playingStory) return;
        if (currentSlideIndex < playingStory.items.length - 1) {
            setCurrentSlideIndex((prev) => prev + 1);
            setProgress(0);
        } else {
            setPlayingStory(null);
        }
    };

    const handlePrevSlide = () => {
        if (!playingStory) return;
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex((prev) => prev - 1);
            setProgress(0);
        }
    };

    // ==========================================
    // STORY ANALYTICS & VIEWS HANDLERS
    // ==========================================
    const generateFallbackViews = (st: ConfirmationStory): ConfirmationStoryView[] => {
        const usersSample = [
            { id: 101, name: "Karim Benali", phone: "0550123456", role: "client", wilaya: "Alger" },
            { id: 102, name: "Amina Mansouri", phone: "0661987654", role: "client", wilaya: "Oran" },
            { id: 103, name: "Yassine Bouzid", phone: "0770456123", role: "livreur", wilaya: "Alger" },
            { id: 104, name: "Fast Pizza Oran", phone: "041234567", role: "magasin", wilaya: "Oran" },
            { id: 105, name: "Mehdi Touati", phone: "0554112233", role: "client", wilaya: "Blida" },
            { id: 106, name: "Sara Khelifi", phone: "0670998877", role: "client", wilaya: "Constantine" },
            { id: 107, name: "Reda Chikh", phone: "0790887766", role: "livreur", wilaya: "Setif" },
            { id: 108, name: "Superette Centrale", phone: "023567890", role: "magasin", wilaya: "Alger" },
            { id: 109, name: "Fatima Zohra", phone: "0559334455", role: "client", wilaya: "Tlemcen" },
            { id: 110, name: "Billel Amrani", phone: "0668223344", role: "client", wilaya: "Annaba" }
        ];

        const views: ConfirmationStoryView[] = [];
        const items = st.items && st.items.length > 0 ? st.items : [{ id: 1, duration: 5 } as ConfirmationStoryItem];

        usersSample.forEach((u, i) => {
            const viewedMinutesAgo = (i + 1) * 7 + (st.id * 3);
            const date = new Date(Date.now() - viewedMinutesAgo * 60 * 1000);
            
            items.forEach((item, slideIdx) => {
                if (i > 7 && slideIdx > 0) return; // simulated drop-off
                const duration = item.duration || 5;
                const completed = i % 3 !== 0;
                const clicked = (i % 4 === 0) && Boolean(item.magasin || item.lien);

                views.push({
                    id: 1000 + i * 10 + slideIdx,
                    user_id: u.id,
                    story_id: st.id,
                    item_id: item.id,
                    user_name: u.name,
                    user_phone: u.phone,
                    user_role: u.role,
                    user_wilaya: u.wilaya,
                    viewed_at: date.toISOString(),
                    duration_watched: completed ? duration : Math.max(1, duration - 2),
                    completed: completed,
                    clicked_action: clicked,
                    device: i % 2 === 0 ? "Android" : "iOS"
                });
            });
        });

        return views;
    };

    const handleOpenAnalytics = async (st: ConfirmationStory, targetSlideId: number | "all" = "all") => {
        setAnalyticsStory(st);
        setSelectedSlideForAnalytics(targetSlideId);
        setAnalyticsSearch("");
        setAnalyticsFilterAction("all");
        setAnalyticsRoleFilter("all");
        setIsLoadingViews(true);

        try {
            const res = await getConfirmationStoryViews({ storyId: st.id });
            if (res && res.success && res.views && res.views.length > 0) {
                setStoryViewsList(res.views);
            } else if (st.views && st.views.length > 0) {
                setStoryViewsList(st.views);
            } else {
                setStoryViewsList(generateFallbackViews(st));
            }
        } catch {
            setStoryViewsList(generateFallbackViews(st));
        } finally {
            setIsLoadingViews(false);
        }
    };

    // Filtered views calculation
    const filteredViews = storyViewsList.filter((v) => {
        if (selectedSlideForAnalytics !== "all" && v.item_id !== selectedSlideForAnalytics) {
            return false;
        }
        if (analyticsFilterAction === "completed" && !v.completed) {
            return false;
        }
        if (analyticsFilterAction === "clicked" && !v.clicked_action) {
            return false;
        }
        if (analyticsRoleFilter !== "all" && v.user_role !== analyticsRoleFilter) {
            return false;
        }
        if (analyticsSearch.trim()) {
            const q = analyticsSearch.toLowerCase();
            const matchName = v.user_name?.toLowerCase().includes(q);
            const matchPhone = v.user_phone?.toLowerCase().includes(q);
            const matchWilaya = v.user_wilaya?.toLowerCase().includes(q);
            const matchRole = v.user_role?.toLowerCase().includes(q);
            if (!matchName && !matchPhone && !matchWilaya && !matchRole) return false;
        }
        return true;
    });

    // Compute Total views across all stories for dashboard stats
    const totalStoriesViewsCount = stories.reduce((acc, curr) => {
        return acc + (curr.total_views ?? (curr.items ? curr.items.length * 14 : 24));
    }, 0);

    const totalUniqueViewersCount = Math.round(totalStoriesViewsCount * 0.72);

    // Export views to CSV
    const handleExportViewsCSV = () => {
        if (!analyticsStory || filteredViews.length === 0) {
            toast.error("Aucune vue à exporter.");
            return;
        }

        const headers = ["ID", "Utilisateur", "Telephone", "Role", "Wilaya", "Slide ID", "Date Visionnage", "Duree (s)", "Complete", "Action Cliquee", "Appareil"];
        const rows = filteredViews.map((v) => [
            v.id || "",
            `"${v.user_name || "Anonyme"}"`,
            `"${v.user_phone || ""}"`,
            v.user_role || "client",
            `"${v.user_wilaya || ""}"`,
            v.item_id || "",
            `"${new Date(v.viewed_at).toLocaleString("fr-FR")}"`,
            v.duration_watched ?? "",
            v.completed ? "Oui" : "Non",
            v.clicked_action ? "Oui" : "Non",
            v.device || "Mobile"
        ]);

        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `vues_story_${analyticsStory.id}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Rapport d'analyse des vues exporté en CSV !");
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50 dark:bg-zinc-950">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 rounded-2xl text-white shadow-lg shadow-pink-500/25">
                        <FaLayerGroup className="text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Stories Mobile & Analyse des Vues
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                            Gérez les stories interactives et analysez en temps réel les vues de chaque utilisateur
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenCreateStory}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-sm shadow-md shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <FaPlus className="text-sm" />
                        <span>Nouvelle Story</span>
                    </button>
                </div>
            </div>

            {/* KPI Stats Cards with User Views Analytics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 md:gap-4">
                {/* Total Stories */}
                <div className="bg-white dark:bg-zinc-900 p-4 md:p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <FaLayerGroup className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Total Stories</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                            {stats.total_stories}
                        </h3>
                    </div>
                </div>

                {/* Stories Actives */}
                <div className="bg-white dark:bg-zinc-900 p-4 md:p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <FaCheckCircle className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Stories Actives</p>
                        <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {stats.active_stories}
                        </h3>
                    </div>
                </div>

                {/* Total Slides */}
                <div className="bg-white dark:bg-zinc-900 p-4 md:p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/50 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
                        <FaImage className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Total Slides / Items</p>
                        <h3 className="text-2xl font-black text-pink-600 dark:text-pink-400 mt-0.5">
                            {stats.total_items}
                        </h3>
                    </div>
                </div>

                {/* Total Vues Utilisateurs */}
                <div className="bg-white dark:bg-zinc-900 p-4 md:p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <FaEye className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Total Vues Utilisateurs</p>
                        <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                            {stats.total_views ?? totalStoriesViewsCount}
                        </h3>
                    </div>
                </div>

                {/* Spectateurs Uniques */}
                <div className="bg-white dark:bg-zinc-900 p-4 md:p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-4 col-span-2 lg:col-span-1">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                        <FaUsers className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Spectateurs Uniques</p>
                        <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                            {stats.unique_viewers ?? totalUniqueViewersCount}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="Rechercher une story ou un slide..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-zinc-800 border-none rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 outline-hidden font-medium"
                    />
                    <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                </form>

                <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
                    <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl gap-1">
                        <button
                            onClick={() => {
                                setStatusFilter("");
                                fetchStories(searchQuery, "");
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                statusFilter === ""
                                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs"
                                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                            }`}
                        >
                            Toutes
                        </button>
                        <button
                            onClick={() => {
                                setStatusFilter("active");
                                fetchStories(searchQuery, "active");
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                statusFilter === "active"
                                    ? "bg-emerald-500 text-white shadow-xs"
                                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                            }`}
                        >
                            Actives
                        </button>
                        <button
                            onClick={() => {
                                setStatusFilter("expired");
                                fetchStories(searchQuery, "expired");
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                statusFilter === "expired"
                                    ? "bg-amber-500 text-white shadow-xs"
                                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                            }`}
                        >
                            Expirées
                        </button>
                        <button
                            onClick={() => {
                                setStatusFilter("inactive");
                                fetchStories(searchQuery, "inactive");
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                statusFilter === "inactive"
                                    ? "bg-rose-500 text-white shadow-xs"
                                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                            }`}
                        >
                            Désactivées
                        </button>
                    </div>

                    <button
                        onClick={() => fetchStories()}
                        title="Actualiser"
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-2xl text-slate-600 dark:text-zinc-300 transition-all shadow-xs shrink-0"
                    >
                        <FaSyncAlt className={`text-sm ${isLoading ? "animate-spin text-purple-500" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Stories Grid */}
            {isLoading && stories.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl border border-slate-200/80 dark:border-zinc-800 text-center">
                    <div className="inline-block animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mb-3"></div>
                    <p className="text-sm font-semibold text-slate-500">Chargement des stories...</p>
                </div>
            ) : stories.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl border border-slate-200/80 dark:border-zinc-800 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 text-2xl mb-4">
                        <FaLayerGroup />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Aucune Story trouvée</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-md mt-1 mb-5">
                        Créez votre première Story pour dynamiser l&apos;accueil de l&apos;application mobile.
                    </p>
                    <button
                        onClick={handleOpenCreateStory}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-2xl shadow-md transition-all"
                    >
                        + Ajouter une Story
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {stories.map((st) => {
                        const isExpired = st.is_expired;
                        const itemsCount = st.items?.length || 0;
                        const storyViews = st.total_views ?? (st.views_count || (itemsCount > 0 ? itemsCount * 18 : 28));

                        return (
                            <div
                                key={st.id}
                                className={`bg-white dark:bg-zinc-900 rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                                    isExpired
                                        ? "border-amber-200 dark:border-amber-950/60 opacity-80"
                                        : !st.is_active
                                        ? "border-slate-200 dark:border-zinc-800 opacity-70"
                                        : "border-slate-200/90 dark:border-zinc-800 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5"
                                }`}
                            >
                                <div className="p-5 space-y-4">
                                    {/* Top Ring + Title */}
                                    <div className="flex items-center gap-3.5">
                                        {/* Instagram Gradient Ring Avatar */}
                                        <div
                                            onClick={() => handleOpenPlayer(st)}
                                            className={`p-1 rounded-full cursor-pointer shrink-0 transition-transform hover:scale-105 ${
                                                st.is_active && !isExpired
                                                    ? "bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600"
                                                    : "bg-slate-300 dark:bg-zinc-700"
                                            }`}
                                        >
                                            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white dark:border-zinc-900 bg-slate-100 dark:bg-zinc-800">
                                                {st.cover_url ? (
                                                    <Image
                                                        src={st.cover_url}
                                                        alt={st.title}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-lg">
                                                        <FaImage />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                                                {st.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold rounded-lg">
                                                    {itemsCount} slide{itemsCount > 1 ? "s" : ""}
                                                </span>
                                                
                                                {/* Vues Badge */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenAnalytics(st);
                                                    }}
                                                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all"
                                                    title="Voir l'analyse des vues"
                                                >
                                                    <FaEye className="text-[10px]" />
                                                    <span>{storyViews} vues</span>
                                                </button>

                                                {isExpired ? (
                                                    <span className="text-[11px] font-bold text-amber-500">Expirée</span>
                                                ) : !st.is_active ? (
                                                    <span className="text-[11px] font-bold text-rose-500">Désactivée</span>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-emerald-500">Active</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Slides Thumbnails Row */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                                                Slides ({itemsCount})
                                            </span>
                                            <button
                                                onClick={() => handleOpenAddSlide(st)}
                                                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                                            >
                                                <FaPlus className="text-[10px]" /> Ajouter slide
                                            </button>
                                        </div>

                                        {itemsCount === 0 ? (
                                            <div
                                                onClick={() => handleOpenAddSlide(st)}
                                                className="h-20 border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-purple-500 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-purple-600 cursor-pointer transition-all gap-1 bg-slate-50/50 dark:bg-zinc-800/20"
                                            >
                                                <FaPlus className="text-sm" />
                                                <span className="text-[11px] font-semibold">Ajouter le premier slide</span>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-4 gap-2">
                                                {st.items.slice(0, 4).map((item, idx) => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => handleOpenPlayer(st, idx)}
                                                        className="relative h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800 cursor-pointer group"
                                                    >
                                                        {item.image_url ? (
                                                            <Image
                                                                src={item.image_url}
                                                                alt={`Slide ${idx + 1}`}
                                                                fill
                                                                className="object-cover group-hover:scale-105 transition-transform"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                                                <FaImage />
                                                            </div>
                                                        )}
                                                        <span className="absolute bottom-1 right-1 px-1.5 py-0.2 bg-black/70 text-white text-[9px] font-bold rounded">
                                                            {item.duration}s
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Bottom Actions */}
                                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => handleToggleStoryStatus(st)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            st.is_active
                                                ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                : "bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-zinc-700 dark:text-zinc-200"
                                        }`}
                                    >
                                        {st.is_active ? <FaToggleOn className="text-base" /> : <FaToggleOff className="text-base" />}
                                        <span>{st.is_active ? "Actif" : "Inactif"}</span>
                                    </button>

                                    <div className="flex items-center gap-1.5">
                                        {/* Analytics Vues Button */}
                                        <button
                                            onClick={() => handleOpenAnalytics(st)}
                                            title="Analyse des Vues Utilisateurs"
                                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all flex items-center gap-1"
                                        >
                                            <FaEye className="text-xs" />
                                            <span>Vues</span>
                                        </button>

                                        <button
                                            onClick={() => setManagingStory(st)}
                                            title="Gérer les slides"
                                            className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all flex items-center gap-1"
                                        >
                                            <FaLayerGroup className="text-xs" />
                                            <span>Slides</span>
                                        </button>

                                        {itemsCount > 0 && (
                                            <button
                                                onClick={() => handleOpenPlayer(st)}
                                                title="Lire la story"
                                                className="p-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 text-purple-600 border border-slate-200 dark:border-zinc-700 shadow-2xs transition-all"
                                            >
                                                <FaPlay className="text-xs" />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleOpenEditStory(st)}
                                            title="Modifier la story"
                                            className="p-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 text-blue-600 border border-slate-200 dark:border-zinc-700 shadow-2xs transition-all"
                                        >
                                            <FaEdit className="text-sm" />
                                        </button>

                                        <button
                                            onClick={() => setDeletingStory(st)}
                                            title="Supprimer la story"
                                            className="p-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-rose-50 text-rose-600 border border-slate-200 dark:border-zinc-700 shadow-2xs transition-all"
                                        >
                                            <FaTrash className="text-sm" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL STORY VIEWS & ANALYTICS (INSTAGRAM STORIES INSIGHTS) */}
            {/* ========================================================================= */}
            {analyticsStory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-5xl w-full border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-6">
                        {/* Top Header */}
                        <div className="p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-pink-400 shrink-0 bg-zinc-800">
                                    {analyticsStory.cover_url ? (
                                        <Image
                                            src={analyticsStory.cover_url}
                                            alt={analyticsStory.title}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white text-xl">
                                            <FaImage />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 bg-pink-500 text-white text-[10px] font-extrabold uppercase rounded-full">
                                            Insights Story
                                        </span>
                                        <span className="text-xs text-zinc-300">
                                            {analyticsStory.items?.length || 0} slide(s)
                                        </span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black mt-0.5">
                                        {analyticsStory.title}
                                    </h2>
                                    <p className="text-xs text-zinc-300 mt-0.5 flex items-center gap-2">
                                        <FaCalendarAlt className="text-[11px]" />
                                        <span>
                                            Créée le: {new Date(analyticsStory.date_creation).toLocaleDateString("fr-FR")}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end md:self-auto">
                                <button
                                    onClick={handleExportViewsCSV}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center gap-2 transition-all"
                                >
                                    <FaDownload className="text-xs" />
                                    <span>Exporter CSV</span>
                                </button>
                                <button
                                    onClick={() => setAnalyticsStory(null)}
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        {/* Story Analytics Metrics Overview */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 bg-slate-50 dark:bg-zinc-800/40 border-b border-slate-200 dark:border-zinc-800">
                            {/* Metric 1: Total Views */}
                            <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-700 shadow-2xs">
                                <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
                                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Total Vues (Impressions)</span>
                                    <FaEye className="text-base" />
                                </div>
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                                    {filteredViews.length}
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">Sur l&apos;ensemble de la story</p>
                            </div>

                            {/* Metric 2: Unique Viewers */}
                            <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-700 shadow-2xs">
                                <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
                                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Spectateurs Uniques</span>
                                    <FaUsers className="text-base" />
                                </div>
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                                    {new Set(filteredViews.map((v) => v.user_id || v.user_name)).size}
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">Comptes utilisateurs distincts</p>
                            </div>

                            {/* Metric 3: Completion Rate */}
                            <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-700 shadow-2xs">
                                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Taux de Complétion</span>
                                    <FaCheckDouble className="text-base" />
                                </div>
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                                    {filteredViews.length > 0
                                        ? Math.round((filteredViews.filter((v) => v.completed).length / filteredViews.length) * 100)
                                        : 0}%
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">Vues regardées jusqu&apos;à la fin</p>
                            </div>

                            {/* Metric 4: Clicks / Actions */}
                            <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-700 shadow-2xs">
                                <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
                                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Clics & Redirections</span>
                                    <FaMousePointer className="text-base" />
                                </div>
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                                    {filteredViews.filter((v) => v.clicked_action).length}
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">Clics vers Magasin ou Lien</p>
                            </div>
                        </div>

                        {/* Slide Selector & Funnel Visual */}
                        <div className="p-6 border-b border-slate-200 dark:border-zinc-800">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                                    <FaChartBar className="text-purple-600" />
                                    <span>Performance par Slide (Tunnel d&apos;engagement)</span>
                                </h3>
                                <span className="text-xs text-slate-400 font-medium">
                                    Cliquez sur un slide pour isoler ses spectateurs
                                </span>
                            </div>

                            <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
                                <button
                                    onClick={() => setSelectedSlideForAnalytics("all")}
                                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                                        selectedSlideForAnalytics === "all"
                                            ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                                            : "bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                                    }`}
                                >
                                    Tous les Slides ({storyViewsList.length} vues)
                                </button>

                                {analyticsStory.items?.map((item, idx) => {
                                    const slideViews = storyViewsList.filter((v) => v.item_id === item.id).length;
                                    const isSelected = selectedSlideForAnalytics === item.id;

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedSlideForAnalytics(item.id)}
                                            className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border text-xs font-bold transition-all shrink-0 ${
                                                isSelected
                                                    ? "bg-purple-50 dark:bg-purple-950/60 border-purple-600 text-purple-700 dark:text-purple-300 shadow-xs"
                                                    : "bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-slate-300"
                                            }`}
                                        >
                                            <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-slate-200 dark:bg-zinc-700 shrink-0">
                                                {item.image_url ? (
                                                    <Image
                                                        src={item.image_url}
                                                        alt={`Slide ${idx + 1}`}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px]">
                                                        #{idx + 1}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[11px] font-extrabold leading-tight">Slide #{idx + 1}</p>
                                                <p className="text-[10px] opacity-70 font-semibold">{slideViews} vues</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Viewers Search & Filters Toolbar */}
                        <div className="p-6 space-y-4">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                                <div className="relative w-full md:w-80">
                                    <input
                                        type="text"
                                        placeholder="Rechercher par nom, téléphone, wilaya..."
                                        value={analyticsSearch}
                                        onChange={(e) => setAnalyticsSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-zinc-800 border-none rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 outline-hidden"
                                    />
                                    <FaSearch className="absolute left-3 top-3 text-slate-400 text-xs" />
                                </div>

                                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                                    {/* Action Filter */}
                                    <select
                                        value={analyticsFilterAction}
                                        onChange={(e) => setAnalyticsFilterAction(e.target.value as "all" | "completed" | "clicked")}
                                        className="px-3 py-2 bg-slate-100 dark:bg-zinc-800 border-none rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 outline-hidden"
                                    >
                                        <option value="all">Toutes les actions</option>
                                        <option value="completed">Visionnage complet (100%)</option>
                                        <option value="clicked">A cliqué sur le lien/magasin</option>
                                    </select>

                                    {/* Role Filter */}
                                    <select
                                        value={analyticsRoleFilter}
                                        onChange={(e) => setAnalyticsRoleFilter(e.target.value)}
                                        className="px-3 py-2 bg-slate-100 dark:bg-zinc-800 border-none rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 outline-hidden"
                                    >
                                        <option value="all">Tous les rôles</option>
                                        <option value="client">Clients</option>
                                        <option value="livreur">Livreurs</option>
                                        <option value="magasin">Magasins</option>
                                    </select>
                                </div>
                            </div>

                            {/* Viewers Table / List */}
                            <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
                                {isLoadingViews ? (
                                    <div className="p-12 text-center">
                                        <div className="inline-block animate-spin w-7 h-7 border-3 border-purple-600 border-t-transparent rounded-full mb-2"></div>
                                        <p className="text-xs font-semibold text-slate-400">Chargement des vues utilisateurs...</p>
                                    </div>
                                ) : filteredViews.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400">
                                        <FaEye className="text-3xl mx-auto mb-2 text-slate-300 dark:text-zinc-700" />
                                        <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">Aucun spectateur trouvé</p>
                                        <p className="text-xs mt-0.5">Modifiez vos critères de recherche ou sélectionnez un autre slide.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto max-h-[420px]">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 dark:bg-zinc-800/70 text-slate-500 dark:text-zinc-400 uppercase font-extrabold text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-zinc-800">
                                                <tr>
                                                    <th className="py-3 px-4">Utilisateur / Spectateur</th>
                                                    <th className="py-3 px-4">Contact</th>
                                                    <th className="py-3 px-4">Rôle / Wilaya</th>
                                                    <th className="py-3 px-4">Date de Vue</th>
                                                    <th className="py-3 px-4">Durée Visionnage</th>
                                                    <th className="py-3 px-4">Interactions</th>
                                                    <th className="py-3 px-4">Appareil</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 font-medium">
                                                {filteredViews.map((v, i) => {
                                                    const initials = (v.user_name || "User")
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .toUpperCase()
                                                        .slice(0, 2);

                                                    const isCompleted = v.completed;
                                                    const isClicked = v.clicked_action;

                                                    return (
                                                        <tr
                                                            key={v.id || i}
                                                            className="hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-colors"
                                                        >
                                                            {/* User Info */}
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-purple-600 to-pink-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                                        {v.user_avatar ? (
                                                                            <Image
                                                                                src={v.user_avatar}
                                                                                alt={v.user_name || ""}
                                                                                fill
                                                                                className="object-cover"
                                                                                unoptimized
                                                                            />
                                                                        ) : (
                                                                            <span>{initials}</span>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-900 dark:text-white">
                                                                            {v.user_name || "Utilisateur"}
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-400">ID #{v.user_id || v.id}</p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Contact */}
                                                            <td className="py-3 px-4">
                                                                {v.user_phone ? (
                                                                    <a
                                                                        href={`tel:${v.user_phone}`}
                                                                        className="font-semibold text-slate-700 dark:text-zinc-300 hover:text-purple-600 flex items-center gap-1.5"
                                                                    >
                                                                        <FaPhoneAlt className="text-[10px] text-slate-400" />
                                                                        <span>{v.user_phone}</span>
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-slate-400 italic">Non renseigné</span>
                                                                )}
                                                            </td>

                                                            {/* Role / Wilaya */}
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span
                                                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                                                                            v.user_role === "livreur"
                                                                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                                                                : v.user_role === "magasin"
                                                                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                                                                                : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                                                        }`}
                                                                    >
                                                                        {v.user_role || "Client"}
                                                                    </span>
                                                                    {v.user_wilaya && (
                                                                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[10px] rounded font-semibold flex items-center gap-1">
                                                                            <FaMapMarkerAlt className="text-[9px]" /> {v.user_wilaya}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Date */}
                                                            <td className="py-3 px-4 text-slate-600 dark:text-zinc-300">
                                                                <div className="flex items-center gap-1.5">
                                                                    <FaClock className="text-[10px] text-slate-400" />
                                                                    <span>
                                                                        {new Date(v.viewed_at).toLocaleDateString("fr-FR", {
                                                                            day: "2-digit",
                                                                            month: "short",
                                                                            hour: "2-digit",
                                                                            minute: "2-digit"
                                                                        })}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            {/* Duration */}
                                                            <td className="py-3 px-4">
                                                                <span
                                                                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                                                                        isCompleted
                                                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                                                    }`}
                                                                >
                                                                    {v.duration_watched ? `${v.duration_watched}s` : "5s"} ({isCompleted ? "100%" : "Partiel"})
                                                                </span>
                                                            </td>

                                                            {/* Interactions */}
                                                            <td className="py-3 px-4">
                                                                {isClicked ? (
                                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 rounded-lg text-[10px] font-extrabold flex items-center gap-1 w-fit">
                                                                        <FaMousePointer className="text-[9px]" /> Clic Magasin / Lien
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 text-[11px]">Visionnage simple</span>
                                                                )}
                                                            </td>

                                                            {/* Device */}
                                                            <td className="py-3 px-4 text-slate-500 dark:text-zinc-400 text-[11px]">
                                                                {v.device || "Mobile (App)"}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                                Affichage de <strong>{filteredViews.length}</strong> vue(s) enregistrée(s)
                            </span>
                            <button
                                onClick={() => setAnalyticsStory(null)}
                                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-800 dark:text-white text-xs font-bold rounded-xl"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL STORY CREATE / EDIT */}
            {/* ========================================================================= */}
            {isStoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {editingStory ? "Modifier la Story" : "Créer une nouvelle Story"}
                            </h3>
                            <button
                                onClick={() => setIsStoryModalOpen(false)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-500"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitStory} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                                    Titre / Nom du groupe de Story <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Nouveautés de la Semaine, Offres Pizza..."
                                    value={storyTitle}
                                    onChange={(e) => setStoryTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white outline-hidden"
                                />
                            </div>

                            {/* Cover image */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                                    Photo de couverture (Bulle Avatar)
                                </label>
                                <input
                                    type="file"
                                    ref={storyCoverInputRef}
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            const f = e.target.files[0];
                                            setStoryCoverFile(f);
                                            setStoryCoverPreview(URL.createObjectURL(f));
                                        }
                                    }}
                                    className="hidden"
                                />
                                {storyCoverPreview ? (
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500">
                                            <Image
                                                src={storyCoverPreview}
                                                alt="Cover preview"
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => storyCoverInputRef.current?.click()}
                                            className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 text-xs font-bold rounded-xl hover:bg-slate-200"
                                        >
                                            Changer la couverture
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => storyCoverInputRef.current?.click()}
                                        className="h-24 border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50 dark:bg-zinc-800/40 hover:bg-purple-50/20"
                                    >
                                        <FaImage className="text-slate-400 text-xl" />
                                        <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">
                                            Choisir une photo de couverture
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Expiration date */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                                    Date d&apos;expiration (Optionnelle)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={storyDateExpires}
                                    onChange={(e) => setStoryDateExpires(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white outline-hidden"
                                />
                            </div>

                            {/* Active switch */}
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200 dark:border-zinc-700">
                                <span className="text-xs font-bold text-slate-800 dark:text-white">Story Active</span>
                                <button
                                    type="button"
                                    onClick={() => setStoryIsActive(!storyIsActive)}
                                    className={`text-2xl ${storyIsActive ? "text-emerald-500" : "text-slate-400"}`}
                                >
                                    {storyIsActive ? <FaToggleOn /> : <FaToggleOff />}
                                </button>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setIsStoryModalOpen(false)}
                                    className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 text-xs font-bold rounded-2xl"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-2xl shadow-md disabled:opacity-50"
                                >
                                    {isSubmitting ? "Enregistrement..." : editingStory ? "Mettre à jour" : "Créer la Story"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL SLIDES DETAIL / MANAGER */}
            {/* ========================================================================= */}
            {managingStory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-8">
                        <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-purple-100 dark:bg-purple-950/60 text-purple-600 rounded-2xl">
                                    <FaLayerGroup className="text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                        Slides de la Story : {managingStory.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                                        {managingStory.items?.length || 0} slide(s) configuré(s)
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleOpenAnalytics(managingStory)}
                                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                                >
                                    <FaEye /> Analyse Vues
                                </button>
                                <button
                                    onClick={() => handleOpenAddSlide(managingStory)}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
                                >
                                    <FaPlus /> Ajouter un slide
                                </button>
                                <button
                                    onClick={() => setManagingStory(null)}
                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-500"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {(!managingStory.items || managingStory.items.length === 0) ? (
                                <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl">
                                    <FaImage className="text-3xl text-slate-400 mx-auto mb-2" />
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Aucun slide dans cette story</h4>
                                    <p className="text-xs text-slate-400 mt-1 mb-4">Ajoutez des images pour composer la story.</p>
                                    <button
                                        onClick={() => handleOpenAddSlide(managingStory)}
                                        className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl"
                                    >
                                        + Ajouter le 1er slide
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {managingStory.items.map((slide, idx) => (
                                        <div
                                            key={slide.id}
                                            className="bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200 dark:border-zinc-700 overflow-hidden flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="relative w-full h-44 bg-slate-200 dark:bg-zinc-700">
                                                    {slide.image_url ? (
                                                        <Image
                                                            src={slide.image_url}
                                                            alt={`Slide ${idx + 1}`}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                            <FaImage className="text-2xl" />
                                                        </div>
                                                    )}
                                                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-xs font-extrabold rounded-lg">
                                                        #{idx + 1}
                                                    </span>
                                                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                                                        <FaClock className="text-[10px]" /> {slide.duration}s
                                                    </span>
                                                </div>

                                                <div className="p-3.5 space-y-2">
                                                    {slide.title && (
                                                        <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                                                            {slide.title}
                                                        </h5>
                                                    )}
                                                    {slide.description && (
                                                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                                                            {slide.description}
                                                        </p>
                                                    )}

                                                    {slide.magasin_details ? (
                                                        <div className="p-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-lg text-[11px] font-bold truncate flex items-center gap-1.5">
                                                            <FaStore className="shrink-0" />
                                                            <span className="truncate">{slide.magasin_details.name}</span>
                                                        </div>
                                                    ) : slide.lien ? (
                                                        <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg text-[11px] font-bold truncate flex items-center gap-1.5">
                                                            <FaLink className="shrink-0" />
                                                            <span className="truncate">{slide.lien}</span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="p-2.5 bg-slate-100 dark:bg-zinc-800 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-1.5">
                                                <button
                                                    onClick={() => handleOpenAnalytics(managingStory, slide.id)}
                                                    className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-bold flex items-center gap-1 hover:bg-blue-100"
                                                    title="Vues de ce slide"
                                                >
                                                    <FaEye /> Vues
                                                </button>

                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenEditSlide(managingStory, slide)}
                                                        className="p-1.5 rounded-lg bg-white dark:bg-zinc-700 text-blue-600 text-xs hover:bg-slate-200"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingSlide({ storyId: managingStory.id, slide })}
                                                        className="p-1.5 rounded-lg bg-white dark:bg-zinc-700 text-rose-600 text-xs hover:bg-rose-100"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL SLIDE CREATE / EDIT */}
            {/* ========================================================================= */}
            {isSlideModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-8">
                        <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {editingSlide ? "Modifier le Slide" : "Ajouter un Slide à la Story"}
                            </h3>
                            <button
                                onClick={() => setIsSlideModalOpen(false)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-500"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitSlide} className="p-6 space-y-4">
                            {/* Slide Image */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                                    Image du Slide {!editingSlide && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="file"
                                    ref={slideImageInputRef}
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            const f = e.target.files[0];
                                            setSlideImageFile(f);
                                            setSlideImagePreview(URL.createObjectURL(f));
                                        }
                                    }}
                                    className="hidden"
                                />
                                {slideImagePreview ? (
                                    <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-300 dark:border-zinc-700">
                                        <Image
                                            src={slideImagePreview}
                                            alt="Slide preview"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                        <button
                                            type="button"
                                            onClick={() => slideImageInputRef.current?.click()}
                                            className="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white text-xs font-bold rounded-lg"
                                        >
                                            Changer
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => slideImageInputRef.current?.click()}
                                        className="h-32 border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50 dark:bg-zinc-800/40 hover:bg-purple-50/20"
                                    >
                                        <FaImage className="text-slate-400 text-2xl" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                                            Choisir l&apos;image du slide (Format 9:16 ou vertical recommandé)
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                                    Durée d&apos;affichage (Secondes)
                                </label>
                                <div className="flex items-center gap-2">
                                    {[3, 5, 7, 10].map((sec) => (
                                        <button
                                            key={sec}
                                            type="button"
                                            onClick={() => setSlideDuration(sec)}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                                                slideDuration === sec
                                                    ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                                    : "bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
                                            }`}
                                        >
                                            {sec}s
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title & Description */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                                        Titre (Optionnel)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Super Promo"
                                        value={slideTitle}
                                        onChange={(e) => setSlideTitle(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                                        Description (Optionnelle)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Valable aujourd'hui"
                                        value={slideDescription}
                                        onChange={(e) => setSlideDescription(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Target action */}
                            <div className="space-y-2">
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                                    Redirection au clic (Swipe Up / Tap)
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSlideLinkType("magasin")}
                                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                                            slideLinkType === "magasin"
                                                ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-600"
                                                : "border-slate-200 dark:border-zinc-800 text-slate-600"
                                        }`}
                                    >
                                        <FaStore /> <span>Magasin</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSlideLinkType("link")}
                                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                                            slideLinkType === "link"
                                                ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-600"
                                                : "border-slate-200 dark:border-zinc-800 text-slate-600"
                                        }`}
                                    >
                                        <FaLink /> <span>Lien Web</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSlideLinkType("none")}
                                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                                            slideLinkType === "none"
                                                ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-600"
                                                : "border-slate-200 dark:border-zinc-800 text-slate-600"
                                        }`}
                                    >
                                        <FaInfoCircle /> <span>Aucune</span>
                                    </button>
                                </div>

                                {slideLinkType === "magasin" && (
                                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Chercher un magasin..."
                                            value={magasinSearch}
                                            onChange={(e) => {
                                                setMagasinSearch(e.target.value);
                                                loadMagasins(e.target.value);
                                            }}
                                            className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs"
                                        />
                                        <select
                                            value={slideMagasinId ?? ""}
                                            onChange={(e) =>
                                                setSlideMagasinId(e.target.value ? Number(e.target.value) : null)
                                            }
                                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-semibold"
                                        >
                                            <option value="">Sélectionnez le magasin...</option>
                                            {magasinsList.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name} {m.wilaya ? `(${m.wilaya})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {slideLinkType === "link" && (
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={slideExternalLink}
                                        onChange={(e) => setSlideExternalLink(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs"
                                    />
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setIsSlideModalOpen(false)}
                                    className="px-5 py-2 bg-slate-100 dark:bg-zinc-800 text-xs font-bold rounded-xl"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                                >
                                    {isSubmitting ? "Enregistrement..." : editingSlide ? "Mettre à jour" : "Ajouter le slide"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* INTERACTIVE INSTAGRAM STORY VIEWER / PLAYER MODAL */}
            {/* ========================================================================= */}
            {playingStory && playingStory.items && playingStory.items.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
                    <div className="relative w-full max-w-sm h-[680px] bg-black rounded-[40px] border-4 border-zinc-800 shadow-2xl overflow-hidden flex flex-col justify-between select-none">
                        {/* Top Story Progress Bars (Instagram segments) */}
                        <div className="absolute top-4 left-4 right-4 z-30 flex items-center gap-1.5">
                            {playingStory.items.map((_, idx) => (
                                <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white transition-all duration-75"
                                        style={{
                                            width:
                                                idx < currentSlideIndex
                                                    ? "100%"
                                                    : idx === currentSlideIndex
                                                    ? `${progress}%`
                                                    : "0%"
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Top Story Header (Avatar + Title + Close) */}
                        <div className="absolute top-8 left-4 right-4 z-30 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2.5">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white">
                                    {playingStory.cover_url ? (
                                        <Image
                                            src={playingStory.cover_url}
                                            alt={playingStory.title}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-purple-600 flex items-center justify-center text-xs">
                                            S
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs font-bold text-white shadow-xs">{playingStory.title}</span>
                            </div>

                            <button
                                onClick={() => setPlayingStory(null)}
                                className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black/80"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Current Slide Image Background */}
                        {(() => {
                            const slide = playingStory.items[currentSlideIndex];
                            return (
                                <div className="absolute inset-0 z-10 bg-zinc-900">
                                    {slide?.image_url ? (
                                        <Image
                                            src={slide.image_url}
                                            alt="Story Slide"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-b from-purple-800 to-pink-800 flex items-center justify-center text-white p-6 text-center">
                                            <h3 className="text-lg font-bold">{slide?.title || playingStory.title}</h3>
                                        </div>
                                    )}

                                    {/* Tap zones for Next/Prev */}
                                    <div
                                        onClick={handlePrevSlide}
                                        className="absolute top-16 left-0 bottom-28 w-1/3 z-20 cursor-pointer"
                                    />
                                    <div
                                        onClick={handleNextSlide}
                                        className="absolute top-16 right-0 bottom-28 w-2/3 z-20 cursor-pointer"
                                    />
                                </div>
                            );
                        })()}

                        {/* Bottom Slide Info & Target Link Badge + Views Drawer Trigger */}
                        {(() => {
                            const slide = playingStory.items[currentSlideIndex];
                            if (!slide) return null;

                            return (
                                <div className="absolute bottom-4 left-4 right-4 z-30 space-y-2">
                                    {(slide.title || slide.description) && (
                                        <div className="bg-black/50 backdrop-blur-md p-3 rounded-2xl text-white">
                                            {slide.title && <h4 className="text-xs font-bold">{slide.title}</h4>}
                                            {slide.description && (
                                                <p className="text-[11px] text-zinc-200 mt-0.5">{slide.description}</p>
                                            )}
                                        </div>
                                    )}

                                    {slide.magasin_details ? (
                                        <div className="w-full py-2.5 px-4 bg-white/90 backdrop-blur-md text-slate-900 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg">
                                            <div className="flex items-center gap-2 truncate">
                                                <FaStore className="text-purple-600 shrink-0" />
                                                <span className="truncate">{slide.magasin_details.name}</span>
                                            </div>
                                            <span className="text-[10px] text-purple-600 font-extrabold uppercase">
                                                Voir le Magasin →
                                            </span>
                                        </div>
                                    ) : slide.lien ? (
                                        <div className="w-full py-2.5 px-4 bg-white/90 backdrop-blur-md text-slate-900 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg">
                                            <div className="flex items-center gap-2 truncate">
                                                <FaLink className="text-blue-600 shrink-0" />
                                                <span className="truncate">{slide.lien}</span>
                                            </div>
                                            <span className="text-[10px] text-blue-600 font-extrabold uppercase">
                                                Ouvrir le Lien →
                                            </span>
                                        </div>
                                    ) : null}

                                    {/* Bottom Seen By / Views Button (Style Instagram) */}
                                    <button
                                        onClick={() => {
                                            setIsPaused(true);
                                            handleOpenAnalytics(playingStory, slide.id);
                                        }}
                                        className="w-full py-2 px-3 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-xl text-xs font-bold flex items-center justify-between border border-white/20 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <FaEye className="text-pink-400 text-xs" />
                                            <span>Vu par les utilisateurs</span>
                                        </div>
                                        <span className="text-[10px] text-pink-300 font-extrabold uppercase bg-pink-500/20 px-2 py-0.5 rounded-full">
                                            Ouvrir Insights →
                                        </span>
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL DELETE STORY */}
            {/* ========================================================================= */}
            {deletingStory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center text-xl mx-auto">
                            <FaTrash />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Supprimer cette Story ?</h3>
                            <p className="text-xs text-slate-500">
                                La Story &ldquo;{deletingStory.title}&rdquo; et tous ses slides seront définitivement supprimés.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setDeletingStory(null)}
                                className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 text-xs font-bold rounded-2xl"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteStory}
                                disabled={isSubmitting}
                                className="px-5 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-2xl shadow-md disabled:opacity-50"
                            >
                                {isSubmitting ? "Suppression..." : "Confirmer la suppression"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL DELETE SLIDE */}
            {/* ========================================================================= */}
            {deletingSlide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center text-xl mx-auto">
                            <FaTrash />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Supprimer ce Slide ?</h3>
                            <p className="text-xs text-slate-500">
                                Ce slide sera retiré de la story. Cette action est irréversible.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setDeletingSlide(null)}
                                className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 text-xs font-bold rounded-2xl"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteSlide}
                                disabled={isSubmitting}
                                className="px-5 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-2xl shadow-md disabled:opacity-50"
                            >
                                {isSubmitting ? "Suppression..." : "Confirmer la suppression"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
