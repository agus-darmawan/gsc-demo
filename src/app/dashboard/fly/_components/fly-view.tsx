"use client";

import { MousePointerClick, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type CameraTarget,
  CursorReadout,
  DRONE_LAYER,
  DroneLayer,
  initialMapView,
  LayerSwitcher,
  MapCamera,
  MapCanvas,
  type MapMarker,
  type MapPick,
  MarkerLayer,
  PolylineLayer,
} from "@/components/map";
import { DEFAULT_TAKEOFF_ALT_M } from "@/constants/defaults";
import { useActiveVehicle } from "@/hooks/use-fleet";
import { useVehicleCommand } from "@/hooks/use-vehicle-command";
import { useDroneStore } from "@/stores/use-drone-store";
import { useMissionStore } from "@/stores/use-mission-store";
import { usePathStore } from "@/stores/use-path-store";
import type { LatLon } from "@/types/geo";
import type { FlightMode } from "@/types/telemetry";
import { FlyActions } from "./fly-actions";
import { InstrumentPanel } from "./instrument-panel";
import { NoVehicle } from "./no-vehicle";
import {
  type ActionKind,
  type PendingAction,
  toCommand,
} from "./pending-action";
import { PendingBar } from "./pending-bar";
import { VehicleToolbar } from "./vehicle-toolbar";
import { VideoPip } from "./video-pip";

/** QGroundControl-style fly view for the active vehicle. */
export function FlyView() {
  const vehicle = useActiveVehicle();
  const drones = useDroneStore((s) => s.drones);
  const setActive = useDroneStore((s) => s.setActive);
  const [initialView] = useState(() => initialMapView(null));
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [gotoMode, setGotoMode] = useState(false);
  const { send, busy } = useVehicleCommand();

  const droneId = vehicle?.drone.id ?? null;
  const t = vehicle?.telemetry ?? null;
  const position: LatLon | null =
    t?.lat != null && t.lon != null ? { lat: t.lat, lon: t.lon } : null;
  const homeLat = t?.homeLat ?? null;
  const homeLon = t?.homeLon ?? null;
  const missionSeq = t?.missionSeq ?? null;

  const trail = usePathStore((s) =>
    droneId ? s.current[droneId]?.points : undefined,
  );
  const plan = useMissionStore((s) =>
    droneId ? s.drafts[droneId] : undefined,
  );

  const cameraTarget: CameraTarget | null = position
    ? { kind: "point", ...position, heightM: 2_500 }
    : null;
  const cameraTrigger = position ? droneId : null;

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];
    if (homeLat != null && homeLon != null)
      list.push({ id: "home", lat: homeLat, lon: homeLon, kind: "home" });
    if (pending?.kind === "goto")
      list.push({
        id: "goto",
        lat: pending.lat,
        lon: pending.lon,
        kind: "point",
      });
    return list;
  }, [homeLat, homeLon, pending]);

  const waypointMarkers = useMemo<MapMarker[]>(
    () =>
      (plan?.waypoints ?? []).map((wp, i) => ({
        id: wp.id,
        lat: wp.lat,
        lon: wp.lon,
        kind: "waypoint",
        label: String(i + 1),
        color: "#8b949e",
        selected: missionSeq === i + 1,
      })),
    [plan, missionSeq],
  );

  const route = useMemo<LatLon[]>(() => {
    const points: LatLon[] = plan?.waypoints ?? [];
    if (points.length === 0) return [];
    const home =
      homeLat != null && homeLon != null
        ? [{ lat: homeLat, lon: homeLon }]
        : [];
    return [...home, ...points, ...(plan?.endAction === "rtl" ? home : [])];
  }, [plan, homeLat, homeLon]);

  const onPick = (pick: MapPick) => {
    if (gotoMode && pick.kind === "ground") {
      setGotoMode(false);
      setPending({
        kind: "goto",
        lat: pick.position.lat,
        lon: pick.position.lon,
        altM: Math.round(Math.max(10, t?.altM ?? 50) / 5) * 5,
      });
      return;
    }
    if (pick.kind === "entity" && pick.layer === DRONE_LAYER) {
      const target = drones.find((d) => d.id === pick.id);
      if (target?.telemetry.enabled) {
        setPending(null);
        setActive(pick.id);
      }
    }
  };

  const startAction = (kind: ActionKind) => {
    if (kind === "goto") {
      setPending(null);
      setGotoMode((on) => !on);
      return;
    }
    setGotoMode(false);
    if (kind === "takeoff") {
      setPending({ kind, altM: DEFAULT_TAKEOFF_ALT_M });
      return;
    }
    setPending({ kind });
  };

  const confirm = async () => {
    if (!pending || !droneId) return;
    const action = pending;
    setPending(null);
    await send(droneId, toCommand(action));
  };

  const changeMode = (mode: FlightMode) => {
    if (droneId) void send(droneId, { type: "set-mode", mode });
  };

  return (
    <div className="relative min-w-0 flex-1">
      <MapCanvas initialView={initialView} onPick={onPick} pickMode={gotoMode}>
        <DroneLayer selectedId={droneId} />
        {route.length > 1 && (
          <PolylineLayer
            id="fly-mission"
            points={route}
            color="#8b949e"
            dashed
            opacity={0.8}
          />
        )}
        {trail && trail.length > 1 && (
          <PolylineLayer id="fly-trail" points={trail} color="#39d0d8" />
        )}
        {pending?.kind === "goto" && position && (
          <PolylineLayer
            id="fly-goto"
            points={[position, pending]}
            color="#a371f7"
            dashed
          />
        )}
        <MarkerLayer layer="fly-wp" markers={waypointMarkers} />
        <MarkerLayer layer="fly-marks" markers={markers} />
        <MapCamera target={cameraTarget} trigger={cameraTrigger} />
        <CursorReadout className="absolute bottom-11 left-2 z-10" />
      </MapCanvas>

      <LayerSwitcher className="absolute bottom-2 left-2 z-10" />

      {vehicle ? (
        <>
          <VehicleToolbar
            vehicle={vehicle}
            busy={busy}
            onModeChange={changeMode}
          />
          <FlyActions
            vehicle={vehicle}
            gotoMode={gotoMode}
            disabled={busy}
            onAction={startAction}
          />
          <VideoPip drone={vehicle.drone} />
          <InstrumentPanel telemetry={t} />

          {gotoMode && (
            <div className="hud-panel absolute top-14 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 px-3 py-2 text-xs text-violet-light">
              <MousePointerClick size={14} aria-hidden />
              Klik lokasi tujuan di peta
              <button
                type="button"
                onClick={() => setGotoMode(false)}
                aria-label="Batalkan pemilihan titik"
                className="ml-1 text-txt-tertiary hover:text-txt-primary"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {pending && (
            <PendingBar
              action={pending}
              callsign={vehicle.drone.callsign}
              maxAltM={vehicle.drone.params.maxAltM}
              busy={busy}
              onChange={setPending}
              onConfirm={confirm}
              onCancel={() => setPending(null)}
            />
          )}
        </>
      ) : (
        <NoVehicle />
      )}
    </div>
  );
}
