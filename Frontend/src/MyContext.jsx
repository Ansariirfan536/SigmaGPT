import React, { createContext, useState } from "react";
import { v1 as uuidv1 } from "uuid";

export const MyContext = createContext(null);

export const ContextProviderComponent = ({ children }) => {
    const [prompt, setPrompt] = useState("");
    const [currThreadId, setCurrThreadId] = useState(() => uuidv1()); 
    const [prevChats, setPrevChats] = useState([]);
    const [newChat, setNewChat] = useState(true);
    const [allThreads, setAllThreads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null); 
    const [filePreview, setFilePreview] = useState(null);

    const initiateBlankNewChat = () => {
        if (filePreview) URL.revokeObjectURL(filePreview);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
        setPrompt("");
        setSelectedFile(null);
        setFilePreview(null);
        setNewChat(true);
    };

    const providerValues = {
        prompt, setPrompt,
        currThreadId, setCurrThreadId,
        newChat, setNewChat,
        prevChats, setPrevChats,
        allThreads, setAllThreads,
        loading, setLoading,
        selectedFile, setSelectedFile,
        filePreview, setFilePreview,
        initiateBlankNewChat
    };

    return (
        <MyContext.Provider value={providerValues}>
            {children}
        </MyContext.Provider>
    );
};