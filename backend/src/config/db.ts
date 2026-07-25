import mongoose from "mongoose";

export async function connectDB(uri: string): Promise <void> {
    try {
        await mongoose.connect(uri, {
            dbName: "Nexus AI"
        });


        console.log('✅ MongoDB connected');
        
        
    } catch (error) {
        console.error("Mongo DB connection error:", error);
        process.exit(1);
        
    }
}