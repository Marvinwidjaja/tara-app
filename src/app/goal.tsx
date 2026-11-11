import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button, Card, ChoiceRow, Field, Row, Screen, ToggleRow } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { useAction } from '@/hooks/use-action';
import { api } from '@/lib/api';
import { closeScreen } from '@/lib/navigation';
import { confirmAction } from '@/lib/notify';
import { GOALS } from '@/shared/library';
import type { DevArea } from '@/shared/types';
import { useFamily } from '@/state/session';

export default function GoalScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const family = useFamily();
  const existing = family.goal(id);
  const { busy, run } = useAction();

  const [title, setTitle] = useState(existing?.title ?? '');
  const [area, setArea] = useState<DevArea>(existing?.area ?? 'language');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [active, setActive] = useState(existing?.active ?? true);

  const save = async () => {
    const body = { title, area, notes, active };
    const ok = await run('save', () => (existing ? api.patch(`/api/goals/${existing.id}`, body) : api.post('/api/goals', body)));
    if (ok) {
      await family.reload();
      closeScreen('/plan');
    }
  };

  const remove = async () => {
    if (!existing) return;
    if (!(await confirmAction('Delete goal?', 'Activities linked to it stay, but lose the link.'))) return;
    const ok = await run('delete', () => api.delete(`/api/goals/${existing.id}`));
    if (ok) {
      await family.reload();
      closeScreen('/plan');
    }
  };

  return (
    <Screen title={existing ? 'Edit goal' : 'New goal'} subtitle="What do you want to work on? Caregivers can suggest goals, but you decide.">
      <Card>
        <Field label="Goal" value={title} onChangeText={setTitle} placeholder="Say 10 new words by spring" />
        <ThemedText type="small" themeColor="textSecondary">
          Area (used to translate the goal for caregivers and to suggest library activities)
        </ThemedText>
        <ChoiceRow options={GOALS.map((g) => ({ id: g.id, label: g.short }))} value={area} onChange={setArea} />
        <Field label="Notes (only you see these)" value={notes} onChangeText={setNotes} multiline />
        {existing ? (
          <ToggleRow
            label="Active"
            hint="Paused goals aren’t mentioned in caregiver texts."
            value={active}
            onValueChange={setActive}
          />
        ) : null}
      </Card>
      <Row>
        <Button label={busy === 'save' ? 'Saving…' : 'Save goal'} onPress={save} disabled={!!busy || !title.trim()} />
        {existing ? (
          <Button
            variant="secondary"
            label="Find activities"
            onPress={() => router.push({ pathname: '/library', params: { goalId: existing.id } })}
          />
        ) : null}
        {existing ? <Button variant="danger" label="Delete" onPress={remove} disabled={!!busy} /> : null}
      </Row>
    </Screen>
  );
}
