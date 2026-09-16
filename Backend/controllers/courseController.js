import Course from "../models/Course.js";

export const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      capacity,
      enrollmentDeadline,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !capacity ||
      !enrollmentDeadline
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, description, capacity and enrollment deadline are required",
      });
    }

    // Validate capacity
    if (capacity < 1) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be at least 1",
      });
    }

    // Validate deadline
    const deadline = new Date(enrollmentDeadline);

    if (isNaN(deadline.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid enrollment deadline",
      });
    }

    if (deadline <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Enrollment deadline must be in the future",
      });
    }

    const course = await Course.create({
      title,
      description,
      capacity,
      enrollmentDeadline: deadline,
      instructor: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("instructor", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name email");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Invalid course ID",
    });
  }
};