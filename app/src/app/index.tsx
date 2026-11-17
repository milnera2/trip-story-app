import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { useSession } from '../auth';
import { AuthForm, Credentials } from '../components/AuthForm';
import { LoginBackdrop } from '../components/LoginBackdrop';
import { Snackbar } from '../components/controls';
import { supabase } from '../supabase';
import { ForceMode, fonts, useColors } from '../theme';

export default function Entry() {
  return (
    <ForceMode value="dark">
      <EntryScreen />
    </ForceMode>
  );
}

function EntryScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const session = useSession();
  const [snack, setSnack] = useState<string | null>(null);

  useEffect(() => {
    if (session.status === 'signedIn') router.replace('/map');
  }, [session.status, router]);

  const compact = height < 720;
  // Wide screens put the headline beside the card, like the split sign-up pages.
  const wide = width >= 860;

  const tell = (message: string) => {
    setSnack(message);
    setTimeout(() => setSnack(null), 5000);
  };

  const onSubmit = async ({ mode, name, email, password }: Credentials) => {
    if (mode === 'signUp') {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) return tell(error.message);
      // No session means the project wants the email confirmed first.
      if (!data.session) tell('Check your email to confirm your account, then sign in.');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) tell(error.message);
    // On success the session listener in useSession sends you to /home.
  };

  const shadow = { textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 12, textShadowOffset: { width: 0, height: 1 } } as const;

  const headline = (
    <View style={{ gap: compact ? 4 : 8 }}>
      <Text maxFontSizeMultiplier={1.2} accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.wordmark, fontSize: wide ? 40 : 30, lineHeight: wide ? 44 : 34, letterSpacing: -0.3, ...shadow }}>
        WayStory
      </Text>
      <Text
        maxFontSizeMultiplier={1.15}
        style={{ color: c.ink, fontFamily: fonts.wordmark, fontSize: wide ? 84 : compact ? 36 : 50, lineHeight: wide ? 84 : compact ? 38 : 52, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: compact ? 8 : 20, ...shadow }}
      >
        {'Your next\nadventure\nstarts here'}
      </Text>
      {!compact && (
        <Text maxFontSizeMultiplier={1.2} style={{ color: c.ink, fontFamily: fonts.small, fontSize: wide ? 22 : 18, lineHeight: wide ? 30 : 25, ...shadow }}>
          Track the trip. Share the story.
        </Text>
      )}
    </View>
  );

  const card = (
    <Animated.View
      entering={FadeInDown.delay(250).duration(600).reduceMotion(ReduceMotion.System)}
      style={[
        {
          width: '100%',
          maxWidth: 440,
          backgroundColor: c.glass,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: c.glassEdge,
          paddingHorizontal: 20,
          paddingVertical: compact ? 18 : 24,
        },
        // Frosted look where the platform supports it.
        Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px)' } as object) : null,
      ]}
    >
      <AuthForm onSubmit={onSubmit} compact={compact} />
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.page }}>
      <LoginBackdrop />
      {session.status === 'signedOut' && (
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }} enabled={Platform.OS !== 'web'}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 16,
              paddingHorizontal: 20,
            }}
            showsVerticalScrollIndicator={false}
          >
            {wide ? (
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 1080, alignSelf: 'center', gap: 64 }}>
                <View style={{ flex: 1 }}>{headline}</View>
                {card}
              </View>
            ) : (
              <View style={{ flex: 1, gap: 20 }}>
                {headline}
                {/* card centered in the space under the headline */}
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>{card}</View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
      <Snackbar message={snack} onClose={() => setSnack(null)} />
    </View>
  );
}
