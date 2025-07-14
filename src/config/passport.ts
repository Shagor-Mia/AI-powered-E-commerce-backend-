import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userModel from "../models/user.model";
import { UserRole } from "../constants/enum";

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const user = await userModel.findById(id);
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await userModel.findOne({ googleId: profile.id });

        if (existingUser) {
          return done(null, existingUser);
        }

        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("Email not found in Google profile"));

        // Optional: Check if user already exists with same email but not via Google
        let user = await userModel.findOne({ email });

        if (user) {
          // Link Google ID to existing user
          user.googleId = profile.id;
          user.isVerified = true;
          user.image = user.image || profile.photos?.[0]?.value;
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = new userModel({
          googleId: profile.id,
          email,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          image: profile.photos?.[0]?.value,
          isVerified: true,
          role: UserRole.USER,
        });

        await user.save();
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);
