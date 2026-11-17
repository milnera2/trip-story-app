# WayStory

WayStory is an Expo app for recording group trips, pinning photos and notes, and sharing a trip story.

## Run the web preview

Copy `.env.example` to `.env.local` and fill in your Supabase project URL and publishable key. Run `npm ci`, then `npm run web`.

The profile and people migration under `supabase/migrations/` extends the existing WayStory database. Apply it there to enable username search, friend requests, blocking, and reporting. The browser preview supports the interactive trip map. The Android map currently shows a placeholder.

## Publish to GitHub Pages

From `app/`, run `node scripts/export-pages.mjs` with the production Supabase URL and publishable key in `.env.local`. Commit the resulting `waystory/`, `404.html`, and `.nojekyll` files to `main`. The site opens at https://milnera2.github.io/trip-story-app/waystory/.
