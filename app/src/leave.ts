import { useRouter } from 'expo-router';

// Go back, or to the map when the screen was opened directly (a shared link or a refresh).
export function useLeave() {
  const router = useRouter();
  return () => (router.canGoBack() ? router.back() : router.replace('/map'));
}
