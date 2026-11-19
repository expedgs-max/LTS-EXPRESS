"use server"
import { cookies } from 'next/headers';




export default async function commandeSocket() {
    const access = (await cookies()).get("access_token")?.value

    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_WS_SERVER}/ws/commandes/magasin/?token=${access}`);

    return socket
}