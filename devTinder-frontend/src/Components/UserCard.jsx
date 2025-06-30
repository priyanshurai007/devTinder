import axios from "axios";
import React from "react";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { removeUserFromFeed } from "../utils/feedSlice";

const UserCard = ({ user }) => {
  
  const dispatch = useDispatch();
  const { _id, firstName, lastName, age, gender, about, photoURL, skills } = user;

  const handleSendRequest = async (status, userId) => {
    try {
      await axios.post(
        `${BASE_URL}/request/send/${status}/${userId}`,
        {},
        { withCredentials: true }
      );
      dispatch(removeUserFromFeed(userId));
    } catch (error) {
      console.error("Request failed:", error?.response?.data || error.message);
    }
  };

  return (
    <div className="p-3 shadow-xl card bg-base-300 w-96">
      <figure>
        <img
          src={photoURL || "https://via.placeholder.com/300x300?text=No+Image"}
          alt={firstName + " " + lastName}
          className="object-cover h-64 rounded-lg"
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{firstName + " " + lastName}</h2>
        {age && gender && <p>{`${age}, ${gender}`}</p>}
        {about && <p>{about}</p>}
        {skills && skills.length > 0 && (
          <div>
            <h3 className="font-semibold">Skills:</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-sm text-blue-700 bg-blue-200 rounded-lg"
                >
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="justify-center my-4 card-actions">
          <button
            className="btn btn-accent"
            onClick={() => handleSendRequest("ignored", _id)}
          >
            Ignore
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleSendRequest("intrested", _id)}
          >
            Interested
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
