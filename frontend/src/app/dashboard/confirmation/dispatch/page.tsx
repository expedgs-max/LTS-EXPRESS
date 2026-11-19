import React from "react";
import { Metadata } from "next";
import { cookies } from "next/headers";
import ConfirmationDispatch from "@/components/confirmation_app/confirmation_dispatch";

export const metadata: Metadata = {
    title: "Live Dispatch & Carte Livreurs - Confirmation",
    description: "Monitoring en direct des commandes et localisation GPS des livreurs",
};

type Props = {
    searchParams: Promise<{
        wilaya?: string;
    }>;
};

export default async function ConfirmationDispatchPage({ searchParams }: Props) {
    const { wilaya } = await searchParams;
    const selectedWilaya = wilaya ?? "";

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value || "";

    return (
        <div className="w-full h-full">
            <ConfirmationDispatch
                token={token}
                initialWilaya={selectedWilaya}
            />
        </div>
    );
}
