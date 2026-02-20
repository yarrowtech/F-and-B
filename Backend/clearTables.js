import mongoose from "mongoose";
import Table from "./models/Table.model.js";
import dotenv from "dotenv";

dotenv.config();

const clearTables = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const result = await Table.deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} tables from database`);

        await mongoose.disconnect();
        console.log("✅ Disconnected from MongoDB");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
};

clearTables();
