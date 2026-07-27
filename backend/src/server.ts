import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI as string;


// server configurations
app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
    res.json({
        status: "ok",
        service: "Nexus AI is running...."
    });
});

app.use('/api/auth', authRoutes);

connectDB(MONGO_URI).then(() => {
    app.listen(PORT, () => {
        console.log(`Nexus AI backend is running on http://localhost:${PORT}`);
        
    })
})

