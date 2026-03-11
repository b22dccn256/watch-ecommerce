import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Campaign name is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        group: {
            type: String,
            enum: ["Men's Luxury", "Women's Diamond", "Entire Catalog", "Rolex", "Hublot", "Patek Philippe", "Audemars Piguet", "Automatic", "Quartz"],
            required: function () {
                return !this.isGlobal;
            },
        },
        discountPercentage: {
            type: Number,
            required: [true, "Discount percentage is required"],
            min: [0, "Discount cannot be less than 0"],
            max: [100, "Discount cannot exceed 100"],
        },
        startDate: {
            type: Date,
            required: [true, "Start date is required"],
        },
        endDate: {
            type: Date,
            required: [true, "End date is required"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isGlobal: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ["Scheduled", "Active", "Ended"],
            default: "Scheduled",
        }
    },
    {
        timestamps: true,
    }
);

// Middleware to automatically determine initial status on save if not provided
campaignSchema.pre("save", function (next) {
    const now = new Date();
    if (this.isActive) {
        if (now < this.startDate) {
            this.status = "Scheduled";
        } else if (now >= this.startDate && now <= this.endDate) {
            this.status = "Active";
        } else if (now > this.endDate) {
            this.status = "Ended";
        }
    } else {
        this.status = "Ended";
    }
    next();
});

const Campaign = mongoose.model("Campaign", campaignSchema);

export default Campaign;
