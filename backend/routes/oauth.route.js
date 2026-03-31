import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();

// Helper to set cookie, same as auth.controller.js
const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: "7d",
	});

	res.cookie("jwt", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
	});

	return token;
};

// --- Google ---
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
	router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

	router.get("/google/callback", 
		passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL || "http://localhost:5173"}/login`, session: false }),
		(req, res) => {
			generateTokenAndSetCookie(req.user._id, res);
			res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/`);
		}
	);
} else {
	router.get("/google", (req, res) => {
		res.status(501).json({ message: "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
	});
	router.get("/google/callback", (req, res) => {
		res.status(501).json({ message: "Google OAuth callback is not configured." });
	});
}

// --- Facebook ---
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
	router.get("/facebook", passport.authenticate("facebook", { scope: ["email"], session: false }));

	router.get("/facebook/callback", 
		passport.authenticate("facebook", { failureRedirect: `${process.env.CLIENT_URL || "http://localhost:5173"}/login`, session: false }),
		(req, res) => {
			generateTokenAndSetCookie(req.user._id, res);
			res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/`);
		}
	);
} else {
	router.get("/facebook", (req, res) => {
		res.status(501).json({ message: "Facebook OAuth is not configured. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET." });
	});
	router.get("/facebook/callback", (req, res) => {
		res.status(501).json({ message: "Facebook OAuth callback is not configured." });
	});
}

// --- GitHub ---
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
	router.get("/github", passport.authenticate("github", { scope: ["user:email"], session: false }));

	router.get("/github/callback", 
		passport.authenticate("github", { failureRedirect: `${process.env.CLIENT_URL || "http://localhost:5173"}/login`, session: false }),
		(req, res) => {
			generateTokenAndSetCookie(req.user._id, res);
			res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/`);
		}
	);
} else {
	router.get("/github", (req, res) => {
		res.status(501).json({ message: "GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET." });
	});
	router.get("/github/callback", (req, res) => {
		res.status(501).json({ message: "GitHub OAuth callback is not configured." });
	});
}

export default router;
