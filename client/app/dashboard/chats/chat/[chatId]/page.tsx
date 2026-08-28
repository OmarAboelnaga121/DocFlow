"use client";

import { useParams } from "next/navigation";

export default function ChatPage() {
    const { chatId } = useParams();
    
    return (
        <div>
            <h1>Chat: {chatId}</h1>
        </div>
    );
}