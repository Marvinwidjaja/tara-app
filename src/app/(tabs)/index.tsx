import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AlertCard, AssignmentCard, CAREGIVER_STATUS } from '@/components/cocare';
import { Badge, Button, Card, DateStrip, Empty, ErrorText, Row, Screen, Section } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useQuery } from '@/hooks/use-query';
import { addDays, prettyDate, startOfWeek, weekDates, weekdayShort } from '@/lib/dates';
import { ROUTINE_ANCHORS } from '@/shared/library';
import type { Assignment } from '@/shared/types';
import { useFamily } from '@/state/session';

const ANCHOR_ORDER = ROUTINE_ANCHORS.map((a) => a.id);

export default function TodayScreen() {
  const family = useFamily();
  const { parent, today, caregivers, goals, activities, alerts } = family;
  const [selected, setSelected] = useState(today);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));

  const week = useQuery<Assignment[]>(`/api/assignments?from=${weekStart}&to=${addDays(weekStart, 6)}`, {
    pollMs: 10_000,
  });
  const dayItems = (week.data ?? [])
    .filter((a) => a.date === selected)
    .sort((a, b) => ANCHOR_ORDER.indexOf(a.anchor) - ANCHOR_ORDER.indexOf(b.anchor));
  const markedDates = [...new Set((week.data ?? []).map((a) => a.date))];

  const refresh = () => {
    void week.reload();
    void family.reload();
  };

  const onDuty = caregivers.filter(
    (c) => c.days.includes(weekdayShort(selected)) || dayItems.some((a) => a.caregiverId === c.id)
  );
  const isPast = selected < today;

  const setupSteps = [
    { done: caregivers.length > 0, label: 'Add a caregiver', action: () => router.push('/caregiver-edit') },
    { done: goals.length > 0, label: 'Set a goal for your child', action: () => router.push('/goal') },
    { done: activities.length > 0, label: 'Add activities (or pick from the library)', action: () => router.push('/library') },
  ];
  const setupDone = setupSteps.every((s) => s.done);

  return (
    <Screen
      step={parent ? `${parent.childName.toUpperCase()} · ${parent.childAgeMonths} MONTHS` : 'TARA'}
      title={parent ? `Hi ${parent.name}` : 'Today'}
      subtitle="Assign activities; caregivers see them in TARA and tell you how the day went.">

      {!setupDone ? (
        <Section title="Get started">
          <Card tone="accent">
            {setupSteps.map((s, i) => (
              <Row key={s.label}>
                <ThemedText type="smallBold">{s.done ? '✓' : `${i + 1}.`}</ThemedText>
                <ThemedText type="small" style={{ flex: 1, opacity: s.done ? 0.6 : 1 }}>
                  {s.label}
                </ThemedText>
                {!s.done ? <Button small label="Start" onPress={s.action} /> : null}
              </Row>
            ))}
          </Card>
        </Section>
      ) : null}

      {alerts.length > 0 ? (
        <Section title={`Needs you (${alerts.length})`} hint="Questions and worries from caregivers always come to you. TARA never answers them for you.">
          {alerts.map((a) => (
            <AlertCard key={a.id} alert={a} onChanged={refresh} />
          ))}
        </Section>
      ) : null}

      <Section title="Plan" hint={prettyDate(selected, today)}>
        <DateStrip
          weekStart={weekStart}
          value={selected}
          today={today}
          marked={markedDates}
          onChange={setSelected}
          onWeekChange={(dir) => {
            const next = addDays(weekStart, dir * 7);
            setWeekStart(next);
            setSelected(weekDates(next).includes(today) ? today : next);
          }}
        />
        <ErrorText message={week.error} />
        {!isPast ? (
          <Button
            label="+ Assign an activity"
            onPress={() => router.push({ pathname: '/assign', params: { date: selected } })}
            disabled={caregivers.length === 0 || activities.length === 0}
          />
        ) : null}
      </Section>

      {week.loading && !week.data ? (
        <ThemedText type="small" themeColor="textSecondary">
          Loading…
        </ThemedText>
      ) : onDuty.length === 0 ? (
        <Empty title="Nobody is scheduled">
          <ThemedText type="small" themeColor="textSecondary">
            No caregiver works on {weekdayShort(selected)}. You can still assign an activity to anyone.
          </ThemedText>
        </Empty>
      ) : (
        onDuty.map((c) => {
          const items = dayItems.filter((a) => a.caregiverId === c.id);
          const status = CAREGIVER_STATUS[c.status];
          return (
            <Section
              key={c.id}
              title={`${c.name}${c.relation ? ` · ${c.relation}` : ''}`}
              right={<Badge label={status.label} tone={status.tone} />}>
              {items.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Nothing assigned{isPast ? '' : ' yet'}.
                </ThemedText>
              ) : (
                <View style={{ gap: Spacing.two }}>
                  {items.map((a) => (
                    <AssignmentCard key={a.id} assignment={a} onChanged={refresh} />
                  ))}
                </View>
              )}
              <Row>
                <Button
                  small
                  variant="secondary"
                  label="Messages"
                  onPress={() => router.push({ pathname: '/caregiver/[id]', params: { id: c.id } })}
                />
                {c.status !== 'joined' ? (
                  <ThemedText type="small" themeColor="warn" style={{ flexShrink: 1 }}>
                    {c.status === 'stopped'
                      ? `${c.name}’s access is paused, so they can’t see this.`
                      : `${c.name} hasn’t joined TARA yet. Share their invite code from Family.`}
                  </ThemedText>
                ) : null}
              </Row>
            </Section>
          );
        })
      )}
    </Screen>
  );
}
