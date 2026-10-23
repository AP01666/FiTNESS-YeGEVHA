# FiTNESS YeGEVHA — Shadow System

A beginner-friendly, Solo Leveling-inspired fitness PWA branded FiTNESS YeGEVHA, using the new neon-blue fitness portrait as the app icon. It is built with plain HTML, CSS, and JavaScript.

## Included
- Custom hunter name and character selection (Sung Jin-woo / Cha Hae-in)
- 11 daily exercises across Chest, Arms, Shoulders, Back, and Legs
- 5 reps × 3 sets at Level 1; +1 rep per set each level, capped at Level 50
- Guided workout mode: one rep counted every 3 seconds, 30-second rests, automatic progression, set and rep counters, overall progress bar, and pause/resume (no skip button)
- 9 XP per exercise; a 1 XP bonus for completing all 11 exercises (100 XP total)
- Five-day streak and missed-day reset
- Boss Stage 1: 3× the normal total reps for each exercise
- Boss Stage 2: GPS-tracked run, starting at 2 km and increasing 1 km per boss
- 300 XP and one level on boss victory
- Browser local storage and basic offline app shell

## Publish using GitHub Pages (no coding experience needed)
1. Sign in to GitHub and create a new **public** repository, for example `shadow-system-fitness`.
2. Upload all files from this folder to the repository's root. Do not upload only the ZIP file.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select branch **main** and folder **/(root)**, then save.
6. Wait for GitHub Pages to publish. Your URL will look like `https://YOUR-USERNAME.github.io/shadow-system-fitness/`.
7. Open that URL in Safari on your iPhone. Tap **Share → Add to Home Screen**.

## Important notes
- GPS needs a deployed HTTPS URL, location permission, and usually an outdoor GPS signal. Keep the page open during the run.
- The map uses OpenStreetMap tiles through Leaflet. The map tiles need internet access; the app shell can be cached for offline use.
- Your progress is stored locally in that browser on that device. It does not sync automatically to other users or devices.
- This is a starter app, not a medically validated training plan. Increase difficulty carefully, use good form, and rest if you feel pain or unwell.
- Browser-based GPS tracking can be less reliable than native apps, particularly if the phone locks or Safari is backgrounded.
- The app awards 9 XP for each of 11 exercises, plus a 1 XP full-day completion bonus: **100 XP for completing all 11**.
