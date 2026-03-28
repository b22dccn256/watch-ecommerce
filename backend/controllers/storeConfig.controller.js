import StoreConfig from "../models/storeConfig.model.js";

// Gets the active config. Creates default if missing.
export const getConfig = async (req, res) => {
	try {
        let config = await StoreConfig.findOne();
        if (!config) {
            config = await StoreConfig.create({}); // Creates default
        }
        res.json(config);
	} catch (error) {
		console.log("Error in getConfig controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin updates storefront config
export const updateConfig = async (req, res) => {
	try {
        const updatableFields = ["homeLayout", "gridColumns", "heroSlogan", "bestSellerTitle", "flashSaleTitle", "showChatBot"];
        
        let config = await StoreConfig.findOne();
        if (!config) {
            config = new StoreConfig();
        }

        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                config[field] = req.body[field];
            }
        });

        const updatedConfig = await config.save();
        res.json(updatedConfig);
	} catch (error) {
		console.log("Error in updateConfig controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
