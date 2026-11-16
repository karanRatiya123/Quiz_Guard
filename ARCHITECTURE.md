# Secure Exam — codebase guide for beginners

This file explains how the app is put together: what each folder does, how a
screen works, how data moves, and why things were built this way.

Read this first, then open the files it points to. The source files also carry
short "why" comments where the code is not obvious.

> **Important:** this is a front-end only project. There is no server, no
> database, and no real authentication yet. The sections below say exactly what
> is simulated and where a real backend would plug in.

---

## 1. What the app is

A React Native (Expo) app with two roles:

- **Teacher** — sign in, see a dashboard of exams, upload an exam paper, show a
  QR code students can scan, rename/delete exams, change appearance.
- **Student** — join with a code or scan a QR code.

The same code runs in three places:

| Target | Command | What runs it |
| --- | --- | --- |
| Web (fastest to iterate) | `npx expo start` then press `w` | `react-native-web` in the browser |
| Android phone | APK built on EAS (`npm run build:apk`) | bundled JS, no dev server needed |
| iOS | not built yet | — |

`npx expo start` only serves the app. It does **not** put the app on the phone;
the phone needs the standalone APK built in the cloud.

---

## 2. The one idea that explains the whole project

**Every file inside `src/app/` is a screen, and its folder path is its URL.**

Expo Router turns the file tree into navigation, so there is no central list of
routes to maintain:

```
src/app/index.tsx                  → /
src/app/teacher/login.tsx          → /teacher/login
src/app/teacher/(tabs)/index.tsx   → /teacher
src/app/teacher/(tabs)/upload.tsx  → /teacher/upload
src/app/student/scan.tsx           → /student/scan
```

`(tabs)` is a **group**: the parentheses mean "do not put this in the URL". The
group exists only so the three teacher screens share one tab bar. That is why
`/teacher/upload` works even though the file lives in `(tabs)/upload.tsx`.

`_layout.tsx` files are not screens. They are the **containers** around the
screens in that folder:

- `src/app/_layout.tsx` wraps the entire app (fonts, splash, status bar, error
  boundary).
- `src/app/teacher/(tabs)/_layout.tsx` wraps the three teacher tabs and swaps
  in the floating capsule tab bar.

Navigation itself is done with functions from `expo-router`:

```ts
router.push('/student/scan');   // add a screen on top (back goes back)
router.replace('/teacher');     // swap the current screen (no back)
router.navigate('/teacher');    // go there, reusing it if it already exists
router.back();
```

---

## 3. Folder map

```
src/
  app/            screens and layouts (routes) — no reusable widgets here
  components/     reusable UI ("dumb" pieces, no routing decisions)
    auth/         login form + its inputs and decoration
    brand/        logo mark, dot field, chevrons, provider glyphs
    exams/        rename/delete dialogs and the long-press action sheet
    feedback/     success bottom sheet + confetti
    navigation/   the floating tab bar
    ui/           small shared pieces (role row, join option)
  constants/      colours and design tokens (spacing, radius, type)
  hooks/          small reusable React hooks (theme, animations, motion)
  services/       side effects that are not UI (upload, notifications)
  store/          app-wide state with Zustand (auth, exams, theme)
  types/          shared TypeScript types
  utils/          pure functions (formatting)
```

Outside `src/`:

| File | Job |
| --- | --- |
| `app.json` | Expo config: name, icons, splash, permissions, plugins |
| `eas.json` | cloud build profiles (`preview` = installable APK) |
| `scripts/generate-icons.mjs` | generates every PNG icon/logo from one dot grid |
| `assets/` | generated icons, splash, logo, notification icon |

The rule of thumb: **routes decide *when*, components decide *how it looks*,
services/stores decide *what happens to the data*.**

---

## 4. How a screen file is built

Almost every screen follows the same shape. Read
`src/app/teacher/(tabs)/profile.tsx` as a simple example:

```tsx
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();       // notch / status bar padding
  const colors = useTheme();                // current palette (dark or light)
  const styles = useThemedStyles(createStyles); // styles for that palette

  const exams = useExamStore((state) => state.exams); // read shared state

  // ...local state, event handlers...

  return <ScrollView>...</ScrollView>;      // what the user sees
}
```

Four ideas you will see in every screen:

1. **Hooks at the top.** Hooks must run in the same order every render, so they
   are always called before any `return`.
2. **State is either local or shared.**
   - Local (`useState`) = only this screen cares (a text field, a dialog flag).
   - Shared (Zustand store) = other screens care (the exam list, the theme).
3. **Imports use `@/`**, which means `src/`. `@/store/examStore` is
   `src/store/examStore.ts` (see `tsconfig.json`).
4. **Styles are created from the palette**, not hard-coded, so dark/light mode
   works. The factory is defined once at the bottom of the file:

```tsx
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    title: { ...typography.title1, color: colors.text },
  });
```

---

## 5. State management (Zustand)

There are three stores, each a plain object created once and shared by every
screen:

| Store | Holds | Who reads it |
| --- | --- | --- |
| `src/store/authStore.ts` | the chosen role (`teacher` / `student`) | landing screen, sign out |
| `src/store/examStore.ts` | the list of exams + add/rename/delete | Home, Upload, Profile |
| `src/store/themeStore.ts` | `dark` or `light` | `useTheme()` everywhere |

### How to read a store

```ts
// src/store/authStore.ts
export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  setRole: (role) => set({ role }),
  reset: () => set({ role: null }),
}));
```

- `create` makes a module-level store — no provider or context needed.
- `set({ role })` replaces those fields and notifies subscribers.
- A component subscribes to **one slice** so it only re-renders when that slice
  changes:

```ts
const exams = useExamStore((state) => state.exams);
const deleteExam = useExamStore((state) => state.deleteExam);
```

### Why updates copy arrays

```ts
exams: state.exams.filter((exam) => exam.id !== id)
```

`filter` returns a new array. React compares references; a new array tells it
"the list changed, re-render". Mutating the old array would not notify anyone.

### What is NOT persisted

These stores live in memory. Reloading the app (or cold-starting the APK) resets
the exams to the seeded samples and the role to `null`. Persistence would be a
one-line plug-in with Zustand's `persist` middleware plus AsyncStorage — it is
just not wired up yet.

---

## 6. There is no API, database, or real authentication

This is deliberate: the UI was built first so it can be reviewed without a
server. Here is the honest mapping of what exists versus what is simulated.

| Concern | What the code does today | Where it lives |
| --- | --- | --- |
| "Upload paper" | fake progress over ~2 seconds, then resolves | `src/services/uploadPaper.ts` |
| Exam list | 5 hard-coded sample exams | `src/store/examStore.ts` (`SEED_EXAMS`) |
| Login | checks email shape + 6-character password, then navigates | `src/components/auth/TeacherLoginForm.tsx` |
| Account identity | fixed name/email "Alex Rivera" | `profile.tsx`, Home avatar |
| QR code target | placeholder URL `https://quizguard.app/join/<code>` | `Home` |
| Notifications | local notification, generated on the device | `src/services/uploadNotifications.ts` |
| Student join | form accepts a code; scanning returns the QR text | `student/join.tsx`, `student/scan.tsx` |

### Where a real backend plugs in

1. **Upload** — `uploadPaper()` already returns a promise plus a `cancel`
   function. Replace the `delay` loop with a real request and keep the same
   signature; the Upload screen does not need to change.

   ```ts
   // today (simulated)
   const promise = (async () => {
     for (let step = 1; step <= STEPS; step += 1) {
       await delay(STEP_MS);
       onProgress(step / STEPS);
     }
     return { uri: file.uri };
   })();

   // later (real)
   const xhr = new XMLHttpRequest();
   xhr.upload.onprogress = (e) => onProgress(e.loaded / e.total);
   // ... send FormData to your endpoint ...
   ```

2. **Exams** — replace `SEED_EXAMS` with data fetched on app start, and have
   `addExam`/`renameExam`/`deleteExam` call the server, then update the store.
3. **Login** — `submit` in `TeacherLoginForm` currently just calls
   `router.replace('/teacher')`. It would call the auth endpoint, save the token
   (e.g. `expo-secure-store`), then navigate.
4. **Auto-submit / late joins switches** in Profile are local `useState` only;
   they are not saved or sent anywhere.
5. **Persistence** — add `persist` to the Zustand stores if state must survive
   a reload.

The UI never assumes a backend exists, so these changes stay contained in
`services/` and `store/`.

---

## 7. The theme system (why styles are factories)

The palette is locked to six colours (`src/constants/colors.ts`):

`#E3E2C3` cream · `#C1C1A9` sage · `#8B8A87` grey · `#6A6A67` iron ·
`#272727` ink · `#141413` near-black

`darkColors` and `lightColors` expose the same names (`bg`, `text`, `accent`…)
with different values, so a component never asks "am I dark?" — it asks for
`colors.surface` and gets the right thing.

The chain is:

```
themeStore.mode
      ↓
useTheme()            → returns darkColors or lightColors
      ↓
useThemedStyles(createStyles)
      ↓
StyleSheet.create(...) memoized per palette
      ↓
<View style={styles.root} />
```

`useThemedStyles` uses `useMemo` keyed on the palette, so styles are rebuilt
only when the mode flips, not on every render. That is why `createStyles` must
live at module scope: a factory defined inside the component would be a new
function each render and defeat the memo.

The login screen is the exception: it always uses `loginColors` because the
approved design is always dark.

---

## 8. Data flow example: uploading a paper

This is the best end-to-end example in the app. Follow it once and most of the
codebase will make sense.

```
Home  ──tap "New exam"──▶  router.navigate('/teacher/upload')
                                │
                                ▼
                     upload.tsx (the screen)
                                │
               tap drop zone ───┤ DocumentPicker.getDocumentAsync()
                                │        │
                                │        └─ validate PDF/XLS/XLSX + 20 MB
                                │
                                ▼
                   file preview (name, size, type chip)
                                │
               tap "Upload" ────┤ prepareUploadNotifications()  (permission)
                                │ uploadPaper(file, onProgress)
                                │        │
                                │        └─ fake progress 0 → 98% → 100%
                                │
                                ▼
                 promise resolves ▶ addExam(...)        ← Zustand update
                                │   notifyUploadComplete(title)
                                │   setUploadedTitle(title)
                                ▼
                 SuccessSheet (confetti) + phone notification
                                │
        tap "Go to home" ───────┴────── tap the notification
                                │
                                ▼
                 router.navigate('/teacher') → Home re-renders
                    (it subscribed to examStore.exams)
```

Key detail: the Upload screen never edits the exam list directly. It calls
`addExam`, and **Zustand re-renders every screen that subscribed** — Home's
list updates even though Home was not open. This is the main advantage of
shared state over passing props down.

If the upload is cancelled mid-progress, `UploadCancelledError` is thrown and
the screen deliberately swallows it: cancelling is not an error. The `mounted`
ref prevents a late progress tick from calling `setState` after the screen
unmounted.

---

## 9. Notifications flow

`src/services/uploadNotifications.ts` wraps `expo-notifications`:

| Function | When | Why |
| --- | --- | --- |
| `prepareUploadNotifications()` | when Upload is tapped | creates the Android channel + asks permission at a sensible moment |
| `notifyUploadComplete(title)` | when the fake upload resolves | posts "Upload complete / ‹name› uploaded successfully." |
| `addUploadNotificationTapListener(cb)` | upload screen mounts | turns a notification tap into "close sheet, go Home" |
| `dismissUploadNotifications()` | "Go to home" pressed | removes the banner once it has been handled |

Android needs three things for a heads-up banner, and all three are set:

1. a channel with `importance: HIGH` (created at runtime),
2. `shouldShowAlert: true` **and** `shouldPlaySound: true` in the foreground
   handler (Android suppresses the banner when sound is off),
3. the `POST_NOTIFICATIONS` permission (added by the `expo-notifications`
   plugin during prebuild).

On web every function returns immediately, so `localhost:8081` is unaffected.

---

## 10. Platform differences (web vs native)

The app is one codebase, but a few things must differ. The pattern is always a
guard plus a native implementation:

| Feature | Web | Android / iOS |
| --- | --- | --- |
| Download QR | `<a download>` via DOM | write PNG to cache, open share sheet |
| Haptics | skipped | `expo-haptics` |
| Notifications | no-op | `expo-notifications` |
| Animations | JS driver | native driver |
| Status bar | browser | `expo-status-bar` |

`Platform.OS === 'web'` is a runtime check. `process.env.EXPO_OS` is inlined at
build time, so it is used for cheap early-outs (haptics) where the branch should
disappear entirely from the bundle.

Anything DOM-related (`document.createElement`) must never run on native — it
would crash with "document is not defined". See `downloadQr` in Home.

---

## 11. Animations

Two rules keep motion consistent:

1. **Respect "reduce motion".** `useReduceMotion()` reads the OS setting. When
   it is on, screens jump straight to the end state instead of animating.
2. **Use `Animated` values created once.** `useAnimatedValue` (or `useRef(new
   Animated.Value(0))`) keeps the value stable across renders; creating it
   inline would restart the animation every render.

The success sheet composes its sequence explicitly:

```
backdrop fade → sheet spring → badge pop → ring pulse + confetti → copy → button
```

The confetti positions are computed once at module load from an index (angles,
distance, size, spin). That is why the burst is identical every time instead of
re-randomising on each render.

---

## 12. Styling and layout conventions

- 4/8-point spacing rhythm: `spacing.xs = 4`, `sm = 8`, `md = 16`, `lg = 24`.
- Radii come from `radius`: controls 12, cards 20, panels 24, pills 999.
- Type comes from `typography` (`largeTitle`, `title1`, …), never ad-hoc sizes.
- Screens scroll with `ScrollView` and add `insets.top` / `insets.bottom` so
  content clears the notch and gesture bar.
- The floating tab bar overlays content. Screens import
  `useFloatingTabBarSpace()` for the exact bottom padding needed, rather than
  guessing a number.

The tab bar itself is a custom component (`FloatingTabBar`) passed to
`<Tabs tabBar={...}>`. It receives the navigator's `state`, `descriptors` and
`navigation` props and draws three equal-width items. The selected item grows
into a cream pill; tapping emits the standard `tabPress` event so accessibility
and deep links keep working.

---

## 13. Icons and assets

`scripts/generate-icons.mjs` is the single source of truth. It stores the logo
as an 11 × 11 grid of brightness values and renders every PNG from it
(`icon.png`, adaptive icon layers, splash, favicon, notification icon, marks).
Changing the grid and running `npm run icons` updates the whole set.

`assets/` files are referenced from two places:

- `app.json` for native/OS surfaces (launcher icon, splash, notification icon).
- `src/components/brand/Mark.tsx` for the in-app mark, via `require(...)` so
  Metro bundles the image.

---

## 14. Reading the code: a practical method

1. Start at `src/app/_layout.tsx` to see the global providers and the route
   stack.
2. Open the screen that shows the feature (e.g. `(tabs)/upload.tsx`).
3. Read the imports — they tell you which store, service, or components the
   screen depends on.
4. Read the `useState`/store selectors to see what data it owns.
5. Read the event handlers (`pickFile`, `upload`, `cancelUpload`) to see the
   actions.
6. Read the JSX from top to bottom; it usually follows the visual order.
7. Only then look at styles at the bottom.

Useful searches while learning:

```
grep "addExam"          → who changes the exam list
grep "useTheme"         → how a file participates in theming
grep "router.navigate"  → every navigation edge
grep "Platform.OS"      → every web/native branch
```

Several key files also open with a short "why" comment: `src/app/_layout.tsx`
(app shell), `src/app/index.tsx` (role branch), `src/app/teacher/(tabs)/upload.tsx`
(the whole upload journey), `src/store/examStore.ts` (why updates copy arrays),
`src/services/uploadNotifications.ts` (banner requirements), and
`src/components/feedback/SuccessSheet.tsx` (animation order). Start there when
a file looks unfamiliar.

---

## 15. Glossary

| Term | Meaning here |
| --- | --- |
| **Route** | A file in `src/app/`; its path is the URL |
| **Layout** | `_layout.tsx`; wraps child routes (Stack or Tabs) |
| **Group** | A folder in parentheses, e.g. `(tabs)`; does not affect the URL |
| **Store** | A Zustand object holding shared state |
| **Selector** | `useStore(state => state.x)`; subscribes to one slice |
| **Hook** | A function starting with `use`; shares stateful logic |
| **Service** | Code that performs a side effect (upload, notification) |
| **Token** | A named design value (`spacing.md`, `colors.text`) |
| **CNG** | Continuous Native Generation: Expo builds `android/` from config |
| **EAS** | Expo Application Services; builds the APK in the cloud |
| **Preview build** | Internal-distribution APK that runs standalone (no Metro) |

---

## 16. Known placeholder values

These are intentional stand-ins, not bugs to "fix" without a decision:

- Sample exams (`SEED_EXAMS`) and the fixed profile identity.
- Login accepts any well-formed email and a 6+ character password.
- QR links point at `https://quizguard.app/join/<code>`.
- Some strings still say **QuizGuard** while the app name is **Secure Exam**.
- Upload progress is simulated; nothing leaves the device.
