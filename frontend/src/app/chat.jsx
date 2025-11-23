"use client";
import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const Chat = () => {
  const [msgs, setMsgs] = useState([]);
  const [msg, setMsg] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Establish WebSocket connection
    const newSocket = io("http://localhost:8080");
    setSocket(newSocket);

    // Listen for incoming msgs
    newSocket.on("chat msg", (msgrecv) => {
      console.log("received msg on client " + msgrecv);
      setMsgs((prevMsgs) => [
        ...prevMsgs,
        { text: msgrecv, sentByCurrUser: false },
      ]);
    });

    // Clean up function
    return () => newSocket.close();
  }, []);

  const sendMsg = (e) => {
    e.preventDefault();
    if (socket) {
      socket.emit("chat msg", msg);
      setMsgs((prevMsgs) => [...prevMsgs, { text: msg, sentByCurrUser: true }]);
      setMsg("");
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="msgs-container h-4/5 overflow-scroll">
        {msgs.map((msg, index) => (
          <div
            key={index}
            className={` m-3 ${msg.sentByCurrUser ? "text-right" : "text-left"}`}
          >
            <span
              className={`${
                msg.sentByCurrUser ? "bg-blue-200" : "bggreen-200"
              } p-3 rounded-lg`}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      <div className="h-1/5 flex items-center justify-center">
        <form onSubmit={sendMsg} className="w-1/2">
          <div className="relative">
            <input
              type="text"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type your text here"
              required
              className="block w-full p-4 ps-10 text-sm text-gray-900
border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:borderblue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            />

            <button
              type="submit"
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-heading rounded-base group bg-gradient-to-br from-cyan-500 to-blue-500 group-hover:from-cyan-500 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-cyan-200 dark:focus:ring-cyan-800"
            >
              <span className=" relative px-4 py-2.5 transition-all ease-in duration-75 bg-neutral-primary-soft rounded-base group-hover:bg-transparent group-hover:dark:bg-transparent leading-5">
                Send Msg
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
