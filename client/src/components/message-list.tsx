import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/use-chat";
import MessageItem from "./message-item";
import { Loader2 } from "lucide-react";

export default function MessageList() {
  const { messages, isLoading, typingUsers, replyPreview, cancelReply } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900" ref={containerRef}>
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Reply Preview */}
        {replyPreview && (
          <div className="bg-slate-800/50 rounded-lg p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Replying to</span>
                <span className="text-sm font-medium text-white">
                  {replyPreview.user.username}
                </span>
              </div>
              <button
                onClick={cancelReply}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-300 mt-1 truncate">
              {replyPreview.content}
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
            <span className="text-sm text-gray-400">
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
