import "./Chat.css";
import React, { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const markdownComponents = {
    code({ inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        const languageName = match ? match[1] : 'text'; 
        return !inline ? (
            <div className="pureCodeBlockWrapper">
                <div className="pureCodeHeader"><span>{languageName}</span></div>
                <SyntaxHighlighter style={oneDark} language={languageName} PreTag="div" customStyle={{ margin: 0, padding: '16px', background: '#1e1e1e', fontSize: '0.9rem' }} {...props}>
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            </div>
        ) : (
            <code className="inlineCode" {...props}>{children}</code>
        );
    }
};

// ⚡ Dynamic Stream Typist Controller Module
function TypingText({ rawText, onDone }) {
    const [displayedText, setDisplayedText] = useState("");
    const [isTypingDone, setIsTypingDone] = useState(false);
    const textRef = useRef(""); 
    const onDoneRef = useRef(onDone);

    useEffect(() => {
        onDoneRef.current = onDone;
    }, [onDone]);

    useEffect(() => {
        if (!rawText) { 
            setIsTypingDone(true); 
            if (onDoneRef.current) onDoneRef.current();
            return; 
        }
        
        setIsTypingDone(false);
        setDisplayedText("");
        textRef.current = "";

        const charactersArray = Array.from(rawText);
        let currentIndex = 0;
        
        // Character streaming clock ticker setup matching natural flow
        const interval = setInterval(() => {
            if (currentIndex < charactersArray.length) {
                // Character chunk emission slice window
                const nextChunk = charactersArray.slice(currentIndex, currentIndex + 2).join("");
                textRef.current += nextChunk;
                setDisplayedText(textRef.current);
                currentIndex += 2; 
            } else {
                setDisplayedText(rawText);
                clearInterval(interval);
                setIsTypingDone(true);
                if (onDoneRef.current) onDoneRef.current();
            }
        }, 15); // Authentic high-quality typewriter delay

        return () => clearInterval(interval);
    }, [rawText]);

    return (
        <div className="markdownContainer animation-streaming">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{displayedText}</ReactMarkdown>
            {!isTypingDone && <span className="typing-cursor">┃</span>}
        </div>
    );
}

function Chat() {
    const { prevChats, loading, setLoading } = useContext(MyContext) || {}; 
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [prevChats, loading]);

    return (
        <div className="chats-container-wrapper">
            <div className="chats">
                {Array.isArray(prevChats) && prevChats.map((chat, idx) => {
                    let messageText = chat?.parts?.[0]?.text || chat?.text || chat?.content || "";
                    if (!messageText.trim() && !chat.generatedImageUrl && !chat.imagePreview) return null;

                    const isLastItem = idx === prevChats.length - 1;
                    const isModel = chat.role === "model" || chat.role === "assistant";
                    messageText = messageText.replace(/\r\n/g, "\n").replace(/\n\s*\n/g, "\n\n");

                    return (
                        <div className={chat.role === "user" ? "userDiv" : "gptDiv"} key={idx}>
                            {chat.role === "user" ? (
                                <div className="userMessageWrapper">
                                    {chat.imagePreview && <img src={chat.imagePreview} alt="Preview" className="chat-inline-preview" />}
                                    {messageText.trim() && <p className="userMessage">{messageText}</p>}
                                </div>
                            ) : (
                                <div className="markdownContainer">
                                    {messageText.trim() && (
                                        /* 🚀 Locks streaming execution down to current ongoing conversations node hooks */
                                        isModel && isLastItem && loading && !chat.generatedImageUrl ? (
                                            <TypingText rawText={messageText} onDone={() => { if(setLoading) setLoading(false); }} />
                                        ) : (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{messageText}</ReactMarkdown>
                                        )
                                    )}
                                    
                                    {chat.generatedImageUrl && (
                                        <div className="generatedImageContainer" style={{ marginTop: "12px", width: "100%", display: "block" }}>
                                            <img 
                                                src={chat.generatedImageUrl} 
                                                alt="AI Generated Output Content" 
                                                className="generatedImage" 
                                                style={{ 
                                                    width: "100%", maxWidth: "380px", height: "auto", borderRadius: "12px",
                                                    display: "block", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", border: "1px solid #444",
                                                    background: "#1e1e1e", padding: "4px", cursor: "pointer"
                                                }} 
                                                loading="lazy"
                                                onError={(e) => { e.target.style.border = "1px dashed #ff4a5a"; }}
                                                onClick={() => window.open(chat.generatedImageUrl, '_blank')}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* ⏳ Skeleton thinking indicator displays perfectly while server processes responses */}
                {loading && prevChats && prevChats.length > 0 && prevChats[prevChats.length - 1]?.role === "user" && (
                    <div className="gptDiv backend-loading-wrapper">
                        <div className="markdownContainer loader-flex-box">
                            <div className="ai-loading-spinner"></div>
                            <span className="loading-text">Sigma AI is thinking...</span>
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>
        </div>
    );
}

export default Chat;