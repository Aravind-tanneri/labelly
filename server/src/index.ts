import "dotenv/config";
import mongoose from "mongoose";
import app from "./app";
import { seedDefaults } from "./seed";

const PORT = Number(process.env.PORT || 5000);
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/labelly";

async function main(): Promise<void> {
  await mongoose.connect(MONGO_URI);
  console.log(`[db] Connected to MongoDB`);

  // Hackathon approach: users + rules are pre-seeded, no admin UI needed.
  await seedDefaults();
  console.log(`[seed] Default users and rules ensured`);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] Labelly API listening on http://0.0.0.0:${PORT}`);
  });
}

main().catch((error) => {
  console.error("[fatal] Failed to start server", error);
  process.exit(1);
});