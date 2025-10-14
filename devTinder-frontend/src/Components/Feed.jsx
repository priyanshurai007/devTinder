import axios from "axios";
import React, { useEffect } from "react";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addFeed } from "../utils/feedSlice";
import UserCard from "./UserCard";

const Feed = () => {
  const dispatch = useDispatch();
  const feed = useSelector((store) => store.feed);

  const getFeed = async () => {
    
    try {
      const res = await axios.get(BASE_URL + "/user/smart-feed", {
        withCredentials: true,
      });
      dispatch(addFeed(res.data)); // Assuming res.data is the array
    } catch (err) {
      console.log("Error fetching feed:", err);
    }
  };

  useEffect(() => {
    if (!feed || feed.length === 0) {
      getFeed();
    }
  }, []);

  if (!feed) return <div className="mt-10 text-center">Loading...</div>;

  if (feed.length === 0)
    return (
      <h1 className="flex justify-center text-3xl m-52">No more users!!!!</h1>
    );

  return (
    <div className="flex flex-col items-center gap-4 my-5">
      {feed.map((user) => (
        <UserCard key={user._id} user={user} />
      ))}
    </div>
  );
};

export default Feed;
