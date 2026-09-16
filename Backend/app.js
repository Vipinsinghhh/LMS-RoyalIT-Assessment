import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js"
import courseRoutes from "./routes/courseRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js"

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LMS Enrollment API is running",
  });
});

app.use("/api/auth",authRoutes)
app.use("/api/courses", courseRoutes)
app.use("/api", enrollmentRoutes);

export default app;