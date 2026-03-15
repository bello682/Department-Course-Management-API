const express = require("express");
const router = express.Router();
const Course = require("../models/courses");

// PUBLIC: Fetch all available courses with optional filters
router.get("/all-courses", async (req, res) => {
	try {
		const { title, level, minPrice, maxPrice } = req.query;

		let query = {};

		// Title search (case-insensitive partial match)
		if (title) {
			query["subDepartment.title"] = { $regex: title, $options: "i" };
		}

		// Level filter
		if (level) {
			query["subDepartment.level"] = level;
		}

		// Price range filter
		if (minPrice || maxPrice) {
			query["subDepartment.price"] = {};
			if (minPrice) query["subDepartment.price"].$gte = parseFloat(minPrice);
			if (maxPrice) query["subDepartment.price"].$lte = parseFloat(maxPrice);
		}

		const courses = await Course.find(query).sort({ createdAt: -1 });

		res.status(200).json({ count: courses.length, courses });
	} catch (error) {
		console.error("Public fetch courses error:", error);
		res.status(500).json({ message: "Failed to fetch courses" });
	}
});

module.exports = router;

// THIS IS TO HELP ANY ONE SEE THE COURSES ON THE HOME PAGE WITH OUT AUTHENTICATIONS (FOR HOME PAGE USE)

// const express = require("express");
// const router = express.Router();
// const Course = require("../models/Course");

// // ✅ Public route to fetch courses with search, filter, and pagination
// router.get("/all-courses", async (req, res) => {
// 	try {
// 		// Extract filters from the query string
// 		const { title, level, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

// 		// Build the query object step by step
// 		let query = {};

// 		// 🔍 Title search (case-insensitive, partial match)
// 		if (title) {
// 			query["subDepartment.title"] = { $regex: title, $options: "i" };
// 		}

// 		// 🎚 Filter by course level
// 		if (level) {
// 			query["subDepartment.level"] = level;
// 		}

// 		// 💰 Filter by price range
// 		if (minPrice || maxPrice) {
// 			query["subDepartment.price"] = {};
// 			if (minPrice) query["subDepartment.price"].$gte = parseFloat(minPrice);
// 			if (maxPrice) query["subDepartment.price"].$lte = parseFloat(maxPrice);
// 		}

// 		// ➕ Pagination setup
// 		const skip = (parseInt(page) - 1) * parseInt(limit);

// 		// Run the query with filters and pagination
// 		const courses = await Course.find(query)
// 			.sort({ createdAt: -1 })
// 			.skip(skip)
// 			.limit(parseInt(limit));

// 		// Get total count (useful for frontend pagination)
// 		const total = await Course.countDocuments(query);

// 		// ✅ Return results
// 		res.status(200).json({
// 			message: "Courses fetched successfully",
// 			currentPage: parseInt(page),
// 			pageSize: parseInt(limit),
// 			totalCourses: total,
// 			courses,
// 		});
// 	} catch (error) {
// 		console.error("Error fetching public courses:", error);
// 		res.status(500).json({ message: "Something went wrong. Please try again." });
// 	}
// });

// module.exports = router;
