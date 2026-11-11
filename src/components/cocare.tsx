/** TARA-specific building blocks shared by several screens. */
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { View } from 'react-native';

import { Badge, Button, Card, Chip, Row } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAction } from '@/hooks/use-action';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/dates';
import { anchorById, GOALS, LANGUAGES } from '@/shared/library';
import type {
  Alert,
  AlertKind,
  Assignment,
  AssignmentStatus,
  Caregiver,
  CaregiverStatus,
  DevArea,
  Reaction,
} from '@/shared/types';
import { useFamily } from '@/state/session';

type Tone = 'default' | 'accent' | 'warn' | 'danger';

export const STATUS: Record<AssignmentStatus, { label: string; tone: Tone }> = {
  planned: { label: 'To do', tone: 'default' },
  sent: { label: 'To do', tone: 'default' },
  done: { label: 'Done', tone: 'accent' },
  changed: { label: 'Done (changed)', tone: 'accent' },
  skipped: { label: 'Skipped', tone: 'danger' },
  voice: { label: 'Voice note', tone: 'warn' },
};

export const REACTIONS: { id: Reaction; label: string }[] = [
  { id: 'loved', label: '😍 Loved it' },
  { id: 'ok', label: '🙂 OK' },
  { id: 'not-today', label: '😕 Not today' },
];

export const CAREGIVER_STATUS: Record<CaregiverStatus, { label: string; tone: Tone }> = {
  'not-invited': { label: 'Not invited', tone: 'default' },
  invited: { label: 'Invited · not joined yet', tone: 'warn' },
  joined: { label: 'Joined', tone: 'accent' },
  stopped: { label: 'Paused', tone: 'danger' },
};

export const ALERT_META: Record<AlertKind, { label: string; tone: Tone }> = {
  'parent-question': { label: 'Question for you', tone: 'accent' },
  'development-worry': { label: 'Development note', tone: 'danger' },
  'goal-idea': { label: 'Caregiver idea', tone: 'accent' },
  'no-report': { label: 'No report', tone: 'warn' },
  illness: { label: 'Seems unwell', tone: 'danger' },
  message: { label: 'Message', tone: 'default' },
};

export const areaLabel = (area: DevArea) => GOALS.find((g) => g.id === area)?.short ?? area;
export const languageName = (id: Caregiver['language']) => LANGUAGES.find((l) => l.id === id)?.label ?? id;
export const anchorLabel = (id: Assignment['anchor']) => anchorById(id).label.en;

export function AssignmentCard({
  assignment,
  showCaregiver,
  onChanged,
}: {
  assignment: Assignment;
  showCaregiver?: boolean;
  onChanged: () => void;
}) {
  const family = useFamily();
  const { busy, run } = useAction();
  const activity = family.activity(assignment.activityId);
  const caregiver = family.caregiver(assignment.caregiverId);
  const goal = family.goal(activity?.goalId);
  const status = STATUS[assignment.status];
  const reported = ['done', 'skipped', 'changed'].includes(assignment.status);
  const canNudge =
    ['planned', 'sent'].includes(assignment.status) &&
    assignment.date <= family.today &&
    !assignment.nudgedAt &&
    caregiver?.status === 'joined';

  const update = (patch: Partial<Assignment>, key: string) =>
    run(key, () => api.patch(`/api/assignments/${assignment.id}`, patch)).then(onChanged);

  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText type="smallBold">{activity?.title ?? 'Deleted activity'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {anchorLabel(assignment.anchor)}
            {showCaregiver && caregiver ? ` · ${caregiver.name}` : ''}
            {goal ? ` · ${goal.title}` : ''}
          </ThemedText>
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>

      {assignment.note ? (
        <ThemedText type="small" themeColor="textSecondary">
          ✎ {assignment.note}
        </ThemedText>
      ) : null}
      {assignment.caregiverNote ? <ThemedText type="small">“{assignment.caregiverNote}”</ThemedText> : null}
      {assignment.voiceNoteUrl ? (
        <Button
          small
          variant="secondary"
          label="▶ Play voice note"
          onPress={() => WebBrowser.openBrowserAsync(assignment.voiceNoteUrl!)}
        />
      ) : null}

      <Row>
        <Chip
          label="✓ Done"
          selected={assignment.status === 'done' || assignment.status === 'changed'}
          disabled={!!busy}
          onPress={() => update({ status: 'done' }, 'done')}
        />
        <Chip
          label="Skipped"
          selected={assignment.status === 'skipped'}
          disabled={!!busy}
          onPress={() => update({ status: 'skipped' }, 'skipped')}
        />
        {reported
          ? REACTIONS.map((r) => (
              <Chip
                key={r.id}
                label={r.label}
                selected={assignment.reaction === r.id}
                disabled={!!busy}
                onPress={() => update({ reaction: assignment.reaction === r.id ? null : r.id }, r.id)}
              />
            ))
          : null}
      </Row>

      <Row>
        {canNudge ? (
          <Button
            small
            variant="secondary"
            label={busy === 'nudge' ? 'Sending…' : 'Remind them'}
            disabled={!!busy}
            onPress={() =>
              run('nudge', () => api.post(`/api/assignments/${assignment.id}/nudge`), 'Reminder sent').then(onChanged)
            }
          />
        ) : null}
        {assignment.nudgedAt && !reported ? (
          <ThemedText type="small" themeColor="textSecondary">
            Reminder sent {timeAgo(assignment.nudgedAt)}
          </ThemedText>
        ) : null}
        <Button
          small
          variant="ghost"
          label="Edit"
          onPress={() => router.push({ pathname: '/assign', params: { id: assignment.id, date: assignment.date } })}
        />
      </Row>
    </Card>
  );
}

export function AlertCard({ alert, onChanged }: { alert: Alert; onChanged: () => void }) {
  const family = useFamily();
  const { busy, run } = useAction();
  const meta = ALERT_META[alert.kind];
  const caregiver = family.caregiver(alert.caregiverId);
  return (
    <Card tone={meta.tone === 'default' ? 'default' : meta.tone}>
      <Row>
        <Badge label={meta.label} tone={meta.tone} />
        <ThemedText type="small" themeColor="textSecondary">
          {timeAgo(alert.createdAt)}
        </ThemedText>
      </Row>
      <ThemedText type="small">{alert.text}</ThemedText>
      {alert.kind === 'development-worry' ? (
        <ThemedText type="small" themeColor="textSecondary">
          TARA never diagnoses. If this worries you too, talk with your pediatrician.
        </ThemedText>
      ) : null}
      <Row>
        {caregiver ? (
          <Button
            small
            label={`Reply to ${caregiver.name}`}
            onPress={() => router.push({ pathname: '/caregiver/[id]', params: { id: caregiver.id } })}
          />
        ) : null}
        {alert.kind === 'goal-idea' ? (
          <Button small variant="secondary" label="Add a goal" onPress={() => router.push('/goal')} />
        ) : null}
        <Button
          small
          variant="secondary"
          label="Mark handled"
          disabled={busy === 'resolve'}
          onPress={() =>
            run('resolve', () => api.patch(`/api/alerts/${alert.id}`, { resolved: true })).then(onChanged)
          }
        />
      </Row>
    </Card>
  );
}
