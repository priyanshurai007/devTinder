import axios from "axios";
import React, { useState } from "react";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addRequests, removeRequest } from "../utils/requestSlice";

const Requests = () => {
  const dispatch = useDispatch();
  const requests = useSelector((store) => store.request);
  console.log(requests);

  const reviewRequest = async (status, _id) => {
    try {
      const res = await axios.post(
        BASE_URL + "/request/review" + "/" + status + "/" + _id,
        {},
        { withCredentials: true }
      );
      dispatch(removeRequest(_id));
    } catch (error) {
      console.log(error);
    }
  };

  const fetchRequests = async () => {
    try {
      const requests = await axios.get(BASE_URL + "/user/requests/recieved", {
        withCredentials: true,
      });
      dispatch(addRequests(requests.data.connectionRequests));
      //   console.log(requests.data.connectionRequests);
    } catch (error) {
      console.log(error);
    }
  };

  useState(() => {
    fetchRequests();
  }, []);
  if (!requests) return;
  if (requests.length == 0)
    return (
      <>
        <h1 className="flex justify-center my-10 text-2xl text-green-300">
          No Requests found
        </h1>
      </>
    );

  return (
    <div className="my-10 text-center ">
      <h1 className="p-4 text-3xl font-bold text-pink-400">
        Requests ({requests.length})
      </h1>
      {requests.map((request) => {
        const { _id, firstName, lastName, photoURL, age, gender, about } =
          request.fromUserId;

        return (
          <div
            key={_id}
            className="flex items-center justify-between w-2/3 p-2 m-2 mx-auto rounded-lg bg-base-300"
          >
            <div>
              <img
                alt="photo"
                className="object-contain rounded-full w-14 h-14"
                src={photoURL}
              />
            </div>
            <div className="p-4 m-4 text-left ">
              <h2 className="text-xl font-bold">
                {firstName + " " + lastName}
              </h2>
              {age && gender && <p>{age + " " + gender}</p>}
              <p>{about}</p>
            </div>
            <div className="">
              <button
                className="mx-2 btn btn-secondary"
                onClick={() => reviewRequest("accepted", request._id)}
              >
                Accept
              </button>
              <button
                className="mx-2 btn btn-primary"
                onClick={() => reviewRequest("rejected", request._id)}
              >
                Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Requests;
