import { useState } from "react";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";

const ChatPage = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);

  return (
    <div className="pt-20 flex h-[calc(100vh-5rem)]">
      <ChatList onSelectRoom={setSelectedRoom} />

      <div className="flex items-center justify-center flex-1 bg-base-100">
        {selectedRoom ? (
          <ChatWindow room={selectedRoom} onClose={() => setSelectedRoom(null)} />
        ) : (
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold">Select a chat</h2>
            <p className="text-sm text-muted">Choose a conversation from the list to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
