// import React, { useState, useEffect } from "react";

// const API_BASE_URL = process.env.NODE_ENV === "production" ? "" : "http://localhost:8080";

// function ProfileAvatar() {
//     const [userPhoto, setUserPhoto] = useState("https://api.dicebear.com/7.x/bottts/svg?seed=Irfan");

//     useEffect(() => {
//         const fetchUserPhoto = async () => {
//             try {
//                 const res = await fetch(`${API_BASE_URL}/api/user/photo`);
//                 const data = await res.json();
//                 if (data && data.imageUrl) {
//                     setUserPhoto(data.imageUrl);
//                 }
//             } catch (err) {
//                 console.error("Photo fetch error:", err);
//             }
//         };
//         fetchUserPhoto();
//     }, []);

//     return (
//         <img 
//             src={userPhoto} 
//             alt="User Profile" 
//             className="avatar-img"
//             onClick={() => {
//                 const newUrl = prompt("Apni nayi photo ka image URL yahan paste karein:");
//                 if (newUrl && newUrl.trim() !== "") {
//                     setUserPhoto(newUrl);
//                 }
//             }}
//         />
//     );
// }

// export default ProfileAvatar;


import React, { useState, useEffect, useRef } from "react";

const API_BASE_URL = process.env.NODE_ENV === "production" ? "" : "http://localhost:8080";

function ProfileAvatar() {
    const [userPhoto, setUserPhoto] = useState("https://api.dicebear.com/7.x/bottts/svg?seed=Irfan");
    const fileInputRef = useRef(null); // 🎯 Laptop files access karne ke liye hidden hook trigger

    // 📜 1. Initial Page Load par Profile Image Database se lekar aana
    useEffect(() => {
        const fetchUserPhoto = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/user/photo`);
                const data = await res.json();
                if (data && data.imageUrl) {
                    setUserPhoto(data.imageUrl);
                }
            } catch (err) {
                console.error("Photo fetch error:", err);
            }
        };
        fetchUserPhoto();
    }, []);

    // 📷 2. Direct Laptop Local File Selection Handler
    const handleAvatarFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation Parameter Check: Size restriction to prevent server buffer leakage
        if (file.size > 5 * 1024 * 1024) {
            alert("Irfan bhai, photo bohot badi h! 5MB se choti size select karein.");
            return;
        }

        // Fast Client-side Optimistic UI Update (Bina reload ke instantly image change dikhega)
        const localPreviewUrl = URL.createObjectURL(file);
        setUserPhoto(localPreviewUrl);

        // Append real file binary content explicitly into FormData layers
        const formData = new FormData();
        formData.append("image", file);

        try {
            // 🔥 Direct hit to your backend multer route switcher
            const response = await fetch(`${API_BASE_URL}/api/user/upload-photo`, {
                method: "POST",
                body: formData // Form fields handle encoding streams automatically
            });

            const data = await response.json();
            if (data && data.imageUrl) {
                setUserPhoto(data.imageUrl); // Sync final base64 string returned from mongo
                alert("Irfan bhai, aapki profile photo successfully update ho gayi h! 🎉");
            } else {
                throw new Error("Invalid backend token injection trace");
            }
        } catch (err) {
            console.error("Direct Upload Execution Crash:", err);
            alert("Photo save karne me koi error aaya!");
        }
    };

    // 🎯 Triggers underlying operating system file selection screen grid hooks
    const handleAvatarImageClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* 🖼️ Actual Visible Profile Avatar Frame */}
            <img 
                src={userPhoto} 
                alt="User Profile" 
                className="avatar-img"
                onClick={handleAvatarImageClick} /* 🔥 Direct laptop selection engine */
                title="Click to select photo from laptop"
                style={{ cursor: "pointer" }}
            />

            {/* 🧪 Native Hidden File Input Trigger (Bypass Area) */}
            <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*" 
                onChange={handleAvatarFileChange} 
                onClick={(event) => { event.target.value = null; }} // Smooth overwrite selector fallback reset
                style={{ display: "none" }} 
            />
        </div>
    );
}

export default ProfileAvatar;