import { useState } from "react";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";

const ChatPage = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);

  return (
    <div className="pt-20 flex h-[calc(100vh-5rem)]">
      <ChatList onSelectRoom={setSelectedRoom} />
      <ChatWindow room={selectedRoom} />
    </div>
  );
};

export default ChatPage;
