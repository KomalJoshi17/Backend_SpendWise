const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");

// Load environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Fix callback URL issue permanently
let CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

if (!CALLBACK_URL) {
  CALLBACK_URL = "https://backend-spendwise.onrender.com/api/auth/google/callback";
}

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
        passReqToCallback: false,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { id, displayName, emails, photos } = profile;

          const email = emails?.[0]?.value || null;
          const picture = photos?.[0]?.value || null;

          if (!email) {
            return done(new Error("Google did not return an email"), null);
          }

          return done(null, {
            id,
            email: email.toLowerCase(),
            name: displayName,
            picture,
          });
        } catch (error) {
          console.error("Google OAuth Error:", error);
          return done(error, null);
        }
      }
    )
  );

  console.log("✅ Google OAuth strategy configured with callback:", CALLBACK_URL);
} else {
  console.warn("⚠️ Google OAuth disabled — missing CLIENT ID or SECRET");
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

module.exports = passport;
