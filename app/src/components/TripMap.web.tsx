import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MaterialIcons } from '@expo/vector-icons';
import { updateSettings, useSettings } from '../settings';
import { fonts, useColors } from '../theme';
import { smooth } from '../geo';
import { characterImage } from '../characterImage';
import { parseAvatar } from '../characters';
import { useAvatarImage } from '../useAvatarImage';
import { paintMap, style } from './mapStyle';
import type { MapStop, TripMapProps } from './TripMap.types';

export type { MapStop, TripMapProps } from './TripMap.types';

const css = `
.maplibregl-ctrl-attrib{background:var(--wt-glass)!important;color:var(--wt-ink)!important;border-radius:10px;font:11px Barlow,sans-serif}
.maplibregl-ctrl-attrib a{color:var(--wt-link)!important}
.maplibregl-canvas{outline:none}
.wt-pin{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;cursor:pointer;
  font:600 16px 'BarlowSemiCondensed_600SemiBold',Barlow,sans-serif;color:var(--wt-ink);
  background:var(--wt-glass);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  border:1px solid var(--wt-edge);
  box-shadow:0 10px 18px rgba(0,0,0,.35),0 2px 4px rgba(0,0,0,.3);transition:transform .2s ease,background .2s ease}
.wt-pin:hover{transform:translateY(-2px)}
.wt-pin[data-on="1"]{background:var(--wt-pin);color:var(--wt-onpin);transform:translateY(-4px) scale(1.12);border-color:rgba(255,255,255,.7)}
.wt-friend{display:flex;flex-direction:column;align-items:center;gap:3px;pointer-events:none}
.wt-face{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--wt-glass) center/cover;border:3px solid var(--ring);
  font:600 16px 'BarlowSemiCondensed_600SemiBold',Barlow,sans-serif;color:var(--wt-ink);box-shadow:0 6px 14px rgba(0,0,0,.35)}
.wt-face[data-char]{position:relative;width:60px;height:60px;border:0;border-radius:0;background-color:transparent;background-size:contain;background-repeat:no-repeat;background-position:center;box-shadow:none;filter:drop-shadow(0 5px 4px rgba(0,0,0,.4))}
.wt-face[data-char]::after{content:'';position:absolute;left:14%;right:14%;bottom:-3px;height:9px;border-radius:50%;background:var(--ring);opacity:.6;z-index:-1}
.wt-avatar[data-char]{left:12px;top:6px;width:72px;height:72px;border:0;border-radius:0;background-color:transparent;background-size:contain;background-repeat:no-repeat;background-position:center;box-shadow:none;filter:drop-shadow(0 5px 4px rgba(0,0,0,.45))}
.wt-tag{font:600 12px Barlow,sans-serif;color:var(--wt-ink);background:var(--wt-glass);border:1px solid var(--wt-edge);border-radius:10px;padding:1px 7px;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wt-me{position:relative;width:96px;height:96px;pointer-events:none}
.wt-cone{position:absolute;inset:0;background:conic-gradient(from -28deg,color-mix(in srgb,var(--wt-pin) 65%,transparent) 0 56deg,transparent 56deg 360deg);
  -webkit-mask:radial-gradient(circle,transparent 12px,#000 14px,transparent 48px);mask:radial-gradient(circle,transparent 12px,#000 14px,transparent 48px)}
.wt-halo{position:absolute;left:34px;top:34px;width:28px;height:28px;border-radius:50%;background:color-mix(in srgb,var(--wt-pin) 40%,transparent);animation:wt-pulse 2s ease-out infinite}
.wt-shadow{position:absolute;left:36px;top:52px;width:24px;height:10px;border-radius:50%;background:rgba(0,0,0,.4);filter:blur(3px)}
.wt-avatar{position:absolute;left:24px;top:24px;width:48px;height:48px;box-sizing:border-box;padding:0;border-radius:50%;background:var(--wt-pin) center/cover;pointer-events:auto;cursor:pointer;touch-action:manipulation;
  display:grid;place-items:center;color:var(--wt-onpin);font:700 13px Barlow,sans-serif;
  border:3px solid #fff;box-shadow:0 0 18px color-mix(in srgb,var(--wt-pin) 85%,transparent),0 4px 8px rgba(0,0,0,.45)}
.wt-avatar:focus-visible{outline:3px solid var(--wt-link);outline-offset:3px}
@keyframes wt-pulse{0%{transform:scale(.8);opacity:.9}100%{transform:scale(2.4);opacity:0}}
@media (prefers-reduced-motion:reduce){.wt-halo{animation:none}}
`;

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Metres between two points and the compass bearing from a to b (small distances only).
function move(a: [number, number], b: [number, number]) {
  const k = 111320;
  const dx = (b[0] - a[0]) * k * Math.cos((a[1] * Math.PI) / 180);
  const dy = (b[1] - a[1]) * k;
  return { metres: Math.hypot(dx, dy), bearing: ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360 };
}

function circle([lng, lat]: [number, number], radius: number) {
  const ring = Array.from({ length: 49 }, (_, i) => {
    const t = (i / 48) * 2 * Math.PI;
    return [lng + (radius * Math.sin(t)) / (111320 * Math.cos((lat * Math.PI) / 180)), lat + (radius * Math.cos(t)) / 111320];
  });
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } } as const;
}

const emptyLine = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } } as const;
type Status = 'off' | 'wait' | 'on' | 'blocked';

export function TripMap({ stops, selectedId, onSelect, onLongPress, controlsTop, topInset, bottomInset, people, tracks, onRecord }: TripMapProps) {
  const c = useColors();
  const settings = useSettings();
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const ready = useRef(false);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [status, setStatus] = useState<Status>('off');
  const [following, setFollowing] = useState(false);
  const [hint, setHint] = useState('');
  const [recording, setRecording] = useState(false);
  const crew = useRef<Map<string, maplibregl.Marker>>(new Map());
  // Latest props for handlers that were attached once.
  const live = useRef({ stops, onSelect, onLongPress, topInset, bottomInset, settings, mode: c.mode, pin: c.pin, onRecord, recording, people, tracks });
  live.current = { stops, onSelect, onLongPress, topInset, bottomInset, settings, mode: c.mode, pin: c.pin, onRecord, recording, people, tracks };
  // Player state read by the animation loop.
  const me = useRef({
    target: null as [number, number] | null,
    shown: null as [number, number] | null,
    heading: null as number | null,
    accuracy: 0,
    trail: [] as [number, number][],
    following: false,
    manualBearing: false,
    flying: false,
    marker: null as maplibregl.Marker | null,
    cone: null as HTMLElement | null,
    watch: null as number | null,
    followOnFix: false,
    pendingFix: null as GeolocationPosition | null,
    lastSaved: null as [number, number] | null,
  });

  const setFollow = (on: boolean) => {
    me.current.following = on;
    setFollowing(on);
  };

  const applySettings = () => {
    const m = map.current;
    if (!m || !ready.current) return;
    const s = live.current.settings;
    m.setLayoutProperty('buildings', 'visibility', s.buildings3d && !s.topDown ? 'visible' : 'none');
    m.setLayoutProperty('trail-line', 'visibility', s.trail && !live.current.recording ? 'visible' : 'none');
    m.setTerrain(s.terrain3d && !s.topDown ? { source: 'dem', exaggeration: 1.3 } : null);
  };

  // Photo, 3D character or initial. Characters render asynchronously, so the element remembers which one it is waiting for.
  const paintFace = (face: HTMLElement, avatar: string | null, name: string) => {
    const key = `${avatar ?? ''}|${name}`;
    if (face.dataset.key === key) return;
    face.dataset.key = key;
    const parsed = parseAvatar(avatar);
    face.style.backgroundImage = '';
    face.textContent = '';
    if (parsed.kind === 'character') {
      face.setAttribute('data-char', '1');
      characterImage(parsed.id, parsed.color).then((uri) => {
        if (uri && face.dataset.key === key) face.style.backgroundImage = `url(${uri})`;
      });
      return;
    }
    face.removeAttribute('data-char');
    if (parsed.kind === 'photo') face.style.backgroundImage = `url(${JSON.stringify(parsed.url)})`;
    else face.textContent = (name.trim()[0] ?? '?').toUpperCase();
  };

  const updateOwnMarker = () => {
    const marker = me.current.marker?.getElement();
    const face = marker?.querySelector<HTMLElement>('.wt-avatar');
    if (!face) return;
    const person = live.current.people?.find((p) => p.me);
    paintFace(face, person?.avatar ?? null, person?.name ?? '');
  };

  // Saved paths as smooth coloured lines, and a photo marker where each friend was last seen.
  const drawCrew = () => {
    const m = map.current;
    if (!m || !ready.current) return;
    const { people: list = [], tracks: paths = {} } = live.current;
    const features = list
      .filter((p) => (paths[p.id]?.length ?? 0) >= 2)
      .map((p) => ({
        type: 'Feature' as const,
        properties: { color: p.color },
        geometry: { type: 'LineString' as const, coordinates: smooth(paths[p.id].map((t): [number, number] => [t.lng, t.lat])) },
      }));
    (m.getSource('tracks') as maplibregl.GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features });

    const seen = new Set<string>();
    list.forEach((p) => {
      const last = paths[p.id]?.[paths[p.id].length - 1];
      if (p.me || !last) return;
      seen.add(p.id);
      let marker = crew.current.get(p.id);
      if (!marker) {
        const el = document.createElement('div');
        el.className = 'wt-friend';
        el.setAttribute('role', 'img');
        marker = new maplibregl.Marker({ element: el, anchor: 'top', offset: [0, -20] }).setLngLat([last.lng, last.lat]).addTo(m);
        crew.current.set(p.id, marker);
      }
      const el = marker.getElement();
      el.setAttribute('aria-label', `${p.name}, last seen ${new Date(last.t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
      el.title = `${p.name} · Last recorded ${new Date(last.t).toLocaleString()}`;
      el.style.setProperty('--ring', p.color);
      el.replaceChildren();
      const face = document.createElement('div');
      face.className = 'wt-face';
      paintFace(face, p.avatar, p.name);
      const tag = document.createElement('div');
      tag.className = 'wt-tag';
      tag.textContent = p.name;
      el.append(face, tag);
      marker.setLngLat([last.lng, last.lat]);
    });
    crew.current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.remove();
        crew.current.delete(id);
      }
    });
  };

  const draw = () => {
    const m = map.current;
    if (!m || !ready.current) return;
    const { stops: list } = live.current;
    markers.current.forEach((k) => k.remove());
    markers.current = list.map((s, i) => {
      const el = document.createElement('button');
      el.className = 'wt-pin';
      el.type = 'button';
      el.textContent = String(i + 1);
      el.setAttribute('aria-label', `Stop ${i + 1}: ${s.title}`);
      el.dataset.id = s.id;
      el.dataset.on = s.id === selectedId ? '1' : '0';
      el.onclick = (e) => {
        e.stopPropagation();
        live.current.onSelect?.(s.id);
      };
      return new maplibregl.Marker({ element: el }).setLngLat([s.lng, s.lat]).addTo(m);
    });
    const line = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: list.map((s) => [s.lng, s.lat]) } } as const;
    (m.getSource('route') as maplibregl.GeoJSONSource | undefined)?.setData(line);
  };

  const frame = (animate: boolean) => {
    const m = map.current;
    if (!m || !ready.current || me.current.following) return;
    const { stops: list, topInset: top, bottomInset: bottom } = live.current;
    const duration = animate && !reduced() ? 2400 : 0;
    const { topDown } = live.current.settings;
    if (list.length === 0) {
      m.easeTo({ center: [-35, 22], zoom: 1.4, pitch: 0, bearing: 0, duration, padding: { top, bottom, left: 0, right: 0 } });
    } else if (list.length === 1) {
      m.easeTo({ center: [list[0].lng, list[0].lat], zoom: 9.5, pitch: topDown ? 0 : 62, bearing: topDown ? 0 : -25, duration, padding: { top, bottom, left: 0, right: 0 } });
    } else {
      const b = new maplibregl.LngLatBounds();
      list.forEach((s) => b.extend([s.lng, s.lat]));
      m.fitBounds(b, { padding: { top: top + 40, bottom: bottom + 40, left: 50, right: 50 }, pitch: topDown ? 0 : 60, bearing: topDown ? 0 : -20, maxZoom: 11, duration });
    }
  };

  // Camera behind the player: tilted, close, with the player sitting low on the screen.
  const chase = (zoom?: number) => {
    const m = map.current;
    const p = me.current;
    if (!m || !p.shown) return;
    const duration = reduced() ? 0 : 1600;
    m.easeTo({
      center: p.shown,
      zoom: zoom ?? Math.max(m.getZoom(), 16.5),
      pitch: live.current.settings.topDown ? 0 : 66,
      bearing: live.current.settings.topDown ? 0 : m.getBearing(),
      padding: { top: Math.round(m.getContainer().clientHeight * 0.25), bottom: live.current.bottomInset, left: 0, right: 0 },
      duration,
    });
    // Set after easeTo: starting a flight ends the previous move, and that old 'moveend' must not clear this flag.
    p.flying = duration > 0;
  };

  const onFix = (pos: GeolocationPosition) => {
    const m = map.current;
    const p = me.current;
    if (!m || !ready.current) {
      p.pendingFix = pos;
      return;
    }
    const at: [number, number] = [pos.coords.longitude, pos.coords.latitude];
    const prev = p.target;
    const step = prev ? move(prev, at) : null;
    if (typeof pos.coords.heading === 'number' && !Number.isNaN(pos.coords.heading) && (pos.coords.speed ?? 0) > 0.8) p.heading = pos.coords.heading;
    else if (step && step.metres >= 3) p.heading = step.bearing;
    p.target = at;
    p.accuracy = pos.coords.accuracy;
    (m.getSource('me-acc') as maplibregl.GeoJSONSource | undefined)?.setData(circle(at, Math.min(p.accuracy, 200)));
    if (!prev || (step && step.metres >= 5)) {
      p.trail.push(at);
      (m.getSource('trail') as maplibregl.GeoJSONSource | undefined)?.setData({ ...emptyLine, geometry: { type: 'LineString', coordinates: p.trail } });
    }
    // While recording, save a point every few metres so friends see the path and it survives a reload.
    if (live.current.recording && live.current.onRecord && (!p.lastSaved || move(p.lastSaved, at).metres >= 8)) {
      p.lastSaved = at;
      live.current.onRecord(at[1], at[0]);
    }
    if (!p.marker) {
      p.shown = at;
      const el = document.createElement('div');
      el.className = 'wt-me';
      el.innerHTML = '<div class="wt-cone"></div><div class="wt-halo"></div><div class="wt-shadow"></div><button type="button" class="wt-avatar" aria-label="Go to your location" title="Go to your location"></button>';
      const button = el.querySelector('button');
      button?.addEventListener('pointerdown', (event) => event.stopPropagation());
      button?.addEventListener('click', (event) => {
        event.stopPropagation();
        p.manualBearing = false;
        setFollow(true);
        chase();
      });
      p.cone = el.querySelector('.wt-cone');
      p.marker = new maplibregl.Marker({ element: el }).setLngLat(at).addTo(m);
      updateOwnMarker();
    }
    setStatus('on');
    if (p.followOnFix) {
      p.followOnFix = false;
      setFollow(true);
      chase();
    }
  };

  const locate = () => {
    if (status === 'on') {
      // Tap to follow, tap again to look around freely.
      if (me.current.following) return setFollow(false);
      me.current.manualBearing = false;
      setFollow(true);
      chase();
      return;
    }
    if (status !== 'wait') startLocationWatch(true);
  };

  const startLocationWatch = (follow: boolean) => {
    const p = me.current;
    if (follow) {
      p.followOnFix = true;
      setStatus('wait');
      setHint('');
    }
    if (!('geolocation' in navigator)) {
      if (follow) {
        setStatus('blocked');
        setHint('This browser cannot share your location.');
      }
      return;
    }
    if (p.watch !== null) return;
    p.watch = navigator.geolocation.watchPosition(
      onFix,
      (err) => {
        if (p.watch !== null) navigator.geolocation.clearWatch(p.watch);
        p.watch = null;
        if (!p.followOnFix) {
          setStatus('off');
          return;
        }
        setStatus(err.code === 1 ? 'blocked' : 'off');
        setHint(
          err.code === 1
            ? 'Location is turned off for this site. Allow it in the browser address bar, then tap again.'
            : 'Could not get a location fix. Try again, ideally with a clear view of the sky.',
        );
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
    );
  };

  useEffect(() => {
    if (!host.current || map.current) return;
    const tag = document.createElement('style');
    tag.textContent = css;
    document.head.appendChild(tag);

    const m = new maplibregl.Map({
      container: host.current,
      style,
      center: [-35, 22],
      zoom: 1.4,
      maxPitch: 80,
      maxZoom: 20,
      attributionControl: false,
      canvasContextAttributes: { antialias: true },
    });
    m.addControl(new maplibregl.AttributionControl({ compact: true }), 'top-right');
    map.current = m;
    m.on('error', (e) => console.warn('map:', e.error?.message ?? e));
    if (__DEV__) (window as unknown as { __map: maplibregl.Map }).__map = m;

    m.on('load', () => {
      m.addSource('route', { type: 'geojson', data: emptyLine });
      m.addSource('trail', { type: 'geojson', data: emptyLine });
      m.addSource('me-acc', { type: 'geojson', data: circle([0, 0], 0) });
      m.addSource('tracks', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'me-acc-fill', type: 'fill', source: 'me-acc', paint: { 'fill-color': '#f0c48f', 'fill-opacity': 0.14 } });
      m.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#e1a66f', 'line-width': 12, 'line-blur': 9, 'line-opacity': 0.5 } });
      m.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#f0c48f', 'line-width': 3.5 } });
      m.addLayer({ id: 'tracks-casing', type: 'line', source: 'tracks', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': 0.85 } });
      m.addLayer({ id: 'tracks-line', type: 'line', source: 'tracks', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 4.5 } });
      m.addLayer({ id: 'trail-line', type: 'line', source: 'trail', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#7fd6e6', 'line-width': 4, 'line-opacity': 0.85 } });
      ready.current = true;
      paintMap(m, live.current.mode, live.current.pin);
      applySettings();
      drawCrew();
      draw();
      frame(true);
      const pending = me.current.pendingFix;
      if (pending) {
        me.current.pendingFix = null;
        onFix(pending);
      }
      if (live.current.people && navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then(({ state }) => {
          if (state === 'granted' && map.current === m) startLocationWatch(false);
        }).catch(() => {});
      }
    });

    // One finger (or the mouse) drags the map. Press and hold still for a moment, then drag, to turn
    // and tilt the view. Two fingers pinch to zoom.
    m.dragRotate.disable();
    m.touchPitch.disable();
    m.touchZoomRotate.disableRotation();
    const surface = m.getCanvasContainer();
    surface.style.touchAction = 'none';
    const fingers = new Set<number>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let turning: { x: number; y: number } | null = null;
    let start = { x: 0, y: 0 };
    const cancel = () => clearTimeout(timer);
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('.wt-pin')) return;
      fingers.add(e.pointerId);
      cancel();
      if (fingers.size !== 1 || live.current.settings.topDown) return;
      start = { x: e.clientX, y: e.clientY };
      timer = setTimeout(() => {
        // Held still: this drag turns the view instead of moving it.
        turning = { ...start };
        m.dragPan.disable();
        surface.style.cursor = 'grabbing';
      }, 300);
    };
    const move = (e: PointerEvent) => {
      if (!turning) {
        // Moved before the hold finished: it is a normal drag.
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) cancel();
        return;
      }
      const dx = e.clientX - turning.x;
      const dy = e.clientY - turning.y;
      turning = { x: e.clientX, y: e.clientY };
      me.current.manualBearing = true;
      m.jumpTo({ bearing: m.getBearing() - dx * 0.4, pitch: Math.min(80, Math.max(0, m.getPitch() - dy * 0.3)) });
    };
    const up = (e: PointerEvent) => {
      fingers.delete(e.pointerId);
      cancel();
      if (turning) {
        turning = null;
        m.dragPan.enable();
        surface.style.cursor = '';
      }
    };
    surface.addEventListener('pointerdown', down);
    surface.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    // Moving the map by hand stops following you; the Follow button takes it back.
    m.on('dragstart', (e) => {
      if (e.originalEvent && me.current.following) setFollow(false);
    });
    m.on('moveend', () => {
      me.current.flying = false;
    });

    // Glide the player toward the latest fix every frame so it moves like a game character, not in jumps.
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      const p = me.current;
      if (p.target && p.shown && p.marker) {
        const k = 1 - Math.exp(-dt / 220);
        p.shown = [p.shown[0] + (p.target[0] - p.shown[0]) * k, p.shown[1] + (p.target[1] - p.shown[1]) * k];
        p.marker.setLngLat(p.shown);
        const bearing = m.getBearing();
        if (p.cone) p.cone.style.transform = `rotate(${(p.heading ?? bearing) - bearing}deg)`;
        if (p.cone) p.cone.style.opacity = p.heading === null ? '0' : '1';
        if (p.following && !p.flying && !p.manualBearing) {
          const diff = p.heading === null ? 0 : ((p.heading - bearing + 540) % 360) - 180;
          m.jumpTo({
            center: p.shown,
            bearing: live.current.settings.topDown ? 0 : bearing + diff * (1 - Math.exp(-dt / 700)),
          });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancel();
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (me.current.watch !== null) navigator.geolocation.clearWatch(me.current.watch);
      me.current.watch = null;
      markers.current.forEach((k) => k.remove());
      crew.current.forEach((k) => k.remove());
      crew.current.clear();
      m.remove();
      map.current = null;
      ready.current = false;
      tag.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(applySettings, [settings, recording]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(updateOwnMarker, [people]);
  useEffect(drawCrew, [people, tracks]); // eslint-disable-line react-hooks/exhaustive-deps

  // Marker and control colours come from CSS variables so they follow the mode too.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const vars = { '--wt-glass': c.glassSolid, '--wt-ink': c.ink, '--wt-edge': c.glassEdge, '--wt-pin': c.pin, '--wt-onpin': c.onPin, '--wt-link': c.link };
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    if (map.current && ready.current) paintMap(map.current, c.mode, c.pin);
  }, [c]);

  const key = stops.map((s) => s.id).join(',');
  useEffect(() => {
    draw();
    frame(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    markers.current.forEach((k) => {
      const el = k.getElement();
      el.dataset.on = el.dataset.id === selectedId ? '1' : '0';
    });
    const s = live.current.stops.find((x) => x.id === selectedId);
    if (s && map.current) {
      setFollow(false);
      map.current.easeTo({
        center: [s.lng, s.lat],
        zoom: Math.max(map.current.getZoom(), 10.5),
        pitch: live.current.settings.topDown ? 0 : 65,
        bearing: live.current.settings.topDown ? 0 : map.current.getBearing(),
        duration: reduced() ? 0 : 1400,
        padding: { top: live.current.topInset, bottom: live.current.bottomInset, left: 0, right: 0 },
      });
    }
  }, [selectedId]);

  const switchView = () => {
    const topDown = !settings.topDown;
    updateSettings({ topDown });
    const m = map.current;
    if (!m) return;
    const duration = reduced() ? 0 : 450;
    m.easeTo({ pitch: topDown ? 0 : 60, bearing: topDown ? 0 : m.getBearing(), duration });
    me.current.flying = duration > 0;
  };

  const ownAvatar = useAvatarImage(people?.find((person) => person.me)?.avatar);
  const label = { off: 'Find me', wait: 'Locating…', on: following ? 'Following you' : 'Follow me', blocked: 'Try again' }[status];
  const icon = { off: 'my-location', wait: 'sync', on: following ? 'navigation' : 'near-me', blocked: 'location-off' }[status] as 'my-location';
  // Pin where you stand if the player is on the map, otherwise the middle of the screen.
  const dropPin = () => {
    const m = map.current;
    if (!m) return;
    const at = me.current.shown ?? m.getCenter().toArray();
    live.current.onLongPress?.(at[1], at[0]);
  };

  const press = useCallback(locate, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ flex: 1, backgroundColor: c.page }}>
      <div ref={host} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#050B18' }} />
      <View pointerEvents="box-none" style={{ position: 'absolute', top: controlsTop ?? 12, left: 16, right: 16, gap: 10, alignItems: 'flex-start' }}>
        <View pointerEvents="box-none" style={{ gap: 10, alignItems: 'flex-start' }}>
          <Pressable
            onPress={press}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={{
              minHeight: 48,
              paddingHorizontal: 18,
              borderRadius: 24,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: status === 'on' && following ? c.primary : c.glassSolid,
              borderWidth: 1,
              borderColor: c.glassEdge,
            }}
          >
            {ownAvatar.uri
              ? <Image source={{ uri: ownAvatar.uri }} accessibilityIgnoresInvertColors resizeMode={ownAvatar.character ? 'contain' : 'cover'} style={{ width: 26, height: 26, borderRadius: 13 }} />
              : <MaterialIcons name={icon} size={22} color={status === 'on' && following ? c.onPrimary : c.ink} />}
            <Text style={{ color: status === 'on' && following ? c.onPrimary : c.ink, fontFamily: fonts.label, fontSize: 16 }}>{label}</Text>
          </Pressable>
          <Pressable
            onPress={switchView}
            accessibilityRole="button"
            accessibilityLabel={settings.topDown ? 'Switch to 3D view' : 'Switch to top-down view'}
            style={{ minHeight: 48, paddingHorizontal: 18, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.glassSolid, borderWidth: 1, borderColor: c.glassEdge }}
          >
            <MaterialIcons name={settings.topDown ? 'terrain' : 'map'} size={22} color={c.ink} />
            <Text style={{ color: c.ink, fontFamily: fonts.label, fontSize: 16 }}>
              {settings.topDown ? '3D view' : 'Top-down'}
            </Text>
          </Pressable>
          {status === 'on' && onRecord ? (
            <Pressable
              onPress={() => {
                me.current.lastSaved = null;
                setRecording((r) => !r);
              }}
              accessibilityRole="button"
              accessibilityLabel={recording ? 'Stop recording' : 'Record trip'}
              style={{ minHeight: 48, paddingHorizontal: 18, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: recording ? '#D93025' : c.glassSolid, borderWidth: 1, borderColor: c.glassEdge }}
            >
              <MaterialIcons name={recording ? 'stop' : 'fiber-manual-record'} size={22} color={recording ? '#fff' : '#D93025'} />
              <Text style={{ color: recording ? '#fff' : c.ink, fontFamily: fonts.label, fontSize: 16 }}>{recording ? 'Recording' : 'Record trip'}</Text>
            </Pressable>
          ) : null}
          {onLongPress ? (
            <Pressable
              onPress={dropPin}
              accessibilityRole="button"
              accessibilityLabel="Drop pin"
              style={{ minHeight: 48, paddingHorizontal: 18, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.pin, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' }}
            >
              <MaterialIcons name="add-location-alt" size={22} color={c.onPin} />
              <Text style={{ color: c.onPin, fontFamily: fonts.label, fontSize: 16 }}>Drop pin</Text>
            </Pressable>
          ) : null}
        </View>
        {hint ? (
          <View style={{ maxWidth: 300, paddingVertical: 8, paddingLeft: 14, paddingRight: 6, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.glassSolid, borderWidth: 1, borderColor: c.glassEdge }}>
            <Text accessibilityLiveRegion="polite" style={{ flex: 1, color: c.ink, fontFamily: fonts.body, fontSize: 14, lineHeight: 19 }}>{hint}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close message" onPress={() => setHint('')} hitSlop={8} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="close" size={20} color={c.ink} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}
