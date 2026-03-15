// models/Course.js
const { Schema, model } = require("mongoose");
const subDepartmentSchema = require("./coursesModel");

const courseSchema = new Schema(
	{
		subDepartment: subDepartmentSchema,
		createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
	},
	{ timestamps: true }
);

module.exports = model("Course", courseSchema);
