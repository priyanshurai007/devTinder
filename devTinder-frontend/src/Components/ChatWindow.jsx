import { useEffect, useState, useRef } from "react";
import axios from "../utils/axiosInstance";
import { BASE_URL } from "../utils/constants";
import { socket, connectSocket } from "../utils/socket";
import { useSelector } from "react-redux";

const ChatWindow = ({ room: propRoom, selectedUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [room, setRoom] = useState(propRoom || null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPrev, setLoadingPrev] = useState(false);

  const userSlice = useSelector((s) => s.user);
  const currentUser = userSlice?.user || userSlice || {};
  const userId = currentUser?._id || null;

  const bottomRef = useRef(null);

  // Create/get room when selectedUser is provided
  useEffect(() => {
    if (propRoom) {
      setRoom(propRoom);
      return;
    }
    if (!selectedUser?._id) return;

    let mounted = true;
    (async () => {
      try {
        const res = await axios.post(
          `${BASE_URL}/chat/room`,
          { participantId: selectedUser._id },
          { withCredentials: true }
        );
        if (mounted) setRoom(res.data.room);
      } catch (err) {
        console.error("Error creating/getting room:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedUser, propRoom]);

  // Load messages
  useEffect(() => {
    if (!room?._id) return;
    // Reset pagination when room changes
    setPage(1);
    setHasMore(true);
    let mounted = true;
    (async () => {
      try {
        const limit = 50;
        const res = await axios.get(
          `${BASE_URL}/chat/messages/${room._id}?page=1&limit=${limit}`,
          { withCredentials: true }
        );
        if (mounted) setMessages(res.data.messages || []);
        // if fewer than limit, no older messages
        if (mounted && Array.isArray(res.data.messages) && res.data.messages.length < limit) {
          setHasMore(false);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [room]);

  // Socket join + receive
  useEffect(() => {
    if (!room?._id) return;

    // Ensure socket is connected before joining so the server receives the join
    try {
      connectSocket();
    } catch (e) {}

    const doJoin = () => {
      try {
        socket.emit("joinRoom", room._id);
      } catch (e) {}
    };

    if (socket.connected) {
      doJoin();
    } else {
      const onConnect = () => {
        doJoin();
        socket.off('connect', onConnect);
      };
      socket.on('connect', onConnect);
    }

    // handler for incoming messages
    const handler = (msg) => {
      // Normalize chatRoom id from message for safe comparison
      const idFromMsgRaw = msg?.chatRoomId || msg?.roomId || msg?.room;
      const idFromMsg = idFromMsgRaw && (idFromMsgRaw._id ? idFromMsgRaw._id : idFromMsgRaw);
      if (!idFromMsg || String(idFromMsg) !== String(room._id)) return;

      setMessages((prev) => {
        // avoid duplicates when server echoes messages we optimistically added
        if (msg._id && prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    // handle saved ack for optimistic messages from self
    const savedHandler = ({ tempId, message: savedMessage }) => {
      if (!savedMessage || (savedMessage.chatRoomId && savedMessage.chatRoomId.toString() !== room._id)) return;
      setMessages((prev) => {
        // replace optimistic message (tempId) with savedMessage
        let replaced = false;
        const next = prev.map((m) => {
          if (m._id === tempId) {
            replaced = true;
            return savedMessage;
          }
          return m;
        });
        if (replaced) return next;
        // if temp not found, append savedMessage
        return [...prev, savedMessage];
      });
    };
    socket.on("receiveMessage", handler);
    socket.on('messageSaved', savedHandler);

    // joined ack for debugging (server emits when join succeeds)
    const joinedHandler = (joinedRoomId) => {
      if (String(joinedRoomId) === String(room._id)) {
        console.log(`joinedRoom confirmed for ${room._id}`);
      }
    };
    socket.on('joinedRoom', joinedHandler);

    // debug connection events
    const onConnectErr = (err) => console.warn('socket connect_error', err);
    const onDisconnect = (reason) => console.log('socket disconnected', reason);
    socket.on('connect_error', onConnectErr);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off("receiveMessage", handler);
      socket.off('messageSaved', savedHandler);
      socket.off('joinedRoom', joinedHandler);
      socket.off('connect_error', onConnectErr);
      socket.off('disconnect', onDisconnect);
      try {
        socket.emit("leaveRoom", room._id);
      } catch (e) {}
    };
  }, [room]);

  // Scroll bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!inputMsg.trim() || !room || !userId) return;

    const text = inputMsg.trim();
    const tempId = `local_${Date.now()}`;
    const payload = { roomId: room._id, senderId: userId, message: text, tempId };

    socket.emit("sendMessage", payload);

    // optimistic update (use tempId as _id so we can replace it later)
    setMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        message: text,
        senderId: userId,
        createdAt: new Date().toISOString(),
        chatRoomId: room._id,
      },
    ]);
    setInputMsg("");
  };

  if (!room && !selectedUser) return null;

  const headerName =
    (selectedUser &&
      `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim()) ||
    room?.name ||
    "Chat";

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[400px] bg-base-200 shadow-lg rounded-lg flex flex-col">
      {/* Header */}
      <div className="flex justify-between p-3 rounded-t-lg bg-primary text-primary-content">
        <span className="font-medium">{`Chat — ${headerName}`}</span>
        <button onClick={onClose} className="text-white hover:text-gray-300">
          ✖
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {room?._id ? (
          <>
            {hasMore && (
              <div className="flex justify-center mb-2">
                <button className="btn btn-sm btn-outline" disabled={loadingPrev} onClick={async () => {
                  if (!hasMore || loadingPrev) return;
                  setLoadingPrev(true);
                  try {
                    const nextPage = page + 1;
                    const limit = 50;
                    const res = await axios.get(`${BASE_URL}/chat/messages/${room._id}?page=${nextPage}&limit=${limit}`, { withCredentials: true });
                    const older = res.data.messages || [];
                    if (older.length === 0) {
                      setHasMore(false);
                    } else {
                      setMessages((prev) => [...older, ...prev]);
                      setPage(nextPage);
                      if (older.length < limit) setHasMore(false);
                    }
                  } catch (e) {
                    console.error('Failed to load previous messages', e);
                  } finally {
                    setLoadingPrev(false);
                  }
                }}>Load previous</button>
              </div>
            )}

            {messages.map((m) => {
              // normalize sender id for comparison
              const senderId = m?.senderId?._id || m?.senderId || m?.sender || null;
              const mine = String(senderId) === String(userId);

              const time = new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const senderLabel = mine ? "You" : headerName;

              return (
                <div key={m._id} className={`chat ${mine ? "chat-end" : "chat-start"}`}>
                  <div className="mb-1 text-xs chat-header opacity-70">
                    {senderLabel}
                    <time className="ml-2 text-[10px] opacity-60">{time}</time>
                  </div>
                  <div className={`chat-bubble ${mine ? "bg-primary text-primary-content" : "bg-base-300 text-base-content"}`}>
                    {m.message}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <p className="text-sm text-gray-400">Creating chat room...</p>
        )}
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
