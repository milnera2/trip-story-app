import type maplibregl from 'maplibre-gl';

// Map look: real streets, buildings and terrain from OpenFreeMap, recoloured for dark and light.
const NAME = ['coalesce', ['get', 'name:latin'], ['get', 'name']] as maplibregl.ExpressionSpecification;
const classIn = (...names: string[]) => ['in', ['get', 'class'], ['literal', names]] as maplibregl.ExpressionSpecification;
const widthAt = (a: number, b: number, c: number) =>
  ['interpolate', ['exponential', 1.4], ['zoom'], 8, a * 0.15, 13, a * 0.6, 16, b, 19, c] as maplibregl.ExpressionSpecification;

// Road classes, drawn bottom to top: [id, classes, color, width at z16, minzoom].
const ROADS: [string, string[], string, number, number][] = [
  ['minor', ['minor', 'service', 'track'], '#27393f', 5, 13],
  ['tertiary', ['tertiary'], '#324a51', 8, 11],
  ['secondary', ['secondary'], '#3d5a62', 10, 9],
  ['primary', ['primary', 'trunk'], '#6d8a8e', 12, 7],
  ['motorway', ['motorway'], '#c98f58', 14, 5],
];

// Real streets, buildings and terrain from OpenFreeMap (free, no key), restyled to match the glass look.
export const style: maplibregl.StyleSpecification = {
  version: 8,
  projection: { type: 'globe' },
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  light: { anchor: 'viewport', color: '#ffffff', intensity: 0.4, position: [1.4, 210, 55] },
  sky: {
    'sky-color': '#16303a',
    'horizon-color': '#33596a',
    'fog-color': '#0c1a1d',
    'sky-horizon-blend': 0.6,
    'horizon-fog-blend': 0.6,
    'fog-ground-blend': 0.4,
    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 8, 1, 11, 0],
  },
  sources: {
    omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '© OpenStreetMap contributors · OpenFreeMap' },
    dem: {
      type: 'raster-dem',
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
      encoding: 'terrarium',
      tileSize: 256,
      maxzoom: 14,
      attribution: 'Terrain © Mapzen, AWS',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#0e1c20' } },
    { id: 'landcover', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: classIn('wood', 'grass', 'farmland'), paint: { 'fill-color': '#12292a', 'fill-opacity': 0.8 } },
    { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': '#15332f', 'fill-opacity': 0.8 } },
    { id: 'landuse', type: 'fill', source: 'omt', 'source-layer': 'landuse', filter: classIn('residential', 'commercial', 'industrial', 'retail'), paint: { 'fill-color': '#132226', 'fill-opacity': 0.7 } },
    { id: 'hills', type: 'hillshade', source: 'dem', paint: { 'hillshade-exaggeration': 0.6, 'hillshade-shadow-color': '#000000', 'hillshade-highlight-color': '#8fb2bd', 'hillshade-accent-color': '#05100f' } },
    { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': '#0a2c3b' } },
    { id: 'waterway', type: 'line', source: 'omt', 'source-layer': 'waterway', paint: { 'line-color': '#0a2c3b', 'line-width': widthAt(2, 3, 5) } },
    ...ROADS.flatMap(([id, classes, color, w, minzoom]) => [
      { id: `${id}-casing`, type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom, filter: classIn(...classes), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#07110f', 'line-width': widthAt(w + 2, w + 3, w * 2 + 3), 'line-opacity': 0.8 } },
      { id: `${id}-road`, type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom, filter: classIn(...classes), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': color, 'line-width': widthAt(w, w, w * 2) } },
    ]),
    { id: 'path', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 15, filter: classIn('path', 'pedestrian'), paint: { 'line-color': '#5e8087', 'line-width': 1.6, 'line-dasharray': [2, 2] } },
    {
      id: 'buildings',
      type: 'fill-extrusion',
      source: 'omt',
      'source-layer': 'building',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 6], 0, '#22343a', 40, '#33494f', 120, '#4d6a72'],
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.92,
        'fill-extrusion-vertical-gradient': true,
      },
    },
    { id: 'road-names', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 14, layout: { 'symbol-placement': 'line', 'text-field': NAME, 'text-font': ['Noto Sans Regular'], 'text-size': 11 }, paint: { 'text-color': '#aac0c3', 'text-halo-color': '#0a1517', 'text-halo-width': 1.5 } },
    { id: 'water-names', type: 'symbol', source: 'omt', 'source-layer': 'water_name', layout: { 'text-field': NAME, 'text-font': ['Noto Sans Italic'], 'text-size': 12 }, paint: { 'text-color': '#5f8ea3', 'text-halo-color': '#0a1517', 'text-halo-width': 1.2 } },
    { id: 'place-small', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 11, filter: classIn('suburb', 'village', 'town', 'neighbourhood'), layout: { 'text-field': NAME, 'text-font': ['Noto Sans Regular'], 'text-size': 12, 'text-transform': 'uppercase', 'text-letter-spacing': 0.08 }, paint: { 'text-color': '#c4d6d6', 'text-halo-color': '#0a1517', 'text-halo-width': 1.5 } },
    { id: 'place-city', type: 'symbol', source: 'omt', 'source-layer': 'place', maxzoom: 14, filter: classIn('city', 'state', 'country'), layout: { 'text-field': NAME, 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 2, 12, 10, 18] }, paint: { 'text-color': '#eef3f2', 'text-halo-color': '#0a1517', 'text-halo-width': 1.8 } },
  ] as maplibregl.LayerSpecification[],
  terrain: { source: 'dem', exaggeration: 1.3 },
};

// Blue sky that fades into haze at the horizon, with a thin glow around the globe seen from space.
const skyOf = (sky: string, horizon: string, fog: string, glow: number) => ({
  'sky-color': sky,
  'horizon-color': horizon,
  'fog-color': fog,
  'sky-horizon-blend': 0.9,
  'horizon-fog-blend': 0.4,
  'fog-ground-blend': 0.5,
  'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, glow, 8, glow, 12, 0],
});

export const MAP = {
  dark: {
    bg: '#0F1B14', wood: '#16301F', park: '#1B3A24', landuse: '#13241A', water: '#123A4A',
    minor: '#2A3B30', tertiary: '#37503F', secondary: '#4A6A52', primary: '#7A9A6A', motorway: '#B9D88A', casing: '#08120C', path: '#7F9A78',
    low: '#22342A', mid: '#34503C', high: '#587A5C',
    text: '#C9D8C0', halo: '#08120C', waterText: '#6FA6B8', city: '#F3F1E8', trail: '#7FD6E6',
    hillShadow: '#000000', hillLight: '#9CBF6B', hillAccent: '#050c07', hill: 0.6,
    sky: skyOf('#0E2A3F', '#2F6F8F', '#0F1F18', 0.5),
  },
  light: {
    bg: '#F1EAD6', wood: '#D5E3B5', park: '#CCE0A8', landuse: '#EAE1C8', water: '#8ED0F0',
    minor: '#FFFFFF', tertiary: '#FFFFFF', secondary: '#FFF1CC', primary: '#FFDDA0', motorway: '#FFAE7A', casing: '#D5C9A8', path: '#A99B78',
    low: '#E3D8BC', mid: '#D2C4A0', high: '#B9A980',
    text: '#3A4A52', halo: '#FBF6EA', waterText: '#2E7DA6', city: '#1B2A33', trail: '#0A6EA8',
    hillShadow: '#8A7A5A', hillLight: '#FFFFFF', hillAccent: '#B7A77F', hill: 0.35,
    sky: skyOf('#1F5FBF', '#5BA8EC', '#C9E2F2', 0.35),
  },
} as const;

// Recolour the map for the current mode without reloading any tiles.
export function paintMap(m: maplibregl.Map, mode: 'dark' | 'light', pin: string) {
  const k = MAP[mode];
  const paint = (id: string, prop: string, value: unknown) => {
    if (m.getLayer(id)) m.setPaintProperty(id, prop, value);
  };
  paint('bg', 'background-color', k.bg);
  paint('landcover', 'fill-color', k.wood);
  paint('park', 'fill-color', k.park);
  paint('landuse', 'fill-color', k.landuse);
  paint('water', 'fill-color', k.water);
  paint('waterway', 'line-color', k.water);
  paint('hills', 'hillshade-shadow-color', k.hillShadow);
  paint('hills', 'hillshade-highlight-color', k.hillLight);
  paint('hills', 'hillshade-accent-color', k.hillAccent);
  paint('hills', 'hillshade-exaggeration', k.hill);
  for (const id of ['minor', 'tertiary', 'secondary', 'primary', 'motorway'] as const) {
    paint(`${id}-road`, 'line-color', k[id]);
    paint(`${id}-casing`, 'line-color', k.casing);
  }
  paint('path', 'line-color', k.path);
  paint('buildings', 'fill-extrusion-color', ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 6], 0, k.low, 40, k.mid, 120, k.high]);
  paint('road-names', 'text-color', k.text);
  paint('road-names', 'text-halo-color', k.halo);
  paint('water-names', 'text-color', k.waterText);
  paint('water-names', 'text-halo-color', k.halo);
  paint('place-small', 'text-color', k.text);
  paint('place-small', 'text-halo-color', k.halo);
  paint('place-city', 'text-color', k.city);
  paint('place-city', 'text-halo-color', k.halo);
  paint('route-glow', 'line-color', pin);
  paint('route-line', 'line-color', pin);
  paint('trail-line', 'line-color', k.trail);
  paint('tracks-casing', 'line-color', k.halo);
  paint('me-acc-fill', 'fill-color', pin);
  m.setSky(k.sky as maplibregl.SkySpecification);
}
