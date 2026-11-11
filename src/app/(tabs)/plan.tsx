import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { areaLabel } from '@/components/cocare';
import { Badge, Button, Card, Chip, Empty, Row, Screen, Section } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAction } from '@/hooks/use-action';
import { api } from '@/lib/api';
import { GOALS } from '@/shared/library';
import type { Activity, Goal } from '@/shared/types';
import { useFamily } from '@/state/session';

export default function PlanScreen() {
  const family = useFamily();
  const { goals, activities, parent } = family;
  const { busy, run } = useAction();

  const quickAddGoal = (g: (typeof GOALS)[number]) =>
    run(`goal-${g.id}`, () => api.post('/api/goals', { title: g.label, area: g.id })).then(family.reload);

  const groups: { goal: Goal | null; items: Activity[] }[] = [
    ...goals.map((goal) => ({ goal, items: activities.filter((a) => a.goalId === goal.id) })),
    { goal: null, items: activities.filter((a) => !a.goalId || !goals.some((g) => g.id === a.goalId)) },
  ];

  return (
    <Screen
      step="STEPS 2–3 · GOALS AND ACTIVITIES"
      title="Plan"
      subtitle={`What you want ${parent?.childName ?? 'your child'} to work on, and the activities caregivers will do.`}>
      <Section
        title="Goals"
        hint="You decide the goals. Caregivers can suggest ideas, and they come to you."
        right={<Button small label="+ Goal" onPress={() => router.push('/goal')} />}>
        {goals.length === 0 ? (
          <Empty title="No goals yet">
            <ThemedText type="small" themeColor="textSecondary">
              Tap one to add it, or create your own.
            </ThemedText>
            <Row>
              {GOALS.map((g) => (
                <Chip key={g.id} label={g.label} disabled={!!busy} onPress={() => quickAddGoal(g)} />
              ))}
            </Row>
          </Empty>
        ) : (
          goals.map((g) => (
            <Pressable
              key={g.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/goal', params: { id: g.id } })}>
              {({ pressed }) => (
                <Card style={{ opacity: pressed ? 0.7 : g.active ? 1 : 0.55 }}>
                  <Row>
                    <ThemedText type="smallBold" style={{ flex: 1 }}>
                      {g.title}
                    </ThemedText>
                    <Badge label={areaLabel(g.area)} tone="accent" />
                    {!g.active ? <Badge label="Paused" /> : null}
                  </Row>
                  {g.notes ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {g.notes}
                    </ThemedText>
                  ) : null}
                </Card>
              )}
            </Pressable>
          ))
        )}
      </Section>

      <Section
        title="Activities"
        hint="Short, numbered steps work best in a text message."
        right={
          <Row>
            <Button small variant="secondary" label="Library" onPress={() => router.push('/library')} />
            <Button small label="+ New" onPress={() => router.push('/activity')} />
          </Row>
        }>
        {activities.length === 0 ? (
          <Empty title="No activities yet">
            <ThemedText type="small" themeColor="textSecondary">
              Write your own, or pick from the reviewed library. Library activities are safety-checked for your child’s
              age and already translated into Spanish, Mandarin and Tagalog.
            </ThemedText>
            <Button label="Browse the library" onPress={() => router.push('/library')} />
          </Empty>
        ) : (
          groups
            .filter((g) => g.items.length > 0)
            .map(({ goal, items }) => (
              <View key={goal?.id ?? 'none'} style={{ gap: Spacing.two }}>
                <ThemedText type="small" themeColor="textSecondary">
                  {goal ? goal.title : 'Not linked to a goal'}
                </ThemedText>
                {items.map((a) => (
                  <ActivityRow key={a.id} activity={a} />
                ))}
              </View>
            ))
        )}
      </Section>
    </Screen>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  return (
    <Card>
      <Row>
        <ThemedText type="smallBold" style={{ flex: 1 }}>
          {activity.title}
        </ThemedText>
        {activity.libraryId ? <Badge label="Translated" tone="accent" /> : null}
        <Badge label={`${activity.minutes} min`} />
      </Row>
      {activity.steps.slice(0, 3).map((s, i) => (
        <ThemedText key={i} type="small" themeColor="textSecondary">
          {i + 1}. {s}
        </ThemedText>
      ))}
      {activity.safetyNote ? (
        <ThemedText type="small" themeColor="warn">
          ⚠ {activity.safetyNote}
        </ThemedText>
      ) : null}
      <Row>
        <Button
          small
          variant="secondary"
          label="Assign"
          onPress={() => router.push({ pathname: '/assign', params: { activityId: activity.id } })}
        />
        <Button
          small
          variant="ghost"
          label="Edit"
          onPress={() => router.push({ pathname: '/activity', params: { id: activity.id } })}
        />
      </Row>
    </Card>
  );
}
