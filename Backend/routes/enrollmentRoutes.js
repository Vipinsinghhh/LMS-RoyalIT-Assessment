import express from "express";

import {
  enrollInCourse,
  unenrollFromCourse,
  getMyEnrollments,
} from "../controllers/enrollmentController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/courses/:courseId/enroll",
  protect,
  allowRoles("student"),
  enrollInCourse
);

router.delete(
  "/courses/:courseId/enroll",
  protect,
  allowRoles("student"),
  unenrollFromCourse
);

router.get(
  "/my-enrollments",
  protect,
  allowRoles("student"),
  getMyEnrollments
);

export default router;