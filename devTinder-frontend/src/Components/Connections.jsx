import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addConnection, removeConnection } from "../utils/connectionSlice";

const Connections = () => {
 
  const connections = useSelector((store) => store.connection);
  console.log(connections);
  const dispatch = useDispatch();
  
  const fetchConnections = async () => {
    try {
      dispatch(removeConnection());
      const connections = await axios.get(BASE_URL + "/user/connections", {
        withCredentials: true,
      });
      dispatch(addConnection(connections.data.data));
      //   console.log(connections.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  if (!connections) return;
  if (connections.length == 0)
    return (
      <>
        <h1 className="flex justify-center my-10 text-2xl text-green-300">
          No conections found
        </h1>
      </>
    );

  return (
    <div className="my-10 text-center ">
      <h1 className="text-3xl font-bold text-pink-400">Connections ({connections.length})</h1>
      {connections.map((connection) => {
        const {_id, firstName, lastName, photoURL, age, gender, about } =
          connection;

        return (
          <div key={_id} className="flex items-center w-1/2 p-2 m-2 mx-auto rounded-lg bg-base-300">
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
          </div>
        );
      })}
    </div>
  );
};

export default Connections;
