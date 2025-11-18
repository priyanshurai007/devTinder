import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import { BASE_URL } from "../utils/constants";
import { useSelector } from "react-redux"; // added

const ChatList = ({ onSelectRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // support two possible shapes: state.user could be the user object or { user: user }
  const me = useSelector((state) => state.user?._id || state.user?.user?._id);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(BASE_URL + "/chat/rooms", {
          withCredentials: true,
        });
        setRooms(res.data.rooms || []);
      } catch (err) {
        console.error("Failed to load chat rooms:", err);
        setError("Failed to load chats");
      } finally {
        setLoading(false);
      }
    };

    if (me) fetchRooms();
  }, [me]);

  const getMemberId = (m) => (m && (m._id || m)) || null;
  const getMemberName = (m) =>
    m ? `${m.firstName || ""} ${m.lastName || ""}`.trim() : "Unknown";
  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="w-64 overflow-y-auto border-r border-base-300 bg-base-100">
      {loading && <div className="p-4 text-sm text-muted">Loading chats...</div>}
      {error && <div className="p-4 text-sm text-error">{error}</div>}
      {!loading && rooms.length === 0 && !error && (
        <div className="p-4 text-sm text-muted">No chats yet</div>
      )}

      {rooms.map((roomItem) => {
        // support backend returning either room objects or { room, lastMessage }
        const room = roomItem.room || roomItem;
        const lastMessage = roomItem.lastMessage || null;
        // support members as objects or ids
        const members = Array.isArray(room.members) ? room.members : [];
        const other = members.find((m) => getMemberId(m) !== me) || members[0] || {};
        const avatar = other.photoURL || null;
        const name = getMemberName(other);
        const lastText = lastMessage?.text || lastMessage?.message || "";
        const lastTime = lastMessage?.createdAt || room.updatedAt || "";

        return (
          <button
            key={room._id}
            className="flex items-center w-full gap-3 p-3 text-left hover:bg-base-200"
            onClick={() => onSelectRoom(room)}
            aria-label={`Open chat with ${name}`}
          >
            <div className="flex-none">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="object-cover w-10 h-10 rounded-full"
                />
              ) : (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-content">
                  {name ? name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="font-medium truncate">{name}</div>
                <div className="ml-2 text-xs text-muted">
                  {formatTime(lastTime)}
                </div>
              </div>
              <div className="text-sm truncate text-muted">
                {lastText || "Say hi 👋"}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ChatList;
