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
    const updatableFields = [
      // Theme
      "themePreset",
      "themeMode",
      // Custom Colors
      "primaryColor",
      "secondaryColor",
      "accentColor",
      "bgColor",
      "cardBgColor",
      "textPrimaryColor",
      "textSecondaryColor",
      "borderColor",
      // Typography
      "headingFont",
      "bodyFont",
      "headingScale",
      "bodyScale",
      // Favicon & Mobile Logo
      "favicon",
      "mobileLogoImage",
      // Integrations
      "googleAnalyticsId",
      "facebookPixelId",
      "tiktokPixelId",
      // Cookie Consent
      "cookieConsentEnabled",
      "cookieConsentTitle",
      "cookieConsentText",
      // Custom CSS
      "customCSS",
      // Catalog
      "productsPerPage",
      "defaultSort",
      "showOutOfStock",
      // Home layout
      "homeLayout",
      "gridColumns",
      "featuredCount",
      "heroSlogan",
      "bestSellerTitle",
      "flashSaleTitle",
      "showChatBot",
      "flashSaleEndDate",
      "heroSlides",
      "promoPopupEnabled",
      "promoPopupTitle",
      "promoPopupText",
      "promoPopupImage",
      "promoPopupDelay",
      // Footer
      "footerHotline",
      "footerEmail",
      "footerAddress",
      "footerAboutText",
      "footerCopyright",
      "footerColumns",
      "footerFacebook",
      "footerInstagram",
      "footerZalo",
      "footerTiktok",
      "footerYoutube",
      "footerPinterest",
      // Branding
      "logoText",
      "logoSubtext",
      "logoImage",
      "announcementEnabled",
      "announcementText",
      "announcementBg",
      "announcementLink",
      // SEO
      "seoTitle",
      "seoMetaDesc",
      "navigationItems",
      "storeWorkingHours",
    ];

    let config = await StoreConfig.findOne();
    if (!config) {
      config = new StoreConfig();
    }

    updatableFields.forEach((field) => {
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
