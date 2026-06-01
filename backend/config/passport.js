import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

// We use session: false in the routes, so serialize/deserialize are not strictly needed,
// but included to avoid passport errors.
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
};

const resolveGoogleCallbackUrl = () => {
    return process.env.GOOGLE_CALLBACK_URL?.trim() || "http://localhost:5000/api/auth/oauth/google/callback";
};

const buildOAuthDisplayName = (profile, fallbackEmail = "") => {
    const candidates = [
        profile?.displayName,
        [profile?.name?.givenName, profile?.name?.familyName].filter(Boolean).join(" "),
        profile?.name?.givenName,
        profile?.username,
        fallbackEmail ? fallbackEmail.split("@")[0].replace(/[._-]+/g, " ") : "",
    ].filter(Boolean);

    for (const candidate of candidates) {
        const normalized = String(candidate)
            .trim()
            .replace(/[^\p{L}\s]/gu, " ")
            .replace(/\s+/g, " ")
            .trim();

        if (normalized.length >= 2 && normalized.length <= 50) {
            return normalized;
        }
    }

    return "Google User";
};

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Passport Google strategy enabled");
    console.log(`Google OAuth callback URL: ${resolveGoogleCallbackUrl()}`);
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: resolveGoogleCallbackUrl()
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            if (!user) {
                // If user doesn't exist with googleId, check email
                const email = profile.emails?.[0]?.value || `${profile.id}@googleusercontent.com`;
                user = await User.findOne({ email });
                if (user) {
                    // Link to existing account
                    user.googleId = profile.id;
                    if (!user.profilePicture) user.profilePicture = profile.photos[0]?.value;
                    user.emailVerified = true;
                    await user.save();
                } else {
                    // Create new user
                    user = await User.create({
                        name: buildOAuthDisplayName(profile, email),
                        email,
                        password: generateRandomPassword(), // Dummy password since google user won't use it
                        googleId: profile.id,
                        profilePicture: profile.photos[0]?.value,
                        role: "customer",
                        emailVerified: true
                    });
                }
            } else {
                if (!user.emailVerified) {
                    user.emailVerified = true;
                    await user.save();
                }
            }
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
}

// Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "/api/auth/oauth/facebook/callback",
        profileFields: ["id", "displayName", "photos", "email"]
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ facebookId: profile.id });
            if (!user) {
                const email = profile.emails?.[0]?.value || `${profile.id}@facebook.com`;
                user = await User.findOne({ email });
                if (user) {
                    user.facebookId = profile.id;
                    if (!user.profilePicture) user.profilePicture = profile.photos[0]?.value;
                    user.emailVerified = true;
                    await user.save();
                } else {
                    user = await User.create({
                        name: buildOAuthDisplayName(profile, email),
                        email,
                        password: generateRandomPassword(),
                        facebookId: profile.id,
                        profilePicture: profile.photos[0]?.value,
                        role: "customer",
                        emailVerified: true
                    });
                }
            } else {
                if (!user.emailVerified) {
                    user.emailVerified = true;
                    await user.save();
                }
            }
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
}

// GitHub Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    console.log("Passport GitHub strategy enabled");
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/api/auth/oauth/github/callback",
        scope: ["user:email"]
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ githubId: profile.id });
            if (!user) {
                // Determine email (GitHub might not return email in basic profile)
                let email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : `${profile.username}@github.com`;
                
                user = await User.findOne({ email });
                if (user) {
                    user.githubId = profile.id;
                    if (!user.profilePicture) user.profilePicture = profile.photos[0]?.value;
                    user.emailVerified = true;
                    await user.save();
                } else {
                    user = await User.create({
                        name: buildOAuthDisplayName(profile, email),
                        email,
                        password: generateRandomPassword(),
                        githubId: profile.id,
                        profilePicture: profile.photos[0]?.value,
                        role: "customer",
                        emailVerified: true
                    });
                }
            } else {
                if (!user.emailVerified) {
                    user.emailVerified = true;
                    await user.save();
                }
            }
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
}

export default passport;
