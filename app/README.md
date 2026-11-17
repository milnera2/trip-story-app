# WayStory

WayStory is an Expo app for recording group trips, pinning photos and notes, and sharing a trip story.

## Run the web preview

Copy `.env.example` to `.env.local` and fill in your Supabase project URL and publishable key. Run `npm ci`, then `npm run web`.

The profile and people migration under `supabase/migrations/` extends the existing WayStory database. Apply it there to enable username search, friend requests, blocking, and reporting. The browser preview supports the interactive trip map. The Android map currently shows a placeholder.
