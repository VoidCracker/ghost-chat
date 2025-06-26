import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Settings, LogOut } from "lucide-react";

export default function ChatHeader() {
  const { user, logoutMutation } = useAuth();
  const { currentRoom, rooms, userCount, switchRoom, isConnected } = useChat();

  const handleRoomChange = (roomId: string) => {
    switchRoom(parseInt(roomId));
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-slate-800 border-b border-slate-700 p-4 flex-shrink-0">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white flex items-center gap-2">
              {currentRoom?.name || "Chat"}
              {!isConnected && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </h1>
            <p className="text-sm text-gray-400">
              {isConnected ? (
                `${userCount} user${userCount !== 1 ? 's' : ''} online`
              ) : (
                'Connecting...'
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={currentRoom?.id.toString() || "1"} onValueChange={handleRoomChange}>
            <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Room" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {rooms && rooms.length > 0 ? rooms.map((room) => (
                <SelectItem key={room.id} value={room.id.toString()} className="text-white hover:bg-slate-600">
                  {room.name}
                </SelectItem>
              )) : (
                <>
                  <SelectItem value="1" className="text-white hover:bg-slate-600">General</SelectItem>
                  <SelectItem value="2" className="text-white hover:bg-slate-600">Random</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-slate-700"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
