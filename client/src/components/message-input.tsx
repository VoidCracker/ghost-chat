import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Smile, PlusCircle } from "lucide-react";
import Picker from 'emoji-picker-react';

export default function MessageInput() {
  const { user } = useAuth();
  const { sendMessage, replyPreview, sendTypingStatus, isConnected } = useChat();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiClick = (event: React.MouseEvent<Element, MouseEvent>, emojiObject: any) => {
    console.log('Emoji selected:', emojiObject.emoji);
    setMessage(prev => prev + emojiObject.emoji);
  };

  const toggleEmojiPicker = () => {
    console.log('Emoji picker toggle clicked');
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && user) {
      sendMessage(message.trim(), replyPreview?.id);
      setMessage("");
      setIsTyping(false);
      sendTypingStatus(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + "px";
    }

    // Handle typing status
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      sendTypingStatus(true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      sendTypingStatus(false);
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTypingStatus(false);
      }, 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-slate-800 border-t border-slate-700 p-4 flex-shrink-0">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            {showEmojiPicker && <Picker onEmojiClick={handleEmojiClick} pickerStyle={{ position: 'absolute', bottom: '60px', right: '0', zIndex: 1000 }} />}
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? "Type a message... (Enter to send, Shift+Enter for new line)" : "Connecting to chat..."}
              className="min-h-[48px] max-h-32 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 resize-none pr-12"
              rows={1}
            />
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 bottom-2 w-8 h-8 text-gray-400 hover:text-white"
            >
              <Smile className="w-4 h-4" onClick={toggleEmojiPicker} />
            </Button>
          </div>
          
          <Button
            type="submit"
            disabled={!message.trim() || !isConnected}
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
