import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useSelector } from "react-redux"; // added

const ChatList = ({ onSelectRoom }) => {
  const [rooms, setRooms] = useState([]);
  const me = useSelector((state) => state.user?.user?._id); // get user id from Redux

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(BASE_URL + "/chat/rooms", {
          withCredentials: true,
        });
        setRooms(res.data.rooms || []);
      } catch (err) {
        console.error("Failed to load chat rooms:", err);
      }
    })();
  }, []);

  return (
    <div className="w-64 overflow-y-auto border-r border-base-300">
      {rooms.map((room) => {
        // show the OTHER member
        const me = window?.__loggedInUserId; // replaced
        const other = room.members.find((m) => m._id !== me) || room.members[0];
        return (
          <button
            key={room._id}
            className="w-full p-3 text-left hover:bg-base-200"
            onClick={() => onSelectRoom(room)}
          >
            <div className="flex items-center gap-2">
              <img
                src={other.photoURL}
                alt=""
                className="object-cover w-8 h-8 rounded-full"
              />
              <span>{other.firstName} {other.lastName}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ChatList;
