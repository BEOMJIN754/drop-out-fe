# DROP

Vue 3 + Vite frontend for an editorial fashion release calendar.

## Run

```sh
npm install
npm run dev
```

`npm run build` creates a production build in `dist`. `npm run preview` serves it locally.

## Features

- Responsive, monochrome home with featured, upcoming, and recent releases
- Discover page with status, brand, and release-type filters
- Search by brand, collection title, and release type
- Brand directory with follow/unfollow
- Demo login and persistent browser-local profile/follows
- Conditional My Drop: hidden when logged out, onboarding when no brands are followed, and personalized grid/list when following brands
- Release detail dialog and downloadable `.ics` calendar events
- Keyboard-accessible dialogs with focus management and Escape support

Authentication and release schedules are mock data. The snapshot is September 8, 2026; release status is explicitly defined in `src/data.js` to keep demo states stable. Editorial images are bundled locally from Unsplash and do not represent verified brand products. Fonts load from Google Fonts with system fallbacks. No backend or live account service is connected.

## Browser checks

```sh
npx playwright install chromium
npm run test:e2e
```

The browser suite covers the three authentication/follow states, persistence, combined filters, search, calendar export, and mobile/tablet layouts.
