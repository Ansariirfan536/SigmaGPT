import mongoose from "mongoose";

const PartItemSchema = new mongoose.Schema({
    text: { type: String, required: false, default: "" },
    inlineData: {
        mimeType: { type: String, required: false },
        data: { type: String, required: false } 
    }
}, { _id: false });

const MessageSchema = new mongoose.Schema({
    role: { type: String, enum: ["user", "model", "assistant"], required: true },
    parts: {
        type: [PartItemSchema], 
        required: true,
        validate: {
            validator: function(v) { return v && v.length > 0; },
            message: "A message must contain at least one part element."
        }
    },
    generatedImageUrl: { type: String, default: null },
    imagePreview: { type: String, default: null }, 
    timestamp: { type: Date, default: Date.now }
});

const ThreadSchema = new mongoose.Schema({
    threadId: { type: String, required: true, unique: true, index: true },
    title: { type: String, trim: true, default: "New Chat" },
    messages: [MessageSchema]
}, { timestamps: true });

ThreadSchema.index({ updatedAt: -1 });

const Thread = mongoose.models.Thread || mongoose.model("Thread", ThreadSchema);
export default Thread;