import Campaign from "../models/campaign.model.js";

export const createCampaign = async (req, res) => {
    try {
        const { name, description, group, discountPercentage, startDate, endDate, isActive, isGlobal } = req.body;

        const sDate = new Date(startDate);
        const eDate = new Date(endDate);

        if (sDate >= eDate) {
            return res.status(400).json({ message: "Thời gian bắt đầu phải trước thời gian kết thúc." });
        }

        // Overlap validation
        if (isActive !== false) {
            const overlapQuery = {
                isActive: true,
                status: { $in: ["Scheduled", "Active"] },
                $or: [
                    { startDate: { $lte: eDate }, endDate: { $gte: sDate } }
                ]
            };

            if (isGlobal) {
                overlapQuery.isGlobal = true;
            } else {
                overlapQuery.group = group;
                overlapQuery.isGlobal = false;
            }

            const overlappingCampaign = await Campaign.findOne(overlapQuery);

            if (overlappingCampaign) {
                return res.status(400).json({
                    message: `Lỗi: Đã có chiến dịch (${overlappingCampaign.name}) đang chạy hoặc lên lịch trong khoảng thời gian này cho nhóm sản phẩm này.`,
                    conflictId: overlappingCampaign._id
                });
            }
        }

        // Determine initial status based on dates
        const now = new Date();
        let status = "Scheduled";
        if (isActive === false) status = "Ended";
        else if (now >= sDate && now <= eDate) status = "Active";
        else if (now > eDate) status = "Ended";

        const newCampaign = await Campaign.create({
            name, description, group: isGlobal ? undefined : group, discountPercentage, startDate: sDate, endDate: eDate, isActive, isGlobal, status
        });

        res.status(201).json(newCampaign);
    } catch (error) {
        console.error("Error creating campaign:", error);
        res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
    }
};

export const getAllCampaigns = async (req, res) => {
    try {
        const campaigns = await Campaign.find({}).sort({ createdAt: -1 });
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
    }
};

export const getActiveCampaigns = async (req, res) => {
    try {
        const campaigns = await Campaign.find({
            status: "Active",
            isActive: true
        }).sort({ createdAt: -1 });
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
    }
};

export const toggleCampaignStatus = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) return res.status(404).json({ message: "Campaign not found" });

        campaign.isActive = !campaign.isActive;

        // Recalculate status
        if (!campaign.isActive) {
            campaign.status = "Ended";
        } else {
            const now = new Date();
            if (now < campaign.startDate) campaign.status = "Scheduled";
            else if (now >= campaign.startDate && now <= campaign.endDate) campaign.status = "Active";
            else campaign.status = "Ended";
        }

        await campaign.save();
        res.json(campaign);
    } catch (error) {
        res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
    }
};

export const deleteCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findByIdAndDelete(req.params.id);
        if (!campaign) return res.status(404).json({ message: "Campaign not found" });
        res.json({ message: "Xoá chiến dịch thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
    }
};
