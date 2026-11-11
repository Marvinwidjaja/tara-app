import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button, Card, ChoiceRow, ErrorText, Field, Screen } from '@/components/kit';
import { TaraLogo } from '@/components/tara-logo';
import { ThemedText } from '@/components/themed-text';
import { errorMessage } from '@/lib/api';
import type { Role } from '@/shared/types';
import { useSession } from '@/state/session';

export default function SignInScreen() {
  const { signIn } = useSession();
  const params = useLocalSearchParams<{ as?: string }>();
  const [role, setRole] = useState<Role>(params.as === 'caregiver' ? 'caregiver' : 'parent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn(role, email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const parent = role === 'parent';

  return (
    <Screen
      top={<TaraLogo width={110} />}
      title="Welcome back"
      subtitle={
        parent
          ? 'One weekly plan for everyone who cares for your child. You stay in charge.'
          : 'See today’s activities, mark how they went, and message the family.'
      }>
      <ChoiceRow
        options={[
          { id: 'parent', label: 'I’m a parent' },
          { id: 'caregiver', label: 'I’m a caregiver' },
        ]}
        value={role}
        onChange={(r) => {
          setRole(r);
          setError(null);
        }}
      />
      <Card>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={submit}
          returnKeyType="go"
        />
        <ErrorText message={error} />
        <Button
          label={busy ? 'Signing in…' : parent ? 'Sign in' : 'Sign in as a caregiver'}
          onPress={submit}
          disabled={busy || !email || !password}
        />
      </Card>
      {parent ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          New to TARA?{' '}
          <Link href="/sign-up" replace>
            <ThemedText type="smallBold" themeColor="accent">
              Create a parent account
            </ThemedText>
          </Link>
        </ThemedText>
      ) : (
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          First time, or forgot your password?{' '}
          <Link href="/join" replace>
            <ThemedText type="smallBold" themeColor="accent">
              Join with an invite code
            </ThemedText>
          </Link>
        </ThemedText>
      )}
    </Screen>
  );
}
