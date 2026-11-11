import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { areaLabel } from '@/components/cocare';
import { Badge, Button, Card, Chip, Row, Screen } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { useAction } from '@/hooks/use-action';
import { api } from '@/lib/api';
import { ACTIVITIES, DEFAULT_SONG, GOALS } from '@/shared/library';
import { fill } from '@/shared/messages';
import type { DevArea, LibraryActivity } from '@/shared/types';
import { useFamily } from '@/state/session';

/** "Unsafe → check age safety labels": activities outside the child's age range can't be added. */
function ageIssue(activity: LibraryActivity, ageMonths: number, childName: string) {
  if (ageMonths < activity.minAgeMonths) {
    const label = activity.safetyLabels[0]?.en;
    return `For ${activity.minAgeMonths}+ months; ${childName} is ${ageMonths} months.${label ? ` ${label}` : ''}`;
  }
  if (ageMonths > activity.maxAgeMonths) return `Made for ${activity.minAgeMonths}–${activity.maxAgeMonths} months.`;
  return null;
}

export default function LibraryScreen() {
  const { goalId } = useLocalSearchParams<{ goalId?: string }>();
  const family = useFamily();
  const { parent, goals, activities } = family;
  const { busy, run } = useAction();
  const linkedGoal = family.goal(goalId);

  const goalAreas = [...new Set(goals.filter((g) => g.active).map((g) => g.area))];
  const [area, setArea] = useState<DevArea | 'all'>(linkedGoal?.area ?? (goalAreas.length === 1 ? goalAreas[0] : 'all'));

  const added = new Set(activities.map((a) => a.libraryId).filter(Boolean));
  const shown = ACTIVITIES.filter((a) => area === 'all' || a.area === area);

  const add = (a: LibraryActivity) => {
    const goal = linkedGoal ?? goals.find((g) => g.active && g.area === a.area);
    return run(a.id, () => api.post('/api/activities/from-library', { libraryId: a.id, goalId: goal?.id ?? null })).then(
      family.reload
    );
  };

  return (
    <Screen
      title="Activity library"
      subtitle="Reviewed activities, checked against your child’s age and translated into Spanish, Mandarin and Tagalog.">
      <Row>
        <Chip label="All" selected={area === 'all'} onPress={() => setArea('all')} />
        {GOALS.map((g) => (
          <Chip
            key={g.id}
            label={`${g.short}${goalAreas.includes(g.id) ? ' ★' : ''}`}
            selected={area === g.id}
            onPress={() => setArea(g.id)}
          />
        ))}
      </Row>
      {linkedGoal ? (
        <ThemedText type="small" themeColor="textSecondary">
          Activities you add will be linked to “{linkedGoal.title}”.
        </ThemedText>
      ) : null}

      {shown.map((a) => {
        const issue = parent ? ageIssue(a, parent.childAgeMonths, parent.childName) : null;
        const isAdded = added.has(a.id);
        return (
          <Card key={a.id} style={{ opacity: issue ? 0.6 : 1 }}>
            <Row>
              <ThemedText type="smallBold" style={{ flex: 1 }}>
                {a.title.en}
              </ThemedText>
              <Badge label={areaLabel(a.area)} tone="accent" />
              <Badge label={`${a.minutes} min`} />
            </Row>
            {a.steps.map((s, i) => (
              <ThemedText key={i} type="small" themeColor="textSecondary">
                {i + 1}. {fill(s.en, { song: DEFAULT_SONG.en })}
              </ThemedText>
            ))}
            {a.needsItems.length ? (
              <ThemedText type="small" themeColor="textSecondary">
                Needs: {a.needsItems.join(', ')}
              </ThemedText>
            ) : null}
            {a.safetyLabels[0] && !issue ? (
              <ThemedText type="small" themeColor="warn">
                ⚠ {a.safetyLabels[0].en}
              </ThemedText>
            ) : null}
            {issue ? (
              <ThemedText type="small" themeColor="danger">
                Not offered: {issue}
              </ThemedText>
            ) : (
              <Row>
                <Button
                  small
                  label={isAdded ? 'Added ✓' : busy === a.id ? 'Adding…' : 'Add to my activities'}
                  variant={isAdded ? 'secondary' : 'primary'}
                  disabled={isAdded || !!busy}
                  onPress={() => add(a)}
                />
              </Row>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}
