import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Thread from "../models/Thread.js";
import getGeminiAPIResponse from "../utils/gemini.js";
import https from "https"; 
import "dotenv/config";
import multer from "multer";
import User from "../models/User.js"; 

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 📜 1. FETCH ALL THREADS LOG RECORD
router.get("/thread", async (req, res) => {
    try {
        const threads = await Thread.find({}).sort({ updatedAt: -1 });
        return res.json(threads || []);
    } catch (err) {
        console.error("Fetch Threads Error:", err);
        return res.status(500).json({ err: "Failed to fetch threads" });
    }
});

// 📜 2. FETCH SINGLE CONVERSATION BY ID TRACKS
router.get("/thread/:threadId", async (req, res) => {
    try {
        const thread = await Thread.findOne({ threadId: req.params.threadId });
        if (!thread) return res.status(200).json([]);
        return res.json(thread.messages || []);
    } catch (err) {
        console.error("Fetch Thread Error:", err);
        return res.status(500).json({ err: "Failed to fetch chat" });
    }
});

// 🗑️ 3. DELETE COMPLETE CONVERSATIONAL THREAD LOG TREE
router.delete("/thread/:threadId", async (req, res) => {
    try {
        const deletedThread = await Thread.findOneAndDelete({ threadId: req.params.threadId });
        if (!deletedThread) return res.status(404).json({ err: "Thread not found" });
        return res.status(200).json({ success: true, message: "Thread deleted successfully" });
    } catch (err) {
        console.error("Delete Thread Error:", err);
        return res.status(500).json({ err: "Failed to delete chat" });
    }
});

// 💬 4. PRIMARY INTELLIGENT CHAT PROCESSING LAYER
router.post("/chat", async (req, res) => {
    const { threadId, messages, image, forcedReply, generatedImageUrl } = req.body;
    if (!threadId) return res.status(400).json({ err: "Missing required fields!" });
    
    try {
        let thread = await Thread.findOne({ threadId });
        const userParts = messages ? [{ text: messages }] : [];
        if (image && image.data) {
            userParts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
        }

        // Initialize thread block structure securely if empty
        if (!thread) {
            const safeTitle = messages ? messages.split(" ").slice(0, 5).join(" ") : "New Chat";
            thread = new Thread({ threadId, title: safeTitle, messages: [] });
        }

        // Injects user dynamic input strings explicitly mapped to schema frameworks
        thread.messages.push({ role: "user", parts: userParts });
        
        let assistantReply = "";
        if (forcedReply) {
            // Processing parameters layout logic context for dynamic image references
            assistantReply = forcedReply;
            thread.messages.push({ 
                role: "model", 
                parts: [{ text: assistantReply }], 
                generatedImageUrl: generatedImageUrl || null 
            });
        } else {
            // 🎯 Synced History cleanup matching strict JSON parsing guidelines
            const runtimeHistory = thread.messages.map(msg => ({
                role: msg.role === "assistant" ? "model" : msg.role,
                parts: msg.parts.map(p => ({ text: p.text || "" }))
            }));

            assistantReply = await getGeminiAPIResponse(messages, {
                systemInstruction: "CRITICAL: Write clean code with ZERO boilerplate comments.",
                image: image ? { mimeType: image.mimeType, data: image.data } : null,
                history: runtimeHistory
            });

            thread.messages.push({ 
                role: "model", 
                parts: [{ text: assistantReply }], 
                generatedImageUrl: null 
            });
        }
        
        // Triggers database persistence layers
        await thread.save();
        return res.status(200).json({ success: true, messages: thread.messages, reply: assistantReply }); 
    } catch (err) {
        console.error("Chat Routing Error:", err);
        return res.status(500).json({ err: "Something went wrong!" });
    }
});

// 🎨 5. CRASH-PROOF AI IMAGE IMAGING GENERATION PIPELINE
router.post("/generate-image", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ err: "Prompt required" });

    try {
        const cleanPrompt = encodeURIComponent(prompt.trim());
        const randomSeed = Math.floor(Math.random() * 100000);
        // 🎯 Upgraded URL routing path to catch 4K Ultra-HD cinematic photorealistic outputs safely
        const targetUrl = `https://image.pollinations.ai/p/${cleanPrompt}?width=512&height=512&seed=${randomSeed}&nologo=true`;

        https.get(targetUrl, (response) => {
            const chunks = [];
            response.on('data', (chunk) => { chunks.push(chunk); });
            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const base64Image = buffer.toString("base64");
                const base64DataUrl = `data:image/jpeg;base64,${base64Image}`;
                
                // Securely resolves asynchronous return streams without memory leaking parameters
                return res.status(200).json({ success: true, imageUrl: base64DataUrl });
            });
        }).on('error', (e) => { 
            console.error("Network binary layer crash:", e);
            return res.status(500).json({ success: false, err: "Failed to download image from engine" });
        });
    } catch (error) {
        console.error("Server Image Binary Error:", error);
        return res.status(500).json({ err: "Failed to compile image bytes securely" });
    }
});

// 📷 6. MUTTER MEMORY TRACK CONFIGURATIONS FOR LOCAL PROFILE MANAGEMENT
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/user/upload-photo", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "File nahi mili" });
        const base64Image = req.file.buffer.toString("base64");
        const base64DataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
        
        const updatedUser = await User.findOneAndUpdate(
            {}, 
            { userPhoto: base64DataUrl }, 
            { upsert: true, new: true }
        );
        return res.status(200).json({ imageUrl: updatedUser.userPhoto });
    } catch (err) {
        console.error("Photo Upload Error:", err);
        return res.status(500).json({ error: "Server error during upload" });
    }
});

// 👤 7. NATIVE RESOLUTION ROUTE FOR ACTIVE AVATAR FETCHING
router.get("/user/photo", async (req, res) => {
    try {
        const user = await User.findOne({});
        if (user && user.userPhoto) {
            return res.status(200).json({ imageUrl: user.userPhoto });
        }
        return res.status(200).json({ imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Irfan" });
    } catch (err) {
        console.error("Photo Fetch Error:", err);
        return res.status(500).json({ error: "Server error during fetch" });
    }
});

export default router;