import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { socket } from "../utils/socket";
import { useSelector } from "react-redux";

const ChatWindow = ({ selectedUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [room, setRoom] = useState(null);
  const user = useSelector((s) => s.user);
  const bottomRef = useRef(null);

  // Create/Get Room when user opens chat
  useEffect(() => {
    if (!selectedUser?._id) return;
    (async () => {
      try {
        const res = await axios.post(
          `${BASE_URL}/chat/room`,
          { participantId: selectedUser._id },
          { withCredentials: true }
        );
        setRoom(res.data.room);
      } catch (err) {
        console.error("Error creating/getting room:", err);
      }
    })();
  }, [selectedUser]);

  // Load messages once room is ready
  useEffect(() => {
    if (!room?._id) return;
    (async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/chat/messages/${room._id}?limit=50`,
          { withCredentials: true }
        );
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    })();
  }, [room]);

  // Join socket room
  useEffect(() => {
    if (!room?._id) return;

    socket.emit("joinRoom", room._id);

    const handler = (msg) => {
      if (msg.chatRoomId === room._id) {
        setMessages((m) => [...m, msg]);
      }
    };

    socket.on("receiveMessage", handler);
    return () => {
      socket.off("receiveMessage", handler);
    };
  }, [room]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!inputMsg.trim() || !room) return;
    socket.emit("sendMessage", {
      roomId: room._id,
      senderId: user._id,
      message: inputMsg.trim(),
    });
    setInputMsg("");
  };

  if (!selectedUser) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[400px] bg-base-200 shadow-lg rounded-lg flex flex-col">
      {/* Header */}
      <div className="flex justify-between p-3 rounded-t-lg bg-primary text-primary-content">
        <span>Chat with {selectedUser.firstName}</span>
        <button onClick={onClose} className="text-white hover:text-gray-300">
          ✖
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {messages.map((m) => {
          const mine = m.senderId === user._id || m.senderId?._id === user._id;
          return (
            <div
              key={m._id}
              className={`max-w-xs p-2 rounded ${
                mine
                  ? "ml-auto bg-secondary text-secondary-content"
                  : "mr-auto bg-base-300"
              }`}
            >
              {m.message}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-base-300">
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          className="flex-1 input input-bordered"
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="btn btn-primary" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
