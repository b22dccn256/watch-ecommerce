import mongoose from "mongoose";

const productAuditSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null, // null if system or unknown
        },
        action: {
            type: String,
            enum: ["Created", "Updated", "Deleted", "Restored"],
            required: true,
        },
        changes: {
            type: mongoose.Schema.Types.Mixed, // flexible object to store changed paths
            default: {},
        },
    },
    { timestamps: true }
);

const ProductAudit = mongoose.model("ProductAudit", productAuditSchema);

export default ProductAudit;
