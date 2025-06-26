import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Copy, Reply, Trash2, Check } from "lucide-react";
import { type MessageWithUser } from "@shared/schema";

interface MessageItemProps {
  message: MessageWithUser;
}

export default function MessageItem({ message }: MessageItemProps) {
  const { user } = useAuth();
  const { deleteMessage, setReplyPreview } = useChat();
  const [showActions, setShowActions] = useState(false);
  const [isSwipedRight, setIsSwipedRight] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Add safety check for message and message.user
  if (!message || !message.user) {
    return null;
  }

  const isOwnMessage = user?.id === message.userId;
  const timestamp = new Date(message.createdAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  const handleReplyToMessage = () => {
    setReplyPreview(message);
  };

  const handleDeleteMessage = () => {
    if (isOwnMessage) {
      deleteMessage(message.id);
    }
  };

  // Touch handlers for swipe-to-reply
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isOwnMessage) {
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isOwnMessage) {
      touchEndX.current = e.touches[0].clientX;
      const swipeDistance = touchEndX.current - touchStartX.current;
      
      if (swipeDistance > 0 && swipeDistance < 100) {
        setIsSwipedRight(true);
        if (messageRef.current) {
          messageRef.current.style.transform = `translateX(${Math.min(swipeDistance, 80)}px)`;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isOwnMessage) {
      const swipeDistance = touchEndX.current - touchStartX.current;
      
      if (swipeDistance > 50) {
        handleReplyToMessage();
      }
      
      setIsSwipedRight(false);
      if (messageRef.current) {
        messageRef.current.style.transform = "translateX(0)";
      }
      
      touchStartX.current = 0;
      touchEndX.current = 0;
    }
  };

  const getUserInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <div
      ref={messageRef}
      className={`message-container flex items-start space-x-3 group transition-transform duration-200 ${
        isOwnMessage ? "flex-row-reverse space-x-reverse" : ""
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isOwnMessage
            ? "bg-gradient-to-r from-blue-500 to-purple-600"
            : "bg-gradient-to-r from-gray-500 to-gray-600"
        }`}
      >
        <span className="text-xs font-medium text-white">
          {getUserInitial(message.user.username)}
        </span>
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-xs lg:max-w-md ${isOwnMessage ? "flex flex-col items-end" : ""}`}>
        {/* Reply Reference */}
        {message.replyTo && (
          <div className="bg-slate-800/50 rounded-lg p-2 mb-2 border-l-2 border-blue-500">
            <div className="flex items-center space-x-2">
              <Reply className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-gray-400">Replying to</span>
              <span className="text-xs font-medium text-white">
                {message.replyTo.user.username}
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1 truncate">
              {message.replyTo.content}
            </p>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 relative ${
            isOwnMessage
              ? "bg-gradient-to-r from-blue-500 to-purple-600 rounded-br-sm"
              : "bg-gradient-to-r from-gray-600 to-gray-700 rounded-bl-sm"
          }`}
        >
          <p className="text-white text-sm break-words">{message.content}</p>
          
          {/* Message Tail */}
          <div
            className={`absolute -bottom-1 w-0 h-0 ${
              isOwnMessage
                ? "-right-2 border-l-8 border-l-blue-500 border-t-8 border-t-transparent"
                : "-left-2 border-r-8 border-r-gray-600 border-t-8 border-t-transparent"
            }`}
          />
        </div>

        {/* Message Info */}
        <div className={`flex items-center justify-between mt-1 w-full ${isOwnMessage ? "flex-row-reverse" : ""}`}>
          <span className="text-xs text-gray-400">
            {isOwnMessage ? "You" : message.user.username}
          </span>
          <span className="text-xs text-gray-500">{timestamp}</span>
        </div>
      </div>

      {/* Message Actions */}
      {(showActions || showCopySuccess) && (
        <div className={`flex items-center space-x-2 ${isOwnMessage ? "mr-2" : "ml-2"}`}>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 bg-slate-800/80 hover:bg-slate-700 rounded-full"
            onClick={handleCopyMessage}
          >
            {showCopySuccess ? (
              <Check className="w-3 h-3 text-green-400" />
            ) : (
              <Copy className="w-3 h-3 text-gray-300" />
            )}
          </Button>
          
          {!isOwnMessage && (
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 bg-slate-800/80 hover:bg-slate-700 rounded-full"
              onClick={handleReplyToMessage}
            >
              <Reply className="w-3 h-3 text-gray-300" />
            </Button>
          )}
          
          {isOwnMessage && (
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 rounded-full"
              onClick={handleDeleteMessage}
            >
              <Trash2 className="w-3 h-3 text-red-400" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
