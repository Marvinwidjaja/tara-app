import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { anchorLabel, STATUS } from '@/components/cocare';
import {
  Badge,
  Button,
  Card,
  ChoiceRow,
  DateStrip,
  Empty,
  ErrorText,
  Field,
  Row,
  Screen,
  Section,
} from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { useQuery } from '@/hooks/use-query';
import { ApiError, api, errorMessage } from '@/lib/api';
import { addDays, prettyDate, startOfWeek, weekdayShort } from '@/lib/dates';
import { closeScreen } from '@/lib/navigation';
import { confirmAction, notify } from '@/lib/notify';
import { ROUTINE_ANCHORS } from '@/shared/library';
import type { Assignment, RoutineAnchorId } from '@/shared/types';
import { useFamily } from '@/state/session';

type Params = { id?: string; date?: string; activityId?: string; caregiverId?: string };

export default function AssignScreen() {
  const params = useLocalSearchParams<Params>();
  const { today } = useFamily();
  const date = params.date && params.date >= today ? params.date : today;
  // Editing: load the assignment first, then render the form with its values.
  const existing = useQuery<Assignment[]>(params.id ? `/api/assignments?from=${params.date}&to=${params.date}` : null);
  if (params.id) {
    const found = existing.data?.find((a) => a.id === params.id);
    if (existing.error) return <Screen title="Edit assignment"><ErrorText message={existing.error} /></Screen>;
    if (!found) return <Screen title="Edit assignment"><ThemedText type="small" themeColor="textSecondary">Loading…</ThemedText></Screen>;
    return <AssignForm existing={found} initial={{ ...params, date: found.date }} />;
  }
  return <AssignForm initial={{ ...params, date }} />;
}

function AssignForm({ existing, initial }: { existing?: Assignment; initial: Params & { date: string } }) {
  const family = useFamily();
  const { caregivers, activities, today } = family;

  const [date, setDate] = useState(existing?.date ?? initial.date);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(date));
  const onDutyFirst = [...caregivers].sort(
    (a, b) => Number(b.days.includes(weekdayShort(date))) - Number(a.days.includes(weekdayShort(date)))
  );
  const [caregiverId, setCaregiverId] = useState(
    existing?.caregiverId ?? initial.caregiverId ?? onDutyFirst[0]?.id ?? ''
  );
  const [activityId, setActivityId] = useState(existing?.activityId ?? initial.activityId ?? activities[0]?.id ?? '');
  const [anchor, setAnchor] = useState<RoutineAnchorId>(existing?.anchor ?? 'after-breakfast');
  const [note, setNote] = useState(existing?.note ?? '');
  const caregiver = family.caregiver(caregiverId);
  const [busy, setBusy] = useState(false);

  const dayTaken = useQuery<Assignment[]>(`/api/assignments?from=${date}&to=${date}`);
  const sameShift = (dayTaken.data ?? []).filter((a) => a.caregiverId === caregiverId && a.id !== existing?.id);

  if (caregivers.length === 0 || activities.length === 0) {
    return (
      <Screen title="Assign an activity">
        <Empty title={caregivers.length === 0 ? 'Add a caregiver first' : 'Add an activity first'}>
          <Button
            label={caregivers.length === 0 ? 'Add caregiver' : 'Browse the library'}
            onPress={() => router.replace(caregivers.length === 0 ? '/caregiver-edit' : '/library')}
          />
        </Empty>
      </Screen>
    );
  }

  const save = async (allowMore = false) => {
    setBusy(true);
    try {
      if (existing) {
        await api.patch(`/api/assignments/${existing.id}`, { caregiverId, activityId, date, anchor, note });
      } else {
        await api.post('/api/assignments', { caregiverId, activityId, date, anchor, note, allowMore });
      }
      closeScreen('/');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && !allowMore) {
        if (await confirmAction('That’s a lot for one day', `${err.message}\n\nAdd it anyway?`, 'Add anyway')) {
          return save(true);
        }
      } else {
        notify('Could not save', errorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!existing) return;
    if (!(await confirmAction('Remove this assignment?', 'It disappears from the caregiver’s TARA too.', 'Remove'))) return;
    try {
      await api.delete(`/api/assignments/${existing.id}`);
      closeScreen('/');
    } catch (err) {
      notify('Could not remove', errorMessage(err));
    }
  };

  return (
    <Screen title={existing ? 'Edit assignment' : 'Assign an activity'} subtitle={prettyDate(date, today)}>
      {existing ? (
        <Row>
          <Badge label={STATUS[existing.status].label} tone={STATUS[existing.status].tone} />
          <ThemedText type="small" themeColor="textSecondary">
            Changes show up in {caregiver?.name ?? 'the caregiver'}’s TARA right away.
          </ThemedText>
        </Row>
      ) : null}

      <Section title="Day">
        <DateStrip
          weekStart={weekStart}
          value={date}
          today={today}
          onChange={(d) => (d >= today ? setDate(d) : notify('Pick today or a later day'))}
          onWeekChange={(dir) => {
            const next = addDays(weekStart, dir * 7);
            if (addDays(next, 6) < today) return;
            setWeekStart(next);
          }}
        />
      </Section>

      <Section title="Who">
        <ChoiceRow
          options={onDutyFirst.map((c) => ({
            id: c.id,
            label: `${c.name}${c.days.includes(weekdayShort(date)) ? '' : ' (off)'}`,
          }))}
          value={caregiverId}
          onChange={setCaregiverId}
        />
        {sameShift.length >= 2 ? (
          <ThemedText type="small" themeColor="warn">
            {caregiver?.name} already has {sameShift.length} activities that day. One or two per shift works best.
          </ThemedText>
        ) : null}
      </Section>

      <Section title="What">
        <ChoiceRow options={activities.map((a) => ({ id: a.id, label: a.title }))} value={activityId} onChange={setActivityId} />
      </Section>

      <Section title="When in the day" hint="Fit it into the caregiver’s routine: active play after meals or naps, calm play before sleep.">
        <ChoiceRow
          options={ROUTINE_ANCHORS.map((a) => ({ id: a.id, label: `${anchorLabel(a.id)}${a.energy === 'calm' ? ' · calm' : ''}` }))}
          value={anchor}
          onChange={setAnchor}
        />
      </Section>

      <Card>
        <Field
          label="Note for the caregiver (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="She’s been loving the farm book"
          multiline
        />
        {!existing ? (
          <ThemedText type="small" themeColor="textSecondary">
            {caregiver?.status === 'joined'
              ? `${caregiver.name} sees it in their TARA right away, in ${caregiver.language === 'en' ? 'English' : 'their language'}.`
              : `${caregiver?.name ?? 'This caregiver'} will see it once they join TARA with their invite code.`}
          </ThemedText>
        ) : null}
      </Card>

      <Row>
        <Button
          label={busy ? 'Saving…' : existing ? 'Save changes' : 'Assign'}
          onPress={() => save()}
          disabled={busy || !caregiverId || !activityId}
        />
        {existing ? <Button variant="danger" label="Remove" onPress={remove} disabled={busy} /> : null}
      </Row>
    </Screen>
  );
}
