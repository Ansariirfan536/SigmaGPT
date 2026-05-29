import React, { useContext, useEffect } from "react";
import { MyContext } from "./MyContext";
import ProfileAvatar from "./ProfileAvatar";
import "./Sidebar.css"; 

const API_BASE_URL = process.env.NODE_ENV === "production" ? "" : "http://localhost:8080";

function Sidebar() {
    const contextData = useContext(MyContext) || {};
    
    const allThreads = contextData.allThreads || [];
    const setAllThreads = contextData.setAllThreads || (() => {});
    const prevChats = contextData.prevChats || [];
    const setPrevChats = contextData.setPrevChats || (() => {});
    const currThreadId = contextData.currThreadId || "";
    const setCurrThreadId = contextData.setCurrThreadId || (() => {});
    const setNewChat = contextData.setNewChat || (() => {});
    const initiateBlankNewChat = contextData.initiateBlankNewChat || (() => {});

    useEffect(() => {
        const fetchAllThreads = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/thread`);
                const data = await res.json();
                const threadsArray = Array.isArray(data) ? data : (data.threads || []);
                setAllThreads(threadsArray);
            } catch (err) {
                console.error("Threads fetch error:", err);
                setAllThreads([]);
            }
        };
        fetchAllThreads();
    }, [setAllThreads, prevChats]);

    const handleSelectThread = async (threadId) => {
        if (!threadId) return;
        try {
            setCurrThreadId(threadId);
            setNewChat(false);
            const res = await fetch(`${API_BASE_URL}/api/thread/${threadId}`);
            const messages = await res.json();
            const actualMessages = Array.isArray(messages) ? messages : (messages.messages || []);
            setPrevChats(actualMessages);
        } catch (err) {
            console.error("Single thread load error:", err);
        }
    };

    const handleDeleteThread = async (e, threadId) => {
        e.stopPropagation(); 
        if (!threadId) return;
        if (!window.confirm("Kya aap is chat ko delete karna chahte hain?")) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/thread/${threadId}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success || data) {
                setAllThreads(prev => Array.isArray(prev) ? prev.filter(t => t.threadId !== threadId) : []);
                if (currThreadId === threadId) {
                    initiateBlankNewChat();
                }
            }
        } catch (err) {
            console.error("Delete thread error:", err);
        }
    };

    return (
        <div className="sidebar">
            {/* 🎯 TOP NAV: Branding Panel */}
            <div className="sidebar-top-nav">
                <div className="brand-logo-wrapper" onClick={initiateBlankNewChat}>
                    {/* ✨ Authentic Multi-Color Gradient Gemini Sparkle SVG Logo */}
                    <svg 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                            width: "24px",
                            height: "24px",
                            display: "inline-block",
                            verticalAlign: "middle",
                            filter: "drop-shadow(0px 2px 6px rgba(15, 118, 110, 0.35))"
                        }}
                    >
                        {/* 🎨 Defining Gemini AI Official Color Spectrum Gradient */}
                        <defs>
                            <linearGradient id="gemini-official-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#1a73e8" />    {/* Blue */}
                                <stop offset="35%" stopColor="#7a22ff" />   {/* Purple */}
                                <stop offset="70%" stopColor="#e8413e" />   {/* Red/Pink */}
                                <stop offset="100%" stopColor="#f9ab00" />  {/* Yellow/Orange */}
                            </linearGradient>
                        </defs>
                        
                        {/* Core vector sparkle path with gradient mapping applied */}
                        <path 
                            fill="url(#gemini-official-gradient)" 
                            d="M12 24c-.2 0-.4-.1-.5-.2C9.2 19.3 4.7 14.8.2 12.5c-.3-.1-.3-.4 0-.5C4.7 9.7 9.2 5.2 11.5.2c.1-.3.4-.3.5 0C14.3 5.2 18.8 9.7 23.3 12c.3.1.3.4 0 .5-4.5 2.3-9 6.8-11.3 11.3-.1.1-.3.2-.5.2zm0-15.1c.5 1.7 1.9 3.1 3.6 3.6-1.7.5-3.1 1.9-3.6 3.6-.5-1.7-1.9-3.1-3.6-3.6 1.7-.5 3.1-1.9 3.6-3.6z"
                        />
                    </svg>
                    <span className="brand-title">SigmaGPT</span>
                </div>
                
                {/* 📝 Pencil Vector Trigger Icon */}
                <span className="new-chat-icon" onClick={initiateBlankNewChat} title="New Chat">
                    <i className="fa-regular fa-pen-to-square" style={{ fontSize: "16px", color: "#e3e3e3" }}></i>
                </span>
            </div>

            {/* 📝 CHAT HISTORY LOG TRACKS */}
            <div className="history">
                {Array.isArray(allThreads) && allThreads.length > 0 ? (
                    allThreads.map((thread) => {
                        if (!thread || !thread.threadId) return null;
                        return (
                            <li 
                                key={thread.threadId} 
                                className={currThreadId === thread.threadId ? "highlighted" : ""}
                                onClick={() => handleSelectThread(thread.threadId)}
                            >
                                <span className="thread-title-span">{thread.title || "New Chat"}</span>
                                {/* 🗑️ Sleek Thin Frame Trash-Can Vector Icon */}
                                <i 
                                    className="fa-regular fa-trash-can inline-trash-vector-icon" 
                                    onClick={(e) => handleDeleteThread(e, thread.threadId)}
                                    title="Delete Chat"
                                ></i>
                            </li>
                        );
                    })
                ) : (
                    <div className="empty-history-text">
                        No history logs found
                    </div>
                )}
            </div>

            {/* 👤 BOTTOM SIGN PROFILE */}
            <div className="sign">
                <div className="profile-avatar-wrapper">
                    <ProfileAvatar /> 
                </div>
                <p className="by-irfan-text">By Irfan ♥</p>
            </div>
        </div>
    );
}

export default Sidebar;