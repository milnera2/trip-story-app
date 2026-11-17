import { useRef, useState } from 'react';
import Animated, { FadeInDown, FadeOutUp, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { fonts, useColors } from '../theme';
import { Field, FilledButton, InputRef, TextButton } from './controls';

export type Mode = 'signIn' | 'signUp';
export type Credentials = { mode: Mode; name: string; email: string; password: string };

type Errors = Partial<Record<'name' | 'email' | 'password', string>>;

const copy = {
  signIn: { title: 'Sign in', sub: 'Use your WayStory account', action: 'Sign in', other: 'Create account' },
  signUp: { title: 'Create account', sub: 'Start your first trip story', action: 'Create account', other: 'Sign in instead' },
} as const;

function validate(mode: Mode, v: { name: string; email: string; password: string }): Errors {
  const e: Errors = {};
  if (mode === 'signUp' && !v.name.trim()) e.name = 'Enter your name';
  if (!v.email.trim()) e.email = 'Enter your email address';
  else if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = 'Enter a valid email address, like you@example.com';
  if (!v.password) e.password = 'Enter your password';
  else if (mode === 'signUp' && v.password.length < 8) e.password = 'Use 8 characters or more';
  return e;
}

const layout = LinearTransition.duration(220).reduceMotion(ReduceMotion.System);

export function AuthForm({ onSubmit, compact }: { onSubmit: (c: Credentials) => Promise<void>; compact?: boolean }) {
  const c = useColors();
  const [mode, setMode] = useState<Mode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<InputRef>(null);
  const emailRef = useRef<InputRef>(null);
  const passwordRef = useRef<InputRef>(null);
  const t = copy[mode];

  const submit = async () => {
    const next = validate(mode, { name, email, password });
    setErrors(next);
    if (Object.keys(next).length) {
      // Put the cursor on the first problem so a screen reader reads it out.
      (next.name ? nameRef : next.email ? emailRef : passwordRef).current?.focus();
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ mode, name: name.trim(), email: email.trim(), password });
    } finally {
      setLoading(false);
    }
  };

  const clear = (k: keyof Errors) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }));

  return (
    <Animated.View layout={layout} style={{ gap: compact ? 12 : 16 }}>
      <Animated.View layout={layout} style={{ gap: 4 }}>
        <Animated.Text
          key={`title-${mode}`}
          entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)}
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          style={{ color: c.onSheet, fontFamily: fonts.title, fontSize: 32, lineHeight: 38 }}
        >
          {t.title}
        </Animated.Text>
        <Animated.Text
          key={`sub-${mode}`}
          entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)}
          style={{ color: c.onSheetVariant, fontFamily: fonts.body, fontSize: 17, lineHeight: 24 }}
        >
          {t.sub}
        </Animated.Text>
      </Animated.View>

      {mode === 'signUp' && (
        <Animated.View
          entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)}
          exiting={FadeOutUp.duration(140).reduceMotion(ReduceMotion.System)}
        >
          <Field
            ref={nameRef}
            label="Name"
            value={name}
            onChangeText={(v) => {
              setName(v);
              clear('name');
            }}
            error={errors.name}
            autoComplete="name"
            textContentType="name"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
        </Animated.View>
      )}

      <Field
        ref={emailRef}
        label="Email"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          clear('email');
        }}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <Field
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          clear('password');
        }}
        error={errors.password}
        helper={mode === 'signUp' ? '8 characters or more' : undefined}
        secureToggle
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
        textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <Animated.View layout={layout} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: compact ? 4 : 8 }}>
        <TextButton
          label={t.other}
          onPress={() => {
            setErrors({});
            setMode(mode === 'signIn' ? 'signUp' : 'signIn');
          }}
        />
        <FilledButton label={t.action} onPress={submit} loading={loading} />
      </Animated.View>
    </Animated.View>
  );
}
