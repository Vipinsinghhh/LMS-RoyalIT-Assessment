import express from "express";

import { createCourse } from "../controllers/courseController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  allowRoles("instructor"),
  createCourse
);

export default router;