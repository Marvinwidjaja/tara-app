import { useState } from 'react';
import { View } from 'react-native';

import { anchorLabel, STATUS } from '@/components/cocare';
import { Badge, Card, ChoiceRow, DateStrip, ErrorText, Field, Row, Screen, Section, ToggleRow } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAction } from '@/hooks/use-action';
import { useQuery } from '@/hooks/use-query';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { addDays, prettyDate, shortDate, startOfWeek, weekDates, weekdayShort } from '@/lib/dates';
import type { DailyReport, WeeklyReport } from '@/shared/types';
import { useFamily } from '@/state/session';

const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function ReportsScreen() {
  const family = useFamily();
  const { today, parent } = family;
  const [selected, setSelected] = useState(today);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const { busy, run } = useAction();

  const daily = useQuery<DailyReport>(`/api/reports/daily?date=${selected}`, { pollMs: 15_000 });
  const weekly = useQuery<WeeklyReport>(`/api/reports/weekly?end=${selected}`);
  const report = daily.data;

  const saveLog = (patch: Record<string, unknown>) =>
    run('log', () => api.patch(`/api/day-logs/${selected}`, patch)).then(() => daily.reload());

  return (
    <Screen
      title="Reports"
      subtitle={`How ${parent?.childName ?? 'your child'}’s days are going, from what caregivers report in TARA.`}>
      <DateStrip
        weekStart={weekStart}
        value={selected}
        today={today}
        onChange={setSelected}
        onWeekChange={(dir) => {
          const next = addDays(weekStart, dir * 7);
          setWeekStart(next);
          setSelected(weekDates(next).includes(today) ? today : next);
        }}
      />
      <ErrorText message={daily.error} />

      <Section title={`Daily summary · ${prettyDate(selected, today)}`}>
        {report ? (
          <>
            <Card tone="accent">
              <ThemedText type="small">{report.summary}</ThemedText>
              <Row>
                <Badge label={`${report.done}/${report.planned} done`} tone="accent" />
                {report.skipped ? <Badge label={`${report.skipped} skipped`} tone="danger" /> : null}
                {report.pending ? <Badge label={`${report.pending} waiting`} tone="warn" /> : null}
              </Row>
            </Card>

            {report.items.map((i) => (
              <Card key={i.id}>
                <Row>
                  <ThemedText type="smallBold" style={{ flex: 1 }}>
                    {i.activityTitle}
                  </ThemedText>
                  <Badge label={STATUS[i.status].label} tone={STATUS[i.status].tone} />
                </Row>
                <ThemedText type="small" themeColor="textSecondary">
                  {i.caregiverName} · {anchorLabel(i.anchor)}
                  {i.goalTitle ? ` · ${i.goalTitle}` : ''}
                  {i.reaction ? ` · ${i.reaction === 'loved' ? '😍 loved it' : i.reaction === 'ok' ? '🙂 OK' : '😕 not today'}` : ''}
                </ThemedText>
                {i.caregiverNote ? <ThemedText type="small">“{i.caregiverNote}”</ThemedText> : null}
              </Card>
            ))}

            <Card>
              <ThemedText type="smallBold">Nap and health</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Caregivers can text NAP or SICK. You can also set it here.
              </ThemedText>
              <ChoiceRow
                options={[
                  { id: 'yes', label: 'Napped' },
                  { id: 'no', label: 'No nap' },
                  { id: 'unknown', label: 'Not sure' },
                ]}
                value={report.dayLog.nap === null ? 'unknown' : report.dayLog.nap ? 'yes' : 'no'}
                onChange={(v) => saveLog({ nap: v === 'unknown' ? null : v === 'yes' })}
              />
              <ToggleRow
                label="Seemed unwell"
                value={report.dayLog.illness}
                onValueChange={(illness) => saveLog({ illness })}
                disabled={busy === 'log'}
              />
              <NotesField key={report.date} initial={report.dayLog.notes} onSave={(notes) => saveLog({ notes })} />
            </Card>
          </>
        ) : daily.loading ? (
          <ThemedText type="small" themeColor="textSecondary">
            Loading…
          </ThemedText>
        ) : null}
      </Section>

      {weekly.data ? <Weekly report={weekly.data} /> : null}
    </Screen>
  );
}

function Weekly({ report }: { report: WeeklyReport }) {
  const theme = useTheme();
  const max = Math.max(1, ...report.days.map((d) => d.planned));
  const delta =
    report.previousCompletionRate === null ? null : Math.round((report.completionRate - report.previousCompletionRate) * 100);

  return (
    <Section title={`Week · ${shortDate(report.start)} – ${shortDate(report.end)}`} hint="Compared with the 7 days before.">
      <Card>
        <Row>
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 28, lineHeight: 34, fontWeight: '700' }}>{pct(report.completionRate)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {report.done} of {report.planned} activities done
            </ThemedText>
          </View>
          {delta !== null ? (
            <Badge
              label={`${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} pts vs previous week`}
              tone={delta >= 0 ? 'accent' : 'warn'}
            />
          ) : (
            <Badge label="No earlier week to compare yet" />
          )}
        </Row>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, height: 110, marginTop: Spacing.two }}>
          {report.days.map((d) => (
            <View key={d.date} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View style={{ width: '70%', height: 80, justifyContent: 'flex-end' }}>
                <View
                  style={{
                    height: `${(d.planned / max) * 100}%`,
                    backgroundColor: theme.backgroundSelected,
                    borderRadius: 4,
                    justifyContent: 'flex-end',
                    overflow: 'hidden',
                  }}>
                  <View
                    style={{
                      height: d.planned ? `${(d.done / d.planned) * 100}%` : 0,
                      backgroundColor: theme.accent,
                    }}
                  />
                </View>
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                {weekdayShort(d.date)}
              </ThemedText>
            </View>
          ))}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Grey = planned, green = done.
        </ThemedText>
      </Card>

      {report.byGoal.length ? (
        <Card>
          <ThemedText type="smallBold">By goal</ThemedText>
          {report.byGoal.map((g) => (
            <Row key={g.goalId ?? 'none'}>
              <ThemedText type="small" style={{ flex: 1 }}>
                {g.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {g.done}/{g.planned} done
              </ThemedText>
            </Row>
          ))}
        </Card>
      ) : null}

      {report.byCaregiver.length ? (
        <Card>
          <ThemedText type="smallBold">Replies from caregivers</ThemedText>
          {report.byCaregiver.map((c) => (
            <Row key={c.caregiverId}>
              <ThemedText type="small" style={{ flex: 1 }}>
                {c.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                reported {c.reported} of {c.planned}
              </ThemedText>
            </Row>
          ))}
        </Card>
      ) : null}

      {report.loved.length ? (
        <Card tone="accent">
          <ThemedText type="smallBold">Favourites this week</ThemedText>
          <ThemedText type="small">{report.loved.join(', ')}</ThemedText>
        </Card>
      ) : null}
    </Section>
  );
}

function NotesField({ initial, onSave }: { initial: string; onSave: (notes: string) => void }) {
  const [notes, setNotes] = useState(initial);
  return (
    <Field
      label="Notes"
      value={notes}
      onChangeText={setNotes}
      onBlur={() => notes !== initial && onSave(notes)}
      multiline
      placeholder="Anything else about the day"
    />
  );
}
