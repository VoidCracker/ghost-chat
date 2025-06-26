import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import ChatHeader from "@/components/chat-header";
import MessageList from "@/components/message-list";
import MessageInput from "@/components/message-input";

export default function ChatPage() {
  const { user } = useAuth();
  const { connect, isConnected } = useChat();

  // Connect only once when user is available and not already connected
  useEffect(() => {
    if (user && !isConnected) {
      connect(user.id, user.username);
    }
  }, [user?.id, user?.username, isConnected, connect]);

  if (!user) {
    return (
      <div className="h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen aurora-bg text-white flex flex-col">
      <ChatHeader />
      <MessageList />
      <MessageInput />
    </div>
  );
}
