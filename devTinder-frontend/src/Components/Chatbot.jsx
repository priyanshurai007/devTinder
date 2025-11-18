import axios from "../utils/axiosInstance";
import { useState, useEffect, useRef } from "react";
import { BASE_URL } from "../utils/constants";
import { useSelector } from "react-redux";

const Chatbot = () => {
  const user = useSelector((store) => store.user);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "",
      sender: "bot",
      type: "greeting",
      suggestions: [],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [initialLoadingDone, setInitialLoadingDone] = useState(false);
  const [showRaw, setShowRaw] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dev_show_raw')) === true } catch(e){ return false }
  });
  const [lastRawResponse, setLastRawResponse] = useState(null);

  // Initialize chatbot with greeting
  useEffect(() => {
    if (isOpen && !initialLoadingDone && user?.firstName) {
      fetchInitialGreeting();
      setInitialLoadingDone(true);
    }
  }, [isOpen, user?.firstName, initialLoadingDone]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchInitialGreeting = async () => {
    try {
      const greetings = [
        `Hey ${user.firstName}! 👋 How can I help you make meaningful connections today?`,
        `Welcome back ${user.firstName}! 🚀 What would you like to work on?`,
        `Hi ${user.firstName}! 💡 I'm here to help you grow your network and find opportunities.`,
      ];

      const greeting =
        greetings[Math.floor(Math.random() * greetings.length)];

      setMessages([
        {
          id: Date.now(),
          text: greeting,
          sender: "bot",
          type: "greeting",
          suggestions: [
            { text: "Show my profile suggestions", action: "profile" },
            { text: "Find connections", action: "connections" },
            { text: "See job recommendations", action: "jobs" },
          ],
        },
      ]);
    } catch (error) {
      console.error("Error fetching greeting:", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const response = await axios.post(
        BASE_URL + "/chatbot/message",
        { message: inputValue },
        { withCredentials: true }
      );

      const resp = response.data || {};
      // backend may return success:false with error fields
      if (resp.success === false) {
        const serverMsg = resp.message || "Chatbot error";
        const serverErr = resp.error || resp.details || null;
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: serverErr ? `${serverMsg} — ${serverErr}` : serverMsg,
            sender: "bot",
            type: "error",
          },
        ]);
      } else {
        const botResponse = resp.data || {};

        // Add bot response
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: botResponse.response,
            sender: "bot",
            type: botResponse.type,
            suggestions: botResponse.suggestions || [],
            data: {
              recommendations: botResponse.recommendations,
              suggestions: botResponse.suggestions,
              skills: botResponse.skills,
            },
          },
        ]);
      }
      if (showRaw) setLastRawResponse(resp);
    } catch (error) {
      console.error("Error sending message:", error);
      const resp = error?.response?.data || {};
      const serverMsg = resp.message || "Sorry, I encountered an error. Please try again!";
      const serverErr = resp.error || resp.details || null;
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: serverErr ? `${serverMsg} — ${serverErr}` : serverMsg,
          sender: "bot",
          type: "error",
        },
      ]);
      if (showRaw) setLastRawResponse(error?.response?.data || { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (action) => {
    setLoading(true);

    try {
      let response;
      let actionText = "";

      switch (action) {
        case "profile":
          response = await axios.get(
            BASE_URL + "/chatbot/profile-suggestions",
            { withCredentials: true }
          );
          actionText = "Show my profile suggestions";
          break;
        case "connections":
          response = await axios.get(
            BASE_URL + "/chatbot/connection-recommendations",
            { withCredentials: true }
          );
          actionText = "Find connections";
          break;
        case "jobs":
          response = await axios.get(
            BASE_URL + "/chatbot/job-recommendations",
            { withCredentials: true }
          );
          actionText = "See job recommendations";
          break;
        default:
          return;
      }

      // Add user action as message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: actionText,
          sender: "user",
        },
      ]);

      // Add bot response
      const resp = response.data || {};
      if (resp.success === false) {
        const serverMsg = resp.message || "Chatbot error";
        const serverErr = resp.error || resp.details || null;
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: serverErr ? `${serverMsg} — ${serverErr}` : serverMsg,
            sender: "bot",
            type: "error",
            data: resp.data || {},
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: resp.data?.message || resp.data?.reason || "",
            sender: "bot",
            type: action,
            data: resp.data || {},
          },
        ]);
      }
      if (showRaw) setLastRawResponse(resp);
    } catch (error) {
      console.error("Error handling suggestion:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user._id) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-circle btn-lg btn-primary shadow-xl animate-bounce"
          title="Open Chatbot"
        >
          🤖
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-96 max-h-96 bg-base-300 rounded-lg shadow-2xl flex flex-col border border-primary">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-lg">🤖 DevLinker Bot</h3>
              <p className="text-xs text-gray-200">Always here to help</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="label cursor-pointer text-xs text-white mr-2">
                <span className="label-text mr-2">Raw</span>
                <input
                  type="checkbox"
                  className="toggle toggle-sm"
                  checked={showRaw}
                  onChange={(e) => { setShowRaw(e.target.checked); localStorage.setItem('dev_show_raw', JSON.stringify(e.target.checked)); }}
                />
              </label>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-sm"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender === "user"
                      ? "bg-primary text-white rounded-br-none"
                      : "bg-gray-700 text-gray-100 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>

                  {/* Suggestions Buttons */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion.action)}
                          className="block w-full text-left bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-xs transition"
                        >
                          💡 {suggestion.text}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Data Display */}
                  {msg.type === "profile" && msg.data?.suggestions && (
                    <div className="mt-3 space-y-2 text-xs">
                      {msg.data.suggestions.map((sugg, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-600 p-2 rounded text-gray-100"
                        >
                          <p className="font-semibold">{sugg.suggestion}</p>
                          <p className="text-gray-300">{sugg.action}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.type === "connections" &&
                    msg.data?.recommendations && (
                      <div className="mt-3 space-y-2 text-xs">
                        {msg.data.recommendations.slice(0, 3).map((rec, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-600 p-2 rounded text-gray-100"
                          >
                            <p className="font-semibold">
                              {rec.firstName} {rec.lastName}
                            </p>
                            <p className="text-gray-300">
                              {rec.skills?.slice(0, 2).join(", ")}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                  {msg.type === "jobs" && msg.data?.recommendations && (
                    <div className="mt-3 space-y-1 text-xs">
                      {msg.data.recommendations.map((role, idx) => (
                        <p
                          key={idx}
                          className="bg-gray-600 px-2 py-1 rounded text-gray-100"
                        >
                          🎯 {role}
                        </p>
                      ))}
                    </div>
                  )}

                  {msg.type === "skills" && msg.data?.skills && (
                    <div className="mt-3 space-y-1 text-xs">
                      {msg.data.skills.slice(0, 5).map((skill, idx) => (
                        <p
                          key={idx}
                          className="bg-gray-600 px-2 py-1 rounded text-gray-100"
                        >
                          💡 {skill.skill} ({skill.count} users)
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="loading loading-dots loading-sm"></div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {showRaw && lastRawResponse && (
            <div className="p-3 border-t border-gray-700 bg-base-200 max-h-40 overflow-auto">
              <pre className="text-xs">{JSON.stringify(lastRawResponse, null, 2)}</pre>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={sendMessage} className="border-t border-gray-700 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                className="input input-sm input-bordered flex-1"
                disabled={loading}
              />
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={loading || !inputValue.trim()}
              >
                ▶
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
