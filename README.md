# MyDay

MyDay is a personal reminder and calendar PWA built with React, Next.js, and Tailwind CSS. It is designed for private personal use, stores data in browser localStorage first, and does not connect to Outlook, Microsoft, Google Calendar, or any external calendar account.

## What It Does

- Today dashboard as the default home screen
- Calendar with month, week, and day views
- Add, edit, and delete reminders or appointments
- Fields for title, date, start time, end time, location, notes, category, and reminder time
- Reminder choices: at time, 5 minutes before, 15 minutes before, 1 hour before, and 1 day before
- Recurring reminders: daily, weekly, and monthly
- Mark reminders as completed
- Snooze reminders for 10 minutes, 1 hour, or tomorrow
- Search reminders and appointments
- Import and export reminders as a JSON file
- Upcoming reminders dashboard
- Browser notifications when reminders are due
- PWA manifest and service worker for home screen installation
- Dark mode
- Sample reminders included

## Categories

- Work
- Personal
- Family
- School
- Health/Fitness
- Bills/Payments

## No External Calendar Sync

This app is intentionally local and simple:

- No Microsoft login
- No Google login
- No Outlook sync
- No Google Calendar sync
- No external calendar integration

Your reminders stay in this browser unless you export them.

## Folder Structure

```text
myday/
  app/
    globals.css       Shared styles and reusable button classes
    layout.tsx        App metadata and PWA manifest link
    page.tsx          Main app UI, localStorage, reminders, search, import/export
  public/
    icon.svg          App icon
    manifest.json     PWA install settings
    sw.js             Service worker for basic app caching
  next.config.mjs     Next.js config
  package.json        Scripts and dependencies
  postcss.config.mjs  Tailwind/PostCSS setup
  tailwind.config.ts  Tailwind setup
  tsconfig.json       TypeScript setup
  README.md           Setup and deployment guide
```

## Run Locally

1. Install Node.js 18 or newer.
2. Open a terminal in this project folder.
3. Install dependencies:

```bash
npm install
```

4. Start the app:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

## Install on a Phone

Android:

1. Open the deployed app in Chrome.
2. Open the browser menu.
3. Choose **Add to Home screen** or **Install app**.

iPhone:

1. Open the deployed app in Safari.
2. Tap the Share button.
3. Choose **Add to Home Screen**.

## Notifications

1. Open MyDay.
2. Go to **Today** or **Settings**.
3. Tap **Turn on notifications**.
4. Allow notifications when your browser asks.

Notifications work best when the app is open or installed on the home screen. Full background notifications usually need a backend push service, which this local-only version does not use.

## Import and Export

Use **Settings**:

- **Export reminders** downloads a `myday-reminders.json` backup.
- **Import reminders** replaces the current reminders with a JSON backup.

## Deploy to Vercel

1. Push this project to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com](https://vercel.com).
3. Create a new project.
4. Import the repository.
5. Keep the framework as **Next.js**.
6. Select **Deploy**.
7. Open the Vercel URL on your phone and install it to the home screen.

## Easy to Update Later

- Category names are kept in one list in `app/page.tsx`.
- Reminder and repeat options are kept in simple arrays.
- The app uses one localStorage key: `myday-state-v2`.
- Shared button styles live in `app/globals.css`.
- Future upgrades can move sections from `app/page.tsx` into a `components/` folder without changing the user experience.
