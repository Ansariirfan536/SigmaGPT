import React from "react";
import Sidebar from "./Sidebar.jsx"; // 🎯 Direct src folder se Sidebar load hoga
import ChatWindow from "./ChatWindow.jsx"; // 🎯 Direct src folder se ChatWindow load hoga
import "./App.css"; 

function App() {
    return (
        <div className="app-container">
            <Sidebar />
            <ChatWindow />
        </div>
    );
}

export default App;