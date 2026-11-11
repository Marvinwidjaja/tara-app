import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button, Card, ChoiceRow, Field, Row, Screen } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { useAction } from '@/hooks/use-action';
import { api } from '@/lib/api';
import { closeScreen } from '@/lib/navigation';
import { confirmAction } from '@/lib/notify';
import { useFamily } from '@/state/session';

const MAX_STEPS = 8;

export default function ActivityScreen() {
  const { id, goalId } = useLocalSearchParams<{ id?: string; goalId?: string }>();
  const family = useFamily();
  const existing = family.activity(id);
  const { busy, run } = useAction();

  const [title, setTitle] = useState(existing?.title ?? '');
  const [steps, setSteps] = useState<string[]>(existing?.steps.length ? existing.steps : ['', '']);
  const [minutes, setMinutes] = useState(String(existing?.minutes ?? 10));
  const [safetyNote, setSafetyNote] = useState(existing?.safetyNote ?? '');
  const [goal, setGoal] = useState<string>(existing?.goalId ?? goalId ?? 'none');

  const setStep = (i: number, value: string) => setSteps((s) => s.map((v, j) => (j === i ? value : v)));
  const translated = !!existing?.libraryId;
  const changedWording =
    translated && (title !== existing!.title || steps.filter(Boolean).join('|') !== existing!.steps.join('|'));

  const save = async () => {
    const body = {
      title,
      steps: steps.map((s) => s.trim()).filter(Boolean),
      minutes: Number(minutes) || 10,
      safetyNote,
      goalId: goal === 'none' ? null : goal,
    };
    const ok = await run('save', () =>
      existing ? api.patch(`/api/activities/${existing.id}`, body) : api.post('/api/activities', body)
    );
    if (ok) {
      await family.reload();
      closeScreen('/plan');
    }
  };

  const remove = async () => {
    if (!existing) return;
    if (!(await confirmAction('Delete activity?', 'Any assignments of this activity are deleted too.'))) return;
    const ok = await run('delete', () => api.delete(`/api/activities/${existing.id}`));
    if (ok) {
      await family.reload();
      closeScreen('/plan');
    }
  };

  return (
    <Screen
      title={existing ? 'Edit activity' : 'New activity'}
      subtitle="Texts can’t show pictures, so keep it to a few short steps anyone can follow.">
      <Card>
        <Field label="Name" value={title} onChangeText={setTitle} placeholder="Name the animals" />
        <ThemedText type="small" themeColor="textSecondary">
          Steps
        </ThemedText>
        {steps.map((s, i) => (
          <Field
            key={i}
            value={s}
            onChangeText={(v) => setStep(i, v)}
            placeholder={i === 0 ? 'Open the farm book together' : 'Point and say each animal’s name'}
            accessibilityLabel={`Step ${i + 1}`}
          />
        ))}
        <Row>
          {steps.length < MAX_STEPS ? (
            <Button small variant="secondary" label="+ Step" onPress={() => setSteps((s) => [...s, ''])} />
          ) : null}
          {steps.length > 1 ? (
            <Button small variant="ghost" label="Remove last step" onPress={() => setSteps((s) => s.slice(0, -1))} />
          ) : null}
        </Row>
        <Field
          label="Minutes"
          value={minutes}
          onChangeText={(v) => setMinutes(v.replace(/\D/g, ''))}
          keyboardType="number-pad"
          style={{ width: 100 }}
        />
        <Field
          label="Safety note (optional)"
          value={safetyNote}
          onChangeText={setSafetyNote}
          placeholder="Stay within arm’s reach near water"
        />
        <ThemedText type="small" themeColor="textSecondary">
          Goal
        </ThemedText>
        <ChoiceRow
          options={[{ id: 'none', label: 'No goal' }, ...family.goals.map((g) => ({ id: g.id, label: g.title }))]}
          value={goal}
          onChange={setGoal}
        />
      </Card>

      {translated ? (
        <Card tone={changedWording ? 'warn' : 'accent'}>
          <ThemedText type="small">
            {changedWording
              ? 'You changed the wording, so caregivers will get it exactly as you wrote it instead of the reviewed translation.'
              : 'From the reviewed library: caregivers get this in their own language.'}
          </ThemedText>
        </Card>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          Caregivers get your own activities exactly as written, so write them in a language they read.
        </ThemedText>
      )}

      <Row>
        <Button label={busy === 'save' ? 'Saving…' : 'Save activity'} onPress={save} disabled={!!busy || !title.trim()} />
        {existing ? <Button variant="danger" label="Delete" onPress={remove} disabled={!!busy} /> : null}
      </Row>
    </Screen>
  );
}
