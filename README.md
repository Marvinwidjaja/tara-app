# TARA (NBAY 6170 · Team 10)

One activity plan shared with every caregiver, with the parent in charge. There are **two ways to
sign in**:

- **Parents** sign up, set goals, build activities and assign them to caregivers, then see a daily
  summary and weekly report.
- **Caregivers** join with an invite code from the parent, then sign in to see their activities in
  their own language (English, Spanish, Mandarin, Tagalog), mark each one done or skipped, and
  message the parent.

- **App:** Expo SDK 58 (iOS, Android, web), in `src/`
- **Backend:** TypeScript + Express + PostgreSQL, in [`../TARA_backend`](../TARA_backend/README.md).
  The app always talks to it; all data lives in its PostgreSQL database.

## Run it

You need PostgreSQL and two terminals. Full backend setup is in the
[backend README](../TARA_backend/README.md).

```bash
# Terminal 1: the backend (http://localhost:4000)
cd ../TARA_backend
npm install && npm run db:create && npm run seed   # first time only
npm run dev

# Terminal 2: the app
cd ../TARA
npm install
npm start          # then press i (iOS Simulator), a (Android Emulator) or w (web)
```

Create a parent account, or, if you ran `npm run seed` (a sample family with two weeks of
history), sign in with password `demo1234` as:

- the parent `jordan@demo.cocare` (choose **I'm a parent**)
- the caregivers `rosa@demo.cocare` (Spanish) or `li@demo.cocare` (Mandarin) (choose **I'm a caregiver**)

To try both sides at once, use two browsers (or a browser and a simulator).

The app looks for the backend on the same machine as the Expo dev server (port 4000), so it works
on the simulators, on web, and in Expo Go on a phone on the same Wi‑Fi. To point it somewhere
else, set `EXPO_PUBLIC_API_URL=http://host:port` and restart Expo with `--clear`. If the backend
isn't running, the app shows a **Can't reach TARA** screen with **Try again**.

## Deploy the web app to Vercel

Deploy the backend first ([backend README](../TARA_backend/README.md#deploy-to-vercel-with-a-neon-database))
so you have its address, then from this folder:

```bash
npx vercel link                                      # create a new project, e.g. "tara"
npx vercel env add EXPO_PUBLIC_API_URL production     # https://<api>.vercel.app
npx vercel --prod
```

`vercel.json` builds the static web app (`npx expo export --platform web` → `dist/`) and sends every
path to `index.html`, so invite links like `/join?code=…` open the join screen. The build stops with
a clear message if `EXPO_PUBLIC_API_URL` is missing or points at localhost, because the address is
baked into the app at build time (change it → redeploy).

Phones: the Vercel site works in a phone's browser. For the installed app, build it with EAS and set
`EXPO_PUBLIC_API_URL` there too.

## Inviting a caregiver

1. **Family → + Caregiver**: name, language, usual days, and what they may see (your goals, how the
   day went). A phone number is optional.
2. **Make invite code**. Then **Share invite** (the phone's share sheet: WhatsApp, Messages, email…),
   **Copy code** or **Copy link**. The code works once and for 14 days.
3. The caregiver opens the link (it fills in the code), or opens TARA and picks **I'm a caregiver →
   Join with an invite code**. They choose their own email and password.
4. Forgot their password? Make a **New login code** for them. **Pause access** (in Edit) signs them out
   until you resume them.

The join link opens the web app (`http://<host>:8081/join?code=…`) on web, and the app itself
(`tara://join?code=…`, or Expo Go's `exp://…` link while developing) on a phone.

## How it maps to the workflow

| Step | Where | What happens |
| --- | --- | --- |
| 1. Set up the family | Sign up, **Family** | Parent account and child's age · caregivers with language and days · invite code shared however the parent likes · consent toggles for what each caregiver sees |
| 2. Pick activities | **Plan → Library** | Reviewed library filtered by the child's age, so unsafe activities aren't offered · already translated · or write your own (short numbered steps) |
| 3. Parent decides | **Plan**, **Today** | Parent sets goals and assigns each activity to a caregiver, day and time of day · warns past two per shift |
| 4. Share the plan | Caregiver's **Today** | Caregivers see their activities right away, in their language, with steps, safety notes and the parent's note · goals and "earlier today" (handoff) only if the parent allows it |
| 5. Record and report | Caregiver's **Today** and **Messages**, parent's **Reports** | Done / did it differently / skipped, how the child liked it, a note · nap and "seems unwell" (alerts the parent) · messages to the parent; questions about medicine or pickup and development worries are flagged in the parent's inbox, and TARA never diagnoses · reminder button, and an alert when a report is missing · daily summary · weekly report vs. the previous week |

## Settings

Backend settings (database, sessions, invite codes, reminders) are listed in the
[backend README](../TARA_backend/README.md#configuration-env). The app itself reads:

| Variable | Meaning |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Backend URL, default `http://<dev machine>:4000` |

## Code map

- `src/shared/`: the source of truth for code the backend also runs. `library.ts` is the reviewed
  activities, `messages.ts` translated texts, `classify.ts` sorts caregiver messages for the parent's inbox,
  `reports.ts` builds the daily and weekly reports, `types.ts` the API types. The backend copies
  these automatically on `npm run dev`, `build` and `test` (or run `npm run sync-shared` there)
- `src/app/`: screens. `(tabs)/` is the parent's Today, Plan, Family and Reports; `(caregiver)/` is
  the caregiver's Today, Messages and Me; `sign-in`, `sign-up` and `join` are for signed-out users;
  the rest are the parent's edit screens and chats
- `src/state/session.tsx`: who is signed in (parent or caregiver) and their data · `src/lib/api.ts`: backend client
- `src/lib/caregiver-text.ts`: words on the caregiver's screens in each language · `src/lib/invite.ts`: invite codes, links and sharing
- `src/components/unreachable.tsx`: the screen shown when the backend isn't running

## Limits

- Library activities and the caregiver's screens are translated; activities, notes and chat
  messages the parent writes appear as written (no machine translation).
- There are no push notifications yet: caregivers see new activities and messages when they open
  TARA (it refreshes every few seconds while open).
- A caregiver login belongs to one family. Someone who cares for children in two TARA families
  needs a different email for each.
