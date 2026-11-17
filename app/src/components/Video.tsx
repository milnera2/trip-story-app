import { useVideoPlayer, VideoView } from 'expo-video';

// A small inline player. Tap the controls to play; it never starts by itself.
export function Video({ uri, width = 168, height = 120, label }: { uri: string; width?: number; height?: number; label: string }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} nativeControls contentFit="cover" accessibilityLabel={label} style={{ width, height, borderRadius: 12, backgroundColor: '#000' }} />;
}
