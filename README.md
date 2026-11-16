<p align="center">
  <img src="assets/icon.png" width="124" alt="QuizGuard app icon" />
</p>

<h1 align="center">QuizGuard</h1>

<p align="center">
  <strong>Secure, QR-based MCQ exams — built for teachers and students.</strong><br />
  Create an exam, share a code or QR, and let students join in seconds.
</p>

<p align="center">
  <img alt="Expo SDK 52" src="https://img.shields.io/badge/Expo-SDK%2052-141413?style=flat-square&logo=expo&logoColor=E3E2C3" />
  <img alt="React Native 0.76" src="https://img.shields.io/badge/React%20Native-0.76-272727?style=flat-square&logo=react&logoColor=E3E2C3" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-6A6A67?style=flat-square&logo=typescript&logoColor=E3E2C3" />
  <img alt="Platforms" src="https://img.shields.io/badge/platforms-Android%20%C2%B7%20iOS%20%C2%B7%20Web-8B8A87?style=flat-square" />
</p>

> **Status:** frontend prototype. Every screen is implemented, but there is no
> backend, database, or real authentication yet — uploads, login, and the
> student exam are simulated locally. See [Known limitations](#known-limitations).

---

## Overview

QuizGuard is a cross-platform **Expo / React Native** app with two roles:

| Role | What they can do |
| --- | --- |
| **Teacher** | Sign in, manage a dashboard of exams, upload a paper, share a QR code or join code, rename/delete exams, switch appearance. |
| **Student** | Enter a join code or scan a QR code, then sit the demo paper: briefing, timed MCQs with a question palette, and a submission summary. |

The experience is deliberately calm and focused: a charcoal and cream palette,
a floating capsule tab bar, clear typography, and motion that respects the
system "reduce motion" setting.

## Features

### Teacher

- **Dashboard** — total / live / scheduled counts, filters, and a clean exam list.
- **Upload a paper** — pick a PDF, XLS, or XLSX file (max 20 MB), watch progress, and cancel at any time.
- **Success feedback** — an animated confetti sheet plus an Android heads-up notification: *"Upload complete — Midterm paper uploaded successfully."* Tapping it returns to Home.
- **QR sharing** — show the exam QR and code, then download the QR as a PNG or share it with the system sheet.
- **Exam management** — long-press a card to rename or delete it, with a confirmation dialog for deletes.
- **Appearance** — dark and light themes, both built from the same design tokens.

### Student

- **Join by code** — a focused entry screen with a large, tappable code field. The scanner prefills it with the detected QR text; resolving a code to a real paper needs a backend.
- **Scan a QR** — full-screen camera with a dimmed frame, torch toggle, and a friendly permission flow that falls back to system Settings when Android will not ask again.
- **Preview the exam UI** — a cream demo card below **Continue** opens a five-question sample paper without any backend, so the whole student journey can be reviewed today.
- **Exam instructions** — candidate details, duration, marks, and integrity rules, with a fixed **Start Exam Now** button.
- **Timed exam** — live countdown (auto-submits at zero), a tappable question palette, animated progress, one-tap MCQs, and a review-before-submit dialog.
- **Submission summary** — animated confirmation with the answered count, timestamp, and an honest "saved locally" status.
- **Built for both modes** — the exam screens use the app palette, respect reduce-motion, and stay readable in light mode.

## How it fits together

```text
              ┌──────────────────────┐
              │   Landing  (/)       │
              └───────┬──────────────┘
          Teacher     │      Student
                  ┌───┴────┐
                  ▼        ▼
          /teacher/login   /student/join
                  │        /student/scan
                  ▼           │
        /teacher  ·  /teacher/upload  ·  /teacher/profile
                              │
                              ▼
                    /student/instructions
                              ▼
                        /student/exam
                              ▼
                       /student/result
```

Expo Router turns the file tree into routes, so there is no route table to
maintain. Shared state lives in four small **Zustand** stores (auth, exams,
theme, student attempt), which is how uploading on one screen instantly updates
Home on another — and how the exam keeps its answers while moving between
routes.

A full beginner-friendly walkthrough — folder map, state flow, theme system,
and where a real backend would plug in — is in **[ARCHITECTURE.md](ARCHITECTURE.md)**.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [Expo](https://expo.dev) SDK 52 · React Native 0.76 |
| Language | TypeScript (strict) |
| Navigation | Expo Router (file-based, typed routes) |
| State | Zustand |
| UI | Custom components, `@expo/vector-icons`, Reanimated-free `Animated` |
| Native APIs | Camera, Document Picker, File System, Sharing, Haptics, Notifications |
| Builds | EAS Build (cloud APK) |

## Getting started

### Prerequisites

- Node.js 18+ and npm
- The [Expo Go](https://expo.dev/go) app on your phone (for quick preview), **or**
  an Android/iOS development build for native modules
- An Expo account only if you want to build an APK

### Run locally

```bash
git clone https://github.com/karanRatiya123/Quiz_Guard.git
cd Quiz_Guard
npm install
npx expo start
```

Then:

- press **`w`** to open the web version at `http://localhost:8081`
- scan the terminal QR with **Expo Go** to open it on a phone
- press **`a`** / **`i`** to run a local native build (requires Android Studio / Xcode)

> Expo Go includes only its bundled native modules. Everything this app uses is
> supported there, but a custom development build is recommended once you add
> native libraries.

### Useful commands

| Command | What it does |
| --- | --- |
| `npm start` | Start the Metro dev server |
| `npm run web` | Start directly in the browser |
| `npm run android` | Local native Android run |
| `npm run lint` | ESLint via Expo |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run icons` | Regenerate every icon/logo PNG from one dot grid |
| `npm run build:apk` | Cloud-build the installable Android APK |

### Build a standalone APK

```bash
npx eas-cli@latest login
npm run build:apk
```

The `preview` profile in [`eas.json`](eas.json) produces an **internal-distribution
APK** — a normal release build with the JavaScript bundled in, so it opens from
the phone's launcher without Metro or a development client. Install it on a
device, and the app runs exactly like the web preview.

## Project structure

```text
src/
  app/            routes and layouts (Expo Router)
    teacher/      login + (tabs): home, upload, profile
    student/      join, scanner, instructions, exam, result
  components/     reusable UI (auth, brand, exams, feedback, navigation, student, ui)
  constants/      palette and design tokens
  hooks/          theme, motion, and animation helpers
  services/       upload simulation, local notifications, demo paper
  store/          Zustand stores: auth, exams, theme, student attempt
  types/          shared TypeScript types
  utils/          pure formatting helpers
assets/           generated icons, splash, logo, notification icon
scripts/          icon generator (one source of truth)
```

`android/` and `ios/` are generated by Expo (Continuous Native Generation) and
are intentionally not committed.

## Design system

The interface is built from one six-colour palette and shared spacing, radius,
and type scales. Screens never hard-code colours — they ask the theme for a
semantic token such as `surface` or `textMuted`, which is what makes both modes
work without per-screen branches.

| Swatch | Name | Hex | Typical use |
| :---: | --- | --- | --- |
| <img alt="" width="28" src="https://img.shields.io/badge/-E3E2C3-E3E2C3?style=flat-square" /> | Healing Springs | `#E3E2C3` | Primary accent, cream cards, selected tabs |
| <img alt="" width="28" src="https://img.shields.io/badge/-C1C1A9-C1C1A9?style=flat-square" /> | Swing Sage | `#C1C1A9` | Muted text, secondary accents |
| <img alt="" width="28" src="https://img.shields.io/badge/-8B8A87-8B8A87?style=flat-square" /> | Heavy Rain | `#8B8A87` | Tertiary text, borders |
| <img alt="" width="28" src="https://img.shields.io/badge/-6A6A67-6A6A67?style=flat-square" /> | Iron-ic | `#6A6A67` | Dark cards, secondary controls |
| <img alt="" width="28" src="https://img.shields.io/badge/-272727-272727?style=flat-square" /> | Dire Wolf | `#272727` | Surfaces, ink |
| <img alt="" width="28" src="https://img.shields.io/badge/-141413-141413?style=flat-square" /> | Distinctive Lack of Hue | `#141413` | App background, near-black |

## Brand assets

Every icon is generated from an 11 × 11 dot grid, so the launcher icon, adaptive
layers, splash, favicon, notification glyph, and in-app mark always stay in sync:

```bash
npm run icons
```

The source of truth is [`scripts/generate-icons.mjs`](scripts/generate-icons.mjs);
the generated files live in [`assets/`](assets/).

## Known limitations

These are intentional placeholders for the frontend prototype, not bugs:

- **No backend.** Uploads simulate progress for about two seconds and never leave the device; exams are seeded in memory and reset when the app restarts.
- **Demo student exam.** Both the "Continue" button and the preview card open a fixed five-question paper. The code is only displayed; answers live in memory, are not graded, and are not sent anywhere.
- **No real auth.** Login checks an email shape and a 6+ character password, then opens the teacher area. There is no account, token, or server session.
- **Fixed demo identity.** The profile shows "Alex Rivera" until a user system exists.
- **Placeholder join links.** QR codes encode `https://quizguard.app/join/<code>`, a reserved demo domain.
- **Notifications are local.** The "upload complete" banner is generated on the device; no push service or token is involved.
- **Naming.** Some strings still say *QuizGuard* while the store/config name is *Secure Exam*; the user-facing name is **QuizGuard**.

The screens are built so these can be replaced behind `src/services/` and
`src/store/` without redesigning the UI — see section 6 of ARCHITECTURE.md.

## License

Released under the MIT License. See [LICENSE](LICENSE).
