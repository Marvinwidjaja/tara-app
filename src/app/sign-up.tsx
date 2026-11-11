import { Link } from 'expo-router';
import { useState } from 'react';

import { Button, Card, ErrorText, Field, Row, Screen, Section } from '@/components/kit';
import { TaraLogo } from '@/components/tara-logo';
import { ThemedText } from '@/components/themed-text';
import { errorMessage } from '@/lib/api';
import { useSession } from '@/state/session';

export default function SignUpScreen() {
  const { signUp } = useSession();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    childName: '',
    childAgeMonths: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const age = Number(form.childAgeMonths);
  const ready =
    form.name.trim() && form.email.trim() && form.password.length >= 8 && form.childName.trim() && form.childAgeMonths && Number.isInteger(age);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        childName: form.childName.trim(),
        childAgeMonths: age,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen top={<TaraLogo width={80} />} title="Create your account" subtitle="You set the goals and approve every plan. Caregivers only see what you share.">
      <Section title="You">
        <Card>
          <Field label="Your name" value={form.name} onChangeText={set('name')} autoComplete="name" placeholder="Jordan" />
          <Field
            label="Email"
            value={form.email}
            onChangeText={set('email')}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Field
            label="Password (8+ characters)"
            value={form.password}
            onChangeText={set('password')}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <Field
            label="Your phone (optional, caregivers can call you)"
            value={form.phone}
            onChangeText={set('phone')}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="+1 415 555 0123"
          />
        </Card>
      </Section>

      <Section title="Your child">
        <Card>
          <Row style={{ alignItems: 'flex-start' }}>
            <Field
              label="First name"
              value={form.childName}
              onChangeText={set('childName')}
              placeholder="Mia"
              style={{ minWidth: 160 }}
            />
            <Field
              label="Age in months"
              value={form.childAgeMonths}
              onChangeText={(v) => set('childAgeMonths')(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
              placeholder="18"
              style={{ width: 120 }}
            />
          </Row>
          <ThemedText type="small" themeColor="textSecondary">
            Age is used to keep activities safe (for example, no small parts under 3 years).
          </ThemedText>
        </Card>
      </Section>

      <ErrorText message={error} />
      <Button label={busy ? 'Creating account…' : 'Create account'} onPress={submit} disabled={busy || !ready} />

      <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
        Already have an account?{' '}
        <Link href="/sign-in" replace>
          <ThemedText type="smallBold" themeColor="accent">
            Sign in
          </ThemedText>
        </Link>
      </ThemedText>
    </Screen>
  );
}
