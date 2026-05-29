import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    userPhoto: {
        type: String,
        default: "https://api.dicebear.com/7.x/bottts/svg?seed=Irfan"
    }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;