/**
 * A caregiver creates their TARA login with the invite code the parent shared. Opened from a join
 * link (`/join?code=ABCD2345`, the code is filled in) or from "Join with an invite code".
 */
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { Button, Card, ErrorText, Field, Screen } from '@/components/kit';
import { TaraLogo } from '@/components/tara-logo';
import { ThemedText } from '@/components/themed-text';
import { api, errorMessage } from '@/lib/api';
import { formatInviteCode } from '@/lib/invite';
import type { InvitePreview } from '@/shared/types';
import { useSession } from '@/state/session';

const normalize = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');

export default function JoinScreen() {
  const { joinAsCaregiver } = useSession();
  const params = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState(params.code ? formatInviteCode(normalize(params.code)) : '');
  const [lookup, setLookup] = useState<{ code: string; preview?: InvitePreview; error?: string } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Look the code up once all 8 characters are in, to show who the invite is from. Results are
  // tagged with their code so an older lookup never shows for a newer code.
  const normalized = normalize(code);
  useEffect(() => {
    if (normalized.length !== 8) return;
    api
      .get<InvitePreview>(`/api/auth/invite/${normalized}`)
      .then((preview) => setLookup({ code: normalized, preview }))
      .catch((err) => setLookup({ code: normalized, error: errorMessage(err) }));
  }, [normalized]);
  const current = lookup?.code === normalized ? lookup : null;
  const preview = current?.preview ?? null;
  const codeError = current?.error ?? null;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await joinAsCaregiver(normalized, email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      top={<TaraLogo width={90} />}
      title={preview ? `Hi ${preview.caregiverName}!` : 'Join TARA'}
      subtitle={
        preview
          ? `${preview.parentName} invited you to TARA to share simple activity ideas for ${preview.childName}. It’s not to check on you, just to make the days easier.`
          : 'Enter the invite code the parent shared with you.'
      }>
      <Card>
        <Field
          label="Invite code"
          value={code}
          onChangeText={(v) => setCode(formatInviteCode(normalize(v).slice(0, 8)))}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="ABCD-2345"
        />
        <ErrorText message={codeError} />
      </Card>

      {preview ? (
        <Card>
          <ThemedText type="small" themeColor="textSecondary">
            Choose the email and password you’ll sign in with.
          </ThemedText>
          <Field
            label="Your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="you@example.com"
          />
          <Field
            label="Password (8+ characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            onSubmitEditing={submit}
            returnKeyType="go"
          />
          <ErrorText message={error} />
          <Button
            label={busy ? 'Joining…' : 'Join TARA'}
            onPress={submit}
            disabled={busy || !email.trim() || password.length < 8}
          />
        </Card>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
        Already joined?{' '}
        <Link href={{ pathname: '/sign-in', params: { as: 'caregiver' } }} replace>
          <ThemedText type="smallBold" themeColor="accent">
            Sign in
          </ThemedText>
        </Link>
      </ThemedText>
    </Screen>
  );
}
