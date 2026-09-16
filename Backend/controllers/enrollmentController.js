import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";

export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // 1. Find course
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // 2. Instructor cannot enroll in own course
    if (course.instructor.toString() === req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Instructor cannot enroll in their own course",
      });
    }

    // 3. Check enrollment deadline
    if (new Date() > course.enrollmentDeadline) {
      return res.status(400).json({
        success: false,
        message: "Enrollment deadline has passed",
      });
    }

    // 4. Check duplicate enrollment
    const existingEnrollment = await Enrollment.findOne({
      student: req.user.userId,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    // 5. Check course capacity
    const enrollmentCount = await Enrollment.countDocuments({
      course: courseId,
    });

    if (enrollmentCount >= course.capacity) {
      return res.status(400).json({
        success: false,
        message: "Course is full",
      });
    }

    // 6. Create enrollment
    const enrollment = await Enrollment.create({
      student: req.user.userId,
      course: courseId,
    });

    res.status(201).json({
      success: true,
      message: "Successfully enrolled in course",
      data: enrollment,
    });
  } catch (error) {
    console.error(error);

    // MongoDB duplicate key protection
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const unenrollFromCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOneAndDelete({
      student: req.user.userId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Successfully unenrolled from course",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      student: req.user.userId,
    })
      .populate("course", "title description capacity enrollmentDeadline")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};