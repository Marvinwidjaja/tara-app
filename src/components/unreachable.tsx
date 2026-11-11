import { useState } from 'react';

import { Button, Card, ErrorText, Row, Screen } from '@/components/kit';
import { TaraLogo } from '@/components/tara-logo';
import { ThemedText } from '@/components/themed-text';
import { API_URL, errorMessage, unreachableMessage } from '@/lib/api';
import { useSession } from '@/state/session';

/** Shown when a saved sign-in exists but the backend can't be reached to load the family's data. */
export function UnreachableScreen() {
  const { retry, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tryAgain = async () => {
    setBusy(true);
    setError(null);
    try {
      await retry();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen top={<TaraLogo width={90} />} title="Can’t reach TARA" subtitle={unreachableMessage()}>
      <Card>
        <ThemedText type="smallBold">To start the backend</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          In a terminal: cd TARA_backend, then npm run dev. It should say “TARA API on http://localhost:4000”.
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Looking for it at {API_URL}. To use a different address, set EXPO_PUBLIC_API_URL and restart the app.
        </ThemedText>
      </Card>
      <ErrorText message={error} />
      <Row>
        <Button label={busy ? 'Trying…' : 'Try again'} onPress={tryAgain} disabled={busy} />
        <Button variant="secondary" label="Sign out" onPress={signOut} disabled={busy} />
      </Row>
    </Screen>
  );
}
