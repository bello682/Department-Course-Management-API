const Department = require("../models/userModel");
const HttpError = require("../models/errorModel");

//  POST: Add SubDepartment
const addSubDepartment = async (req, res, next) => {
	try {
		const { userId } = req.params;
		const { name } = req.body;

		if (!name || name.trim().length < 2) {
			return next(
				new HttpError("SubDepartment name must be at least 2 characters", 400)
			);
		}

		const department = await Department.findById(userId);

		if (!department) {
			return next(new HttpError("Department not found", 404));
		}

		department.subDepartments.push({ name: name.trim() });
		await department.save();

		res.status(201).json({
			message: "SubDepartment added successfully",
			data: { createDepartment: department },
		});
	} catch (error) {
		console.error("Error adding SubDepartment:", error);
		next(new HttpError("Failed to add SubDepartment", 500));
	}
};

// GET: Fetch SubDepartments
const fetchSubDepartments = async (req, res, next) => {
	try {
		const { userId } = req.params;

		const department = await Department.findById(userId);

		if (!department) {
			return next(new HttpError("Department not found", 404));
		}

		res.status(200).json({
			message: "SubDepartments retrieved successfully",
			data: { subDepartments: department.subDepartments },
		});
	} catch (error) {
		console.error("Error fetching SubDepartments:", error);
		next(new HttpError("Failed to fetch SubDepartments", 500));
	}
};

// PUT: Update SubDepartment
const updateSubDepartment = async (req, res, next) => {
	try {
		const { userId, subDepartmentId } = req.params;
		const { name } = req.body;

		if (!name || name.trim().length < 2) {
			return next(
				new HttpError("SubDepartment name must be at least 2 characters", 400)
			);
		}

		const department = await Department.findById(userId);

		if (!department) {
			return next(new HttpError("Department not found", 404));
		}

		const subDepartment = department.subDepartments.id(subDepartmentId);

		if (!subDepartment) {
			return next(new HttpError("SubDepartment not found", 404));
		}

		subDepartment.name = name.trim();
		await department.save();

		res.status(200).json({
			message: "SubDepartment updated successfully",
			data: { createDepartment: department },
		});
	} catch (error) {
		console.error("Error updating SubDepartment:", error);
		next(new HttpError("Failed to update SubDepartment", 500));
	}
};

// DELETE: Delete SubDepartment
const deleteSubDepartment = async (req, res, next) => {
	try {
		const { userId, subDepartmentId } = req.params;

		const department = await Department.findById(userId);

		if (!department) {
			return next(new HttpError("Department not found", 404));
		}

		const subDepartmentIndex = department.subDepartments.findIndex(
			(sub) => sub._id.toString() === subDepartmentId
		);

		if (subDepartmentIndex === -1) {
			return next(new HttpError("SubDepartment not found", 404));
		}

		// Remove subDepartment from array
		department.subDepartments.splice(subDepartmentIndex, 1);

		await department.save();

		res.status(200).json({
			message: "SubDepartment deleted successfully",
			data: { createDepartment: department },
		});
	} catch (error) {
		console.error("Error deleting SubDepartment:", error);
		next(new HttpError("Failed to delete SubDepartment", 500));
	}
};

module.exports = {
	addSubDepartment,
	updateSubDepartment,
	fetchSubDepartments,
	deleteSubDepartment,
};
