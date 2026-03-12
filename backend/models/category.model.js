import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        parentCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },
        image: {
            type: String,
            default: "",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        level: {
            type: Number,
            default: 0,
        },
        ancestors: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Category",
            default: [],
        },
    },
    { timestamps: true }
);

categorySchema.index({ parentCategory: 1 });
categorySchema.index({ ancestors: 1 });
categorySchema.index({ isActive: 1 });

const Category = mongoose.model("Category", categorySchema);

export default Category;
