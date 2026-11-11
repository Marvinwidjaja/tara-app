import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { CAREGIVER_STATUS } from '@/components/cocare';
import { InviteCard } from '@/components/invite-card';
import { Badge, Button, Card, Chip, ChoiceRow, Field, Row, Screen, Section, ToggleRow } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { useAction } from '@/hooks/use-action';
import { api } from '@/lib/api';
import { closeAll, closeScreen } from '@/lib/navigation';
import { confirmAction } from '@/lib/notify';
import { LANGUAGES } from '@/shared/library';
import { WEEKDAYS, type Caregiver, type Language, type Weekday } from '@/shared/types';
import { useFamily } from '@/state/session';

export default function CaregiverEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const family = useFamily();
  const existing = family.caregiver(id);
  const { busy, run } = useAction();

  const [name, setName] = useState(existing?.name ?? '');
  const [relation, setRelation] = useState(existing?.relation ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [language, setLanguage] = useState<Language>(existing?.language ?? 'en');
  const [days, setDays] = useState<Weekday[]>(existing?.days ?? []);
  const [seesGoals, setSeesGoals] = useState(existing?.seesGoals ?? false);
  const [seesDayDetails, setSeesDayDetails] = useState(existing?.seesDayDetails ?? false);

  const toggleDay = (d: Weekday) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const save = async () => {
    const body = { name, relation, phone, language, days, seesGoals, seesDayDetails };
    const saved = await run<Caregiver>('save', () =>
      existing ? api.patch(`/api/caregivers/${existing.id}`, body) : api.post('/api/caregivers', body)
    );
    if (saved) {
      await family.reload();
      if (existing) closeScreen('/family');
      else router.replace({ pathname: '/caregiver/[id]', params: { id: saved.id } });
    }
  };

  const setPaused = async (paused: boolean) => {
    if (!existing) return;
    if (paused && !(await confirmAction(`Pause ${existing.name}?`, 'They’re signed out and can’t open TARA until you resume them.', 'Pause'))) return;
    await run('status', () => api.patch(`/api/caregivers/${existing.id}`, { paused }));
    await family.reload();
  };

  const remove = async () => {
    if (!existing) return;
    if (!(await confirmAction(`Remove ${existing.name}?`, 'Their assignments and chat history are deleted too.', 'Remove'))) return;
    const ok = await run('delete', () => api.delete(`/api/caregivers/${existing.id}`));
    if (ok) {
      await family.reload();
      closeAll('/family');
    }
  };

  return (
    <Screen
      title={existing ? `Edit ${existing.name}` : 'New caregiver'}
      subtitle="They sign in to TARA with their own login and see their activities in their own language.">
      <Card>
        <Field label="Name" value={name} onChangeText={setName} placeholder="Rosa" />
        <Field label="Relation" value={relation} onChangeText={setRelation} placeholder="Nanny, Grandpa, Aunt…" />
        <Field
          label="Phone with country code (optional, just for you)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+1 415 555 0123"
        />
      </Card>

      <Section title="Language" hint="TARA and library activities appear in this language. They can change it themselves too.">
        <ChoiceRow options={LANGUAGES.map((l) => ({ id: l.id, label: `${l.label} · ${l.native}` }))} value={language} onChange={setLanguage} />
      </Section>

      <Section title="Days they usually care for your child">
        <Row>
          {WEEKDAYS.map((d) => (
            <Chip key={d} label={d} selected={days.includes(d)} onPress={() => toggleDay(d)} />
          ))}
        </Row>
      </Section>

      <Section title="What they can see" hint="You choose. They always get the plan; the rest is up to you.">
        <Card>
          <ToggleRow label="Your goals" hint="Their Today screen says what you’re working on." value={seesGoals} onValueChange={setSeesGoals} />
          <ToggleRow
            label="How the day went"
            hint="Can include notes from other caregivers that day."
            value={seesDayDetails}
            onValueChange={setSeesDayDetails}
          />
        </Card>
      </Section>

      {existing ? (
        <Section title="Access">
          <Card>
            <Row>
              <Badge label={CAREGIVER_STATUS[existing.status].label} tone={CAREGIVER_STATUS[existing.status].tone} />
            </Row>
            <ThemedText type="small" themeColor="textSecondary">
              {existing.status === 'stopped'
                ? `${existing.name} can’t open TARA right now. Resume to let them back in.`
                : existing.status === 'joined'
                  ? `${existing.name} signs in as ${existing.email}.`
                  : `${existing.name} joins with an invite code from the Family tab.`}
            </ThemedText>
            <Row>
              {existing.status === 'stopped' ? (
                <Button small variant="secondary" label="Resume access" disabled={!!busy} onPress={() => setPaused(false)} />
              ) : (
                <Button small variant="secondary" label="Pause access" disabled={!!busy} onPress={() => setPaused(true)} />
              )}
            </Row>
          </Card>
          {existing.status !== 'stopped' ? <InviteCard caregiver={existing} /> : null}
        </Section>
      ) : null}

      <Row>
        <Button
          label={busy === 'save' ? 'Saving…' : existing ? 'Save' : 'Add caregiver'}
          onPress={save}
          disabled={!!busy || !name.trim()}
        />
        {existing ? <Button variant="danger" label="Remove" onPress={remove} disabled={!!busy} /> : null}
      </Row>
    </Screen>
  );
}
