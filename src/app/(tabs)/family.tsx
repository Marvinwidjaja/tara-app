import { router } from 'expo-router';
import { useState } from 'react';

import { CAREGIVER_STATUS, languageName } from '@/components/cocare';
import { InviteCard } from '@/components/invite-card';
import { Badge, Button, Card, Empty, Field, Row, Screen, Section } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { useAction } from '@/hooks/use-action';
import { api, API_URL } from '@/lib/api';
import { WEEKDAYS, type Parent } from '@/shared/types';
import { useFamily, useSession } from '@/state/session';

export default function FamilyScreen() {
  const family = useFamily();
  const { signOut } = useSession();
  const { parent, caregivers } = family;

  return (
    <Screen step="STEP 1 · SET UP THE FAMILY" title="Family" subtitle="Who cares for your child, and what they see.">
      <Section
        title="Caregivers"
        hint="Each caregiver gets their own TARA login. Make an invite code and share it with them."
        right={<Button small label="+ Caregiver" onPress={() => router.push('/caregiver-edit')} />}>
        {caregivers.length === 0 ? (
          <Empty title="No caregivers yet">
            <ThemedText type="small" themeColor="textSecondary">
              Add a nanny, grandparent or anyone who looks after your child. They sign in to TARA to see their activities
              in their own language and tell you how they went.
            </ThemedText>
          </Empty>
        ) : (
          caregivers.map((c) => {
            const status = CAREGIVER_STATUS[c.status];
            return (
              <Card key={c.id}>
                <Row>
                  <ThemedText type="smallBold" style={{ flex: 1 }}>
                    {c.name}
                    {c.relation ? ` · ${c.relation}` : ''}
                  </ThemedText>
                  <Badge label={status.label} tone={status.tone} />
                </Row>
                <ThemedText type="small" themeColor="textSecondary">
                  {languageName(c.language)}
                  {c.phone ? ` · ${c.phone}` : ''}
                  {c.email ? ` · ${c.email}` : ''}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {c.days.length ? WEEKDAYS.filter((d) => c.days.includes(d)).join(' ') : 'No regular days'}
                  {' · '}
                  Sees: plan{c.seesGoals ? ', goals' : ''}
                  {c.seesDayDetails ? ', how the day went' : ''}
                </ThemedText>
                {c.status !== 'joined' ? <InviteCard caregiver={c} /> : null}
                <Row>
                  <Button
                    small
                    variant="secondary"
                    label="Messages"
                    onPress={() => router.push({ pathname: '/caregiver/[id]', params: { id: c.id } })}
                  />
                  <Button
                    small
                    variant="ghost"
                    label="Edit"
                    onPress={() => router.push({ pathname: '/caregiver-edit', params: { id: c.id } })}
                  />
                </Row>
              </Card>
            );
          })
        )}
      </Section>

      <Section title="You and your child">
        {parent ? <ProfileForm key={JSON.stringify(parent)} parent={parent} onSaved={family.reload} /> : null}
      </Section>

      <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
        Connected to {API_URL}
      </ThemedText>
      <Button variant="danger" label="Sign out" onPress={signOut} />
    </Screen>
  );
}

function ProfileForm({ parent, onSaved }: { parent: Parent; onSaved: () => Promise<void> }) {
  const { busy, run } = useAction();
  const [profile, setProfile] = useState({
    name: parent.name,
    phone: parent.phone ?? '',
    childName: parent.childName,
    childAgeMonths: String(parent.childAgeMonths),
  });

  const save = () =>
    run(
      'profile',
      () =>
        api.patch('/api/me', {
          name: profile.name,
          phone: profile.phone,
          childName: profile.childName,
          childAgeMonths: Number(profile.childAgeMonths),
        }),
      'Saved'
    ).then(onSaved);

  return (
    <Card>
      <Field label="Your name" value={profile.name} onChangeText={(name) => setProfile((p) => ({ ...p, name }))} />
      <Field
        label="Your phone (optional, caregivers can call you)"
        value={profile.phone}
        onChangeText={(phone) => setProfile((p) => ({ ...p, phone }))}
        keyboardType="phone-pad"
        placeholder="+1 415 555 0123"
      />
      <Row style={{ alignItems: 'flex-start' }}>
        <Field
          label="Child’s name"
          value={profile.childName}
          onChangeText={(childName) => setProfile((p) => ({ ...p, childName }))}
          style={{ minWidth: 160 }}
        />
        <Field
          label="Age (months)"
          value={profile.childAgeMonths}
          onChangeText={(v) => setProfile((p) => ({ ...p, childAgeMonths: v.replace(/\D/g, '') }))}
          keyboardType="number-pad"
          style={{ width: 120 }}
        />
      </Row>
      <Button label={busy === 'profile' ? 'Saving…' : 'Save'} onPress={save} disabled={!!busy} />
      <ThemedText type="small" themeColor="textSecondary">
        Signed in as {parent.email} · time zone {parent.timezone}
      </ThemedText>
    </Card>
  );
}
