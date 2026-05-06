import dotenv from "dotenv";
import mongoose from "mongoose";
import { createSuperAdmin } from "./utils/createSuperAdmin.js";
import { promptPassword, promptText } from "./utils/promptCredentials.js";

dotenv.config();

const runSeeds = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding");

    const email = await promptText("Super Admin email: ");
    const password = await promptPassword("Super Admin password: ");

    await createSuperAdmin({
      email,
      password,
      failOnMissingCredentials: true,
    });

    console.log("Seeds completed");
    process.exit(0);
  } catch (error) {
    console.error("Seeds failed:", error.message);
    process.exit(1);
  }
};

runSeeds();
