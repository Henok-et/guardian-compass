import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Ensure we load env variables from the workspace root .env when running from the backend directory.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(rootDir, ".env") });

// Optional: log loaded keys for debugging (comment out in production)
// console.log('Loaded ENV:', { JWT_SECRET: Boolean(process.env.JWT_SECRET), MONGO_URI: Boolean(process.env.MONGO_URI) });
