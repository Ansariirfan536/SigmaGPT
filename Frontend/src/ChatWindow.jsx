import React, { useContext, useState, useEffect } from "react";
import { MyContext } from "./MyContext";
import Chat from "./Chat";
import "./ChatWindow.css"; 

const API_BASE_URL = process.env.NODE_ENV === "production" ? "" : "http://localhost:8080";

function ChatWindow() {
    const contextData = useContext(MyContext) || {};

    const prompt = contextData.prompt || "";
    const setPrompt = contextData.setPrompt || (() => {});
    const currThreadId = contextData.currThreadId || "";
    const prevChats = contextData.prevChats || [];
    const setPrevChats = contextData.setPrevChats || (() => {});
    const setNewChat = contextData.setNewChat || (() => {});
    const loading = contextData.loading || false;
    const setLoading = contextData.setLoading || (() => {});
    const selectedFile = contextData.selectedFile || null;
    const setSelectedFile = contextData.setSelectedFile || (() => {});
    const filePreview = contextData.filePreview || null;
    const setFilePreview = contextData.setFilePreview || (() => {});

    const [isListening, setIsListening] = useState(false);

    useEffect(() => {
        return () => { if (filePreview) URL.revokeObjectURL(filePreview); };
    }, [filePreview]);

    const startSpeechRecognition = () => {
        const SpeechRecognition = window.webkitSpeechRecognition || window.Recognition || window.SpeechRecognition;
        if (!SpeechRecognition) {
            alert("Aapka browser Speech Input support nahi karta. Chrome use karein!");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US"; 
        recognition.interimResults = false;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) setPrompt(transcript);
        };
        recognition.onerror = (err) => { console.error(err); setIsListening(false); };
        if (!isListening) recognition.start();
    };

    const handleImageChange = (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0]; 

        if (filePreview) URL.revokeObjectURL(filePreview);
        setFilePreview(URL.createObjectURL(file)); 

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(","); 
            setSelectedFile({ mimeType: file.type, data: base64Data[1] });
        };
        reader.readAsDataURL(file);
    };

    const handleSend = async () => {
        if (!prompt.trim() && !selectedFile) return;
        setLoading(true);

        const currentPrompt = prompt; 
        const currentFile = selectedFile;
        const currentPreview = filePreview;

        const userMsg = {
            role: "user",
            parts: [{ text: currentPrompt || "Analyze this uploaded image" }],
            imagePreview: currentPreview 
        };

        const updatedChats = [...prevChats, userMsg];
        setPrevChats(updatedChats);
        setPrompt("");
        setFilePreview(null);
        setSelectedFile(null);

        try {
            const lowerPrompt = currentPrompt.toLowerCase().trim();
            const isImageRequest = /\b(generate|genrate|image|photo|banao|pic|draw|flower|mango|apple|rose)\b/.test(lowerPrompt);

            if (isImageRequest) {
                const imgRes = await fetch(`${API_BASE_URL}/api/generate-image`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: currentPrompt })
                });
                const imgData = await imgRes.json();

                if (!imgData.success || !imgData.imageUrl) throw new Error("Generation Failed");

                const aiResponseText = "Here is your generated image:";
                const modelMsg = { 
                    role: "model", 
                    parts: [{ text: aiResponseText }],
                    generatedImageUrl: imgData.imageUrl
                };
                
                setPrevChats(prev => [...prev, modelMsg]);
                setLoading(false); // 🎨 Image standard me seedhe off

                await fetch(`${API_BASE_URL}/api/chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        threadId: currThreadId,
                        messages: currentPrompt,
                        image: null,
                        forcedReply: aiResponseText,
                        generatedImageUrl: imgData.imageUrl
                    })
                });

            } else {
                const response = await fetch(`${API_BASE_URL}/api/chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        threadId: currThreadId,
                        messages: currentPrompt,
                        image: currentFile ? { mimeType: currentFile.mimeType, data: currentFile.data } : null
                    })
                });

                const data = await response.json();
                if (data.success && data.messages) {
                    const syncedMessages = data.messages.map((msg) => {
                        if (msg.role === "user" && msg.parts?.[0]?.text === (currentPrompt || "Analyze this uploaded image")) {
                            return { ...msg, imagePreview: currentPreview };
                        }
                        return msg;
                    });
                    
                    // 🎯 Critical Sync: Pehle array feed karenge bina loading off kiye taaki typing hook trigger ho sake
                    setPrevChats(syncedMessages);
                } else {
                    throw new Error("Server processed error state");
                }
            }
            setNewChat(false);
        } catch (error) {
            console.error("Transmission error:", error);
            setPrevChats(prev => [...prev, { role: "model", parts: [{ text: "Error: Connection lost with backend." }] }]);
            setLoading(false);
        }
    };

    return (
        <div className="chatWindow">
            <Chat />
            
            <div className="chatInput">
                {filePreview && (
                    <div className="image-preview-badge">
                        <label htmlFor="img-upload" style={{ cursor: "pointer", display: "block" }}>
                            <img src={filePreview} alt="upload preview" title="Click to update photo" />
                        </label>
                        <button onClick={() => { setFilePreview(null); setSelectedFile(null); }}>×</button>
                    </div>
                )}
                
                <div className="inputBox">
                    <label className="submit-icon-attachment" htmlFor="img-upload">
                        <i className="fa-solid fa-paperclip"></i>
                    </label>
                    <input 
                        type="file" 
                        id="img-upload" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        onClick={(e) => { e.target.value = null; }} 
                        style={{ display: "none" }} 
                    />
                    
                    <button 
                        className={`voice-action-btn ${isListening ? "listening-ui-active" : ""}`} 
                        onClick={startSpeechRecognition} 
                        disabled={loading}
                    >
                        <i className={`fa-solid ${isListening ? "fa-circle-dot" : "fa-microphone"}`}></i>
                    </button>
                    
                    <input 
                        type="text" 
                        placeholder="Ask anything or type 'generate'..." 
                        value={prompt} 
                        onChange={(e) => setPrompt(e.target.value)} 
                        onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()} 
                        disabled={loading} 
                    />
                    
                    <div 
                        id="submit" 
                        className={loading || (!prompt.trim() && !selectedFile) ? "disabled-send" : "active-send"} 
                        onClick={!loading ? handleSend : undefined}
                    >
                        <i className="fa-solid fa-arrow-up"></i>
                    </div>
                </div>
                
                <p className="info">
                    SigmaGPT can make mistakes. Check important info. See Cookie Preferences.
                </p>
            </div>
        </div>
    );
}

export default ChatWindow;