const { Schema } = require("mongoose");

const subDepartmentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    image: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, default: "image", required: true },
      },
    ],
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true,
    },
    instructor: {
      type: String,
      required: true,
    },
    modules: {
      type: [String],
      required: true,
    },
    prerequisites: {
      type: String,
      required: true,
    },
    benefits: {
      type: [String],
      default: [],
    },
    isMostPurchased: {
      type: Boolean,
      default: false,
    },
    isHotCourse: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true },
);

// Middleware to auto-prefix modules
subDepartmentSchema.pre("save", function (next) {
  if (Array.isArray(this.modules)) {
    this.modules = this.modules.map((module, index) => {
      if (!module.startsWith("Module")) {
        return `Module ${index + 1}: ${module}`;
      }
      return module;
    });
  }
  next();
});

// ✅ Export the schema (not a model)
module.exports = subDepartmentSchema;
