# pasupasastra GCS

Unified Command Center For Multi-drone Operations: a QGroundControl-style ground
control station for multi-drone operations. Next.js 16 (static export) + React 19
+ TypeScript + Tailwind v4 + Zustand + Cesium, packaged as a desktop app with Tauri 2.

The UI is in Bahasa Indonesia; code and comments are in English.

## Quick start

```bash
pnpm install          # also copies Cesium assets into public/cesium
pnpm dev              # http://localhost:3000
```

Without `NEXT_PUBLIC_API_URL` the app runs in **demo mode**: the whole backend is
simulated in the browser (flight physics, missions, payload drop, failsafes,
video/AI mocks). Demo accounts:

| Username   | Password     | Role          |
| ---------- | ------------ | ------------- |
| `operator` | `pasupati`   | Operator      |
| `admin`    | `admin12345` | Administrator |

Optional mock videos: put `stream-1.mp4` … `stream-4.mp4` in `public/mock/`.
Demo data persists in `localStorage`; reset it in *Pengaturan → Koneksi*.

## Environment

| Variable               | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`  | REST base URL, e.g. `https://gcs.local/api`. Empty = demo.   |
| `NEXT_PUBLIC_WS_URL`   | Realtime base URL. Defaults to the API URL with `ws(s)://`.  |
| `NEXT_PUBLIC_USE_MOCK` | `true` forces demo mode even with an API URL.                |

Values are inlined at build time (static export), including desktop builds.

## Scripts

| Command            | Description                                  |
| ------------------ | -------------------------------------------- |
| `pnpm dev`         | Development server                           |
| `pnpm build`       | Static export to `out/`                      |
| `pnpm typecheck`   | `tsc --noEmit`                               |
| `pnpm lint`        | Biome lint + format check                    |
| `pnpm tauri:dev`   | Desktop app with hot reload                  |
| `pnpm tauri:build` | Desktop installers (`src-tauri/target/...`)  |

## Desktop (Tauri 2)

Prerequisites: Rust stable (`rustup`), plus the platform packages from
<https://tauri.app/start/prerequisites/> (WebView2 on Windows, Xcode CLT on
macOS, `webkit2gtk-4.1` and friends on Linux).

```bash
pnpm tauri:dev
NEXT_PUBLIC_API_URL=https://gcs.local/api pnpm tauri:build
pnpm tauri icon src-tauri/icons/app-icon.png   # regenerate every icon size
```

The desktop shell loads the static export from `out/`. Because dynamic segments
cannot be exported for IDs known only at runtime, detail views use query params:
`/dashboard/map?drone=<id>`, `/dashboard/video/focus?stream=<id>`,
`/dashboard/settings?tab=<tab>`.

## Features

- **Terbang** (fly): active-vehicle toolbar (mode, arm state, GPS, battery, link,
  flight time, mission progress, payload), action strip (motor on/off, takeoff,
  land, RTL, hold, mission, go-to-point, payload release) with slide-to-confirm,
  attitude indicator, compass (U/T/S/B) with home bearing, flight values, video PiP.
- **Misi** (plan): click-to-add waypoints, drag to move, per-waypoint altitude,
  speed, hold and action, survey (lawnmower) generator, patrol repeat, distance /
  duration / battery estimate, save / load / import / export, upload, start.
- **Titik drop**: pick coordinates on the map or type them (decimal, MGRS, paste
  "lat, lon"), assign a drone, drop altitude and approach speed, execute and track
  `enroute → stabilizing → released → returning → completed`, cancel, drag targets.
- **Peta armada**: fleet overview, drone panel, live track, flight history replay.
- **Video**: grid with paging, per-stream detection model, focus mode with
  bounding boxes, live scene captions and an AI assistant (visual Q&A) with clear
  operator / assistant messages and speech-to-text input.
- **Drone**: registry with multiple video sources (RTMP, RTSP, WebRTC/WHEP, HLS,
  SRT), telemetry link (MAVLink UDP/TCP/serial, WebSocket bridge) with link test,
  and flight limits used by failsafes.
- **Model AI**: drag-and-drop upload with progress and cancel, load / unload
  into the inference worker, edit classes, delete.
- **Log**: event log with filters and CSV export; flight history with GPX export.
- **Pengaturan**: change password, coordinate format (DD / DMS / MGRS), speed
  units, map layer, alert sound, STT engine and language, connection test.

## Backend contract

All REST calls go through one axios instance (`src/lib/api/client/http.ts`) that
sends `Authorization: Bearer <token>`; a `401` clears the session. WebSocket and
SSE cannot carry headers, so they receive the token as `?access_token=`.

Interfaces live in `src/lib/api/contracts/`; implement the backend against them.

| Method | Path                               | Contract                         |
| ------ | ---------------------------------- | -------------------------------- |
| POST   | `/auth/login`                      | `AuthApi.login`                  |
| GET    | `/auth/me`                         | `AuthApi.me`                     |
| POST   | `/auth/change-password`            | `AuthApi.changePassword`         |
| POST   | `/auth/logout`                     | `AuthApi.logout`                 |
| GET    | `/drones`, `/drones/:id`           | `DronesApi.list / get`           |
| POST   | `/drones`                          | `DronesApi.create`               |
| PUT    | `/drones/:id`                      | `DronesApi.update`               |
| DELETE | `/drones/:id`                      | `DronesApi.remove`               |
| POST   | `/drones/test-link`                | `DronesApi.testLink`             |
| GET    | `/drones/:id/flights`              | `DronesApi.flights`              |
| POST   | `/drones/:id/commands`             | `VehicleApi.send`                |
| POST   | `/drones/:id/mission`              | `MissionsApi.upload`             |
| GET    | `/streams`                         | `StreamsApi.list`                |
| PUT    | `/streams/:id/model`               | `StreamsApi.setModel`            |
| POST   | `/streams/focus`                   | `StreamsApi.setFocus`            |
| GET    | `/streams/:id/detections/latest`   | `StreamsApi.latestDetections`    |
| SSE    | `/streams/:id/captions`            | `StreamsApi.subscribeCaptions`   |
| GET    | `/models`                          | `ModelsApi.list`                 |
| POST   | `/models` (multipart)              | `ModelsApi.upload`               |
| PATCH  | `/models/:id`                      | `ModelsApi.update`               |
| DELETE | `/models/:id`                      | `ModelsApi.remove`               |
| POST   | `/models/:id/load`, `/unload`      | `ModelsApi.load / unload`        |
| POST   | `/vlm/ask`                         | `AssistantApi.askVlm`            |
| POST   | `/stt/transcribe` (multipart)      | `AssistantApi.transcribe`        |
| GET    | `/missions?droneId=`               | `MissionsApi.list`               |
| GET    | `/missions/:id`                    | `MissionsApi.get`                |
| POST   | `/missions`, PUT `/missions/:id`   | `MissionsApi.save`               |
| DELETE | `/missions/:id`                    | `MissionsApi.remove`             |
| GET    | `/drops`                           | `DropsApi.list`                  |
| POST   | `/drops`, PUT `/drops/:id`         | `DropsApi.create / update`       |
| DELETE | `/drops/:id`                       | `DropsApi.remove`                |
| POST   | `/drops/:id/execute`, `/cancel`    | `DropsApi.execute / cancel`      |
| GET    | `/events?limit=`                   | `EventsApi.list`                 |
| GET    | `/health`                          | `SystemApi.health`               |
| WS     | `/ws/realtime`                     | `RealtimeApi.connect`            |

Realtime messages (`RealtimeMessage`), single objects or JSON arrays:

```ts
{ type: "telemetry", droneId, data: DroneTelemetry }   // partial frames are merged
{ type: "link", droneId, link: "connected" | "degraded" | "lost" | "offline" }
{ type: "event", event: GcsEvent }
{ type: "drop", target: DropTarget }
```

Error bodies may carry `message` or `detail` (FastAPI style); it is shown to the
operator as-is, so return it in Bahasa Indonesia.

## Project structure

```
src/
  app/                  routes (login, dashboard/*) with route-local _components/_lib
  components/
    map/                Cesium canvas + declarative layers (drones, markers, lines, camera)
    layout/             header, fleet bar, footer, shell
    providers/          auth guard, realtime buffer, store hydration, redirects
    ui/                 buttons, fields, dialog, slide-to-confirm, toaster, tabs
    video/, events/, assistant/
  hooks/                fleet, speech-to-text, vehicle commands, streams
  lib/
    api/                contracts, axios client, http + mock implementations, simulator
    geo.ts, mgrs.ts, mission.ts, format.ts, validators.ts
  stores/               zustand stores (persisted ones hydrate after mount)
  types/                domain types shared with the backend
src-tauri/              Tauri 2 desktop shell
```

## Notes

- Base map tiles come from ArcGIS / OpenStreetMap. For closed networks point
  `src/components/map/map-layers.ts` at an on-premise tile server.
- Browser speech recognition (Web Speech API) needs internet access; the
  "Server" engine records audio and posts it to `/stt/transcribe` instead
  (e.g. Whisper), which also works inside the desktop app.
