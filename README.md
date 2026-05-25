# MeetingMind

MeetingMind is a beginner-friendly meeting assistant built with React, Next.js, and Tailwind CSS. Paste meeting notes, summarise them, turn action items into tasks, and manage those tasks in a clean dashboard.

## Features

- Paste meeting notes into a text box
- Summarise meeting notes into Summary, Key Decisions, Action Items, Owners, and Due Dates
- Convert detected action items into reminder-style tasks
- Edit, delete, and mark tasks complete
- Save notes, summaries, and tasks in browser localStorage
- Includes sample demo data
- Responsive professional UI

## Folder Structure

```text
meetingmind/
  app/
    globals.css      Global Tailwind styles and base page styling
    layout.tsx       Shared app layout and page metadata
    page.tsx         Main MeetingMind interface and app logic
  next.config.mjs    Next.js configuration
  package.json       Scripts and dependencies
  postcss.config.mjs Tailwind/PostCSS setup
  tailwind.config.ts Tailwind content scanning and theme extension
  tsconfig.json      TypeScript configuration
  README.md          Setup and project notes
```

## How to Run

1. Open a terminal in this folder.
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open the local address shown in the terminal, usually:

```text
http://localhost:3000
```

## Notes for Beginners

The summariser in this demo runs in the browser with simple rule-based extraction, so you can test the full product flow without setting up an AI API key. A production version could replace the `summariseMeeting` function in `app/page.tsx` with a real AI API call.
