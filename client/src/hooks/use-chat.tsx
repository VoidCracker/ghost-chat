import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Room, type MessageWithUser } from "@shared/schema";

interface ChatContextType {
  // Connection
  isConnected: boolean;
  connect: (userId: number, username: string) => void;
  disconnect: () => void;

  // Rooms
  rooms: Room[];
  currentRoom: Room | null;
  switchRoom: (roomId: number) => void;
  userCount: number;

  // Messages
  messages: MessageWithUser[];
  isLoading: boolean;
  sendMessage: (content: string, replyToId?: number) => void;
  deleteMessage: (messageId: number) => void;

  // Reply
  replyPreview: MessageWithUser | null;
  setReplyPreview: (message: MessageWithUser | null) => void;
  cancelReply: () => void;

  // Typing
  typingUsers: string[];
  sendTypingStatus: (isTyping: boolean) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(1);
  const [userCount, setUserCount] = useState(0);
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [replyPreview, setReplyPreview] = useState<MessageWithUser | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const isConnectingRef = useRef(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch rooms - simple query without dependencies
  const { data: rooms = [] } = useQuery({
    queryKey: ["/api/rooms"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const additionalRooms = [
    { id: 2, name: 'Photography' },
    { id: 3, name: 'Travel' },
    { id: 4, name: 'Food' }
  ];
  const currentRoom = [...rooms, ...additionalRooms].find(room => room.id === currentRoomId) || null;

  // Fetch messages for current room
  const { data: roomMessages, isLoading } = useQuery({
    queryKey: ["/api/rooms", currentRoomId, "messages"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!currentRoomId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Update messages when room messages change
  useEffect(() => {
    if (roomMessages && Array.isArray(roomMessages)) {
      setMessages(roomMessages);
    }
  }, [roomMessages]);

  const connect = useCallback((userId: number, username: string) => {
    // Prevent multiple connection attempts
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    isConnectingRef.current = true;

    // Close any existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      isConnectingRef.current = false;

      // Authenticate and join room
      ws.send(JSON.stringify({
        type: 'auth',
        userId,
        username,
        roomId: currentRoomId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'authSuccess':
            console.log('WebSocket authentication successful');
            break;

          case 'newMessage':
            if (data.message.roomId === currentRoomId) {
              setMessages(prev => {
                // Prevent duplicate messages
                const exists = prev.some(msg => msg.id === data.message.id);
                if (exists) return prev;
                return [...prev, data.message];
              });
            }
            break;

          case 'userCount':
            setUserCount(data.count);
            break;

          case 'typing':
            setTypingUsers(prev => {
              const filtered = prev.filter(u => u !== data.username);
              return data.isTyping ? [...filtered, data.username] : filtered;
            });
            break;

          case 'error':
            console.error('WebSocket error:', data.message);
            toast({
              title: "Error",
              description: data.message,
              variant: "destructive",
            });
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      isConnectingRef.current = false;
      wsRef.current = null;
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      isConnectingRef.current = false;
      toast({
        title: "Connection Error",
        description: "Failed to connect to chat server",
        variant: "destructive",
      });
    };
  }, [currentRoomId, toast]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    isConnectingRef.current = false;
  }, []);

  const sendMessage = useCallback((content: string, replyToId?: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content,
        replyToId
      }));
      setReplyPreview(null);
    }
  }, []);

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest("DELETE", `/api/messages/${messageId}`);
    },
    onSuccess: (_, messageId) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMessage = useCallback((messageId: number) => {
    deleteMessageMutation.mutate(messageId);
  }, [deleteMessageMutation]);

  const switchRoom = useCallback((roomId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'joinRoom',
        roomId
      }));
    }
    setCurrentRoomId(roomId);
    setMessages([]);
    setReplyPreview(null);
    setTypingUsers([]);

    // Invalidate and refetch messages for new room
    queryClient.invalidateQueries({ 
      queryKey: ["/api/rooms", roomId, "messages"] 
    });
  }, [queryClient]);

  const cancelReply = useCallback(() => {
    setReplyPreview(null);
  }, []);

  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        isTyping
      }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isConnected,
        connect,
        disconnect,
        rooms,
        currentRoom,
        switchRoom,
        userCount,
        messages,
        isLoading,
        sendMessage,
        deleteMessage,
        replyPreview,
        setReplyPreview,
        cancelReply,
        typingUsers,
        sendTypingStatus,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

export function useChatProvider() {
  return useContext(ChatContext);
}