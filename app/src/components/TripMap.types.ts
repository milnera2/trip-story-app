export type MapStop = { id: string; lat: number; lng: number; title: string; category: string };

export type MapPerson = { id: string; name: string; avatar: string | null; color: string; me: boolean };
export type MapTrack = { lat: number; lng: number; t: string }[];

export type TripMapProps = {
  // Everyone on the trip, their saved paths, and where to save your own while recording.
  people?: MapPerson[];
  tracks?: Record<string, MapTrack>;
  onRecord?: (lat: number, lng: number) => void;
  stops: MapStop[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  // Drop pin: add a stop where you are, or at the middle of the map.
  onLongPress?: (lat: number, lng: number) => void;
  // Space covered by the glass panels, so the route frames in the open part of the screen.
  // Where the Drop pin and Find me row starts, under the trip button.
  controlsTop?: number;
  topInset: number;
  bottomInset: number;
};
