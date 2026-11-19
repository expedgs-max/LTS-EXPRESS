"use client";

import React, { useEffect, useState } from 'react';
import {
    FaChevronLeft,
    FaChevronRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import LoadingFirst from '../loading';

type Props = {
    currentPage: number;
    pages: number;
    params?: string;
    className?: string;
};

export default function Pagination({ currentPage, pages, params = "", className }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= pages && page !== currentPage) {
            const cleanParams = params ? (params.startsWith("&") ? params : `&${params}`) : "";
            router.push(`?page=${page}${cleanParams}`);
            setIsLoading(true);
        }
    };

    useEffect(() => {
        setIsLoading(false);
    }, [currentPage]);

    if (!pages || pages <= 1) {
        return null;
    }

    const generatePageNumbers = (): (number | string)[] => {
        const pageNumbers: (number | string)[] = [];
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(pages, currentPage + 2);

        if (startPage > 1) {
            pageNumbers.push(1);
            if (startPage > 2) pageNumbers.push("...");
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < pages) {
            if (endPage < pages - 1) pageNumbers.push("...");
            pageNumbers.push(pages);
        }

        return pageNumbers;
    };

    const pageNumbers = generatePageNumbers();

    return (
        <div className={className || "w-full max-w-7xl mx-auto px-4 sm:px-10 py-6"}>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Page Status / Indicator */}
                <div className="text-xs sm:text-sm text-slate-500 font-medium">
                    Page <strong className="text-slate-900 font-bold">{currentPage}</strong> sur{" "}
                    <strong className="text-slate-900 font-bold">{pages}</strong>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {/* First Page */}
                    {pages > 4 && currentPage > 2 && (
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            title="Première page"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 text-slate-600 transition-all border border-slate-200 text-xs"
                        >
                            <FaAngleDoubleLeft />
                        </button>
                    )}

                    {/* Previous Page */}
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        title="Page précédente"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 text-slate-600 transition-all border border-slate-200 text-xs"
                    >
                        <FaChevronLeft />
                    </button>

                    {/* Page Numbers */}
                    {pageNumbers.map((num, index) => {
                        if (num === "...") {
                            return (
                                <span
                                    key={`ellipsis-${index}`}
                                    className="w-8 h-9 flex items-center justify-center text-slate-400 font-bold select-none text-xs"
                                >
                                    ...
                                </span>
                            );
                        }

                        const pageNum = Number(num);
                        const isActive = pageNum === currentPage;

                        return (
                            <button
                                key={`page-${pageNum}`}
                                onClick={() => handlePageChange(pageNum)}
                                className={`min-w-[36px] h-9 px-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center shadow-sm ${
                                    isActive
                                        ? "bg-blue-600 text-white shadow-blue-500/30 scale-105"
                                        : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                {num}
                            </button>
                        );
                    })}

                    {/* Next Page */}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pages}
                        title="Page suivante"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 text-slate-600 transition-all border border-slate-200 text-xs"
                    >
                        <FaChevronRight />
                    </button>

                    {/* Last Page */}
                    {pages > 4 && currentPage < pages - 1 && (
                        <button
                            onClick={() => handlePageChange(pages)}
                            disabled={currentPage === pages}
                            title="Dernière page"
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 text-slate-600 transition-all border border-slate-200 text-xs"
                        >
                            <FaAngleDoubleRight />
                        </button>
                    )}
                </div>
            </div>

            {isLoading && <LoadingFirst />}
        </div>
    );
}

