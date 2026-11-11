/** A caregiver's day: the activities the parent assigned them, in their language, to mark as they go. */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Card, Chip, DateStrip, Empty, ErrorText, Field, Row, Screen, Section } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAction } from '@/hooks/use-action';
import { useQuery } from '@/hooks/use-query';
import { api } from '@/lib/api';
import { ct, type CaregiverTextKey } from '@/lib/caregiver-text';
import { addDays, startOfWeek, weekDates } from '@/lib/dates';
import { anchorById } from '@/shared/library';
import { dayLabel, fill, T } from '@/shared/messages';
import type { AssignmentStatus, CaregiverDay, CaregiverDayItem, Language, Reaction } from '@/shared/types';
import { useCaregiver } from '@/state/session';

type Tone = 'default' | 'accent' | 'warn' | 'danger';

const STATUS: Record<AssignmentStatus, { key: CaregiverTextKey; tone: Tone }> = {
  planned: { key: 'statusTodo', tone: 'default' },
  sent: { key: 'statusTodo', tone: 'default' },
  done: { key: 'statusDone', tone: 'accent' },
  changed: { key: 'statusChanged', tone: 'accent' },
  skipped: { key: 'statusSkipped', tone: 'danger' },
  voice: { key: 'statusVoice', tone: 'warn' },
};

const REACTIONS: { id: Reaction; key: CaregiverTextKey }[] = [
  { id: 'loved', key: 'loved' },
  { id: 'ok', key: 'ok' },
  { id: 'not-today', key: 'notToday' },
];

export default function CaregiverTodayScreen() {
  const { me, lang, today } = useCaregiver();
  const [selected, setSelected] = useState(today);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const { busy, run } = useAction();

  const day = useQuery<CaregiverDay>(`/api/caregiver/day?date=${selected}`, { pollMs: 15_000 });
  const d = day.data;
  const family = me?.family;
  const vars = { parent: family?.parentName ?? '', child: family?.childName ?? '' };

  const setLog = (patch: { nap?: boolean | null; illness?: boolean }) =>
    run('log', () => api.patch('/api/caregiver/day-log', patch)).then(() => day.reload());

  return (
    <Screen
      step={family ? `${family.childName.toUpperCase()} · ${ct(lang, 'months', { n: family.childAgeMonths })}` : 'TARA'}
      title={ct(lang, 'hi', { name: me?.caregiver.name ?? '' })}
      subtitle={ct(lang, 'todaySubtitle', vars)}>
      <DateStrip
        weekStart={weekStart}
        value={selected}
        today={today}
        marked={d?.marked ?? []}
        onChange={setSelected}
        onWeekChange={(dir) => {
          const next = addDays(weekStart, dir * 7);
          setWeekStart(next);
          setSelected(weekDates(next).includes(today) ? today : next);
        }}
      />
      <ErrorText message={day.error} />

      {d?.goals?.length ? (
        <Card tone="accent">
          <ThemedText type="small">{fill(T.focus[lang], { goals: d.goals.join(', ') })}</ThemedText>
        </Card>
      ) : null}

      {d?.handoff ? <Handoff lang={lang} handoff={d.handoff} /> : null}

      <Section title={dayLabel(selected, today)[lang]}>
        {day.loading && !d ? (
          <ThemedText type="small" themeColor="textSecondary">
            …
          </ThemedText>
        ) : d && d.items.length === 0 ? (
          <Empty title={ct(lang, 'nothingPlanned', vars)} />
        ) : (
          <View style={{ gap: Spacing.two }}>
            {d?.items.map((item) => (
              <ActivityCard
                key={item.assignment.id}
                item={item}
                lang={lang}
                parentName={vars.parent}
                childName={vars.child}
                future={selected > today}
                onChanged={() => void day.reload()}
              />
            ))}
          </View>
        )}
      </Section>

      {selected === today && d ? (
        <Section title={ct(lang, 'aboutToday')}>
          <Row>
            <Chip
              label={ct(lang, 'napped')}
              selected={d.dayLog.nap === true}
              disabled={!!busy}
              onPress={() => setLog({ nap: d.dayLog.nap === true ? null : true })}
            />
            <Chip
              label={ct(lang, 'unwell')}
              selected={d.dayLog.illness}
              disabled={!!busy}
              onPress={() => setLog({ illness: !d.dayLog.illness })}
            />
          </Row>
          <ThemedText type="small" themeColor="textSecondary">
            {ct(lang, 'unwellHint', vars)}
          </ThemedText>
        </Section>
      ) : null}

      <Button variant="secondary" label={ct(lang, 'messageParent', vars)} onPress={() => router.push('/chat')} />
    </Screen>
  );
}

function Handoff({ lang, handoff }: { lang: Language; handoff: NonNullable<CaregiverDay['handoff']> }) {
  const lines: string[] = [];
  if (handoff.done.length) lines.push(fill(T.handoffDone[lang], { list: handoff.done.join(', ') }));
  if (handoff.skipped.length) lines.push(fill(T.handoffSkipped[lang], { list: handoff.skipped.join(', ') }));
  if (handoff.nap !== null) lines.push(handoff.nap ? T.napped[lang] : T.noNap[lang]);
  if (handoff.illness) lines.push(T.unwell[lang]);
  if (!lines.length) return null;
  return (
    <Card>
      <ThemedText type="smallBold">{T.handoff[lang]}</ThemedText>
      {lines.map((l) => (
        <ThemedText key={l} type="small" themeColor="textSecondary">
          • {l}
        </ThemedText>
      ))}
    </Card>
  );
}

function ActivityCard({
  item,
  lang,
  parentName,
  childName,
  future,
  onChanged,
}: {
  item: CaregiverDayItem;
  lang: Language;
  parentName: string;
  childName: string;
  future: boolean;
  onChanged: () => void;
}) {
  const { busy, run } = useAction();
  const a = item.assignment;
  const [note, setNote] = useState(a.caregiverNote ?? '');
  const status = STATUS[a.status];
  const reported = ['done', 'skipped', 'changed'].includes(a.status);

  const report = (patch: { status?: string; reaction?: Reaction | null; note?: string }, key: string) =>
    run(key, () => api.patch(`/api/caregiver/assignments/${a.id}`, patch)).then(onChanged);

  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText type="smallBold">{item.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {anchorById(a.anchor).label[lang]} · {ct(lang, 'minutes', { n: item.minutes })}
          </ThemedText>
        </View>
        <Badge label={ct(lang, status.key)} tone={status.tone} />
      </View>

      {item.steps.map((step, i) => (
        <ThemedText key={i} type="small">
          {i + 1}. {step}
        </ThemedText>
      ))}
      {item.safety ? (
        <ThemedText type="small" themeColor="warn">
          ⚠ {T.safety[lang]}: {item.safety}
        </ThemedText>
      ) : null}
      {a.note ? (
        <ThemedText type="small" themeColor="textSecondary">
          ✎ {fill(T.noteFromParent[lang], { parent: parentName })}: {a.note}
        </ThemedText>
      ) : null}

      {future ? (
        <ThemedText type="small" themeColor="textSecondary">
          {ct(lang, 'comingUp')}
        </ThemedText>
      ) : (
        <>
          <Row>
            {reported ? (
              <Button small variant="ghost" label={ct(lang, 'undo')} disabled={!!busy} onPress={() => report({ status: 'planned' }, 'undo')} />
            ) : (
              <>
                <Button small label={ct(lang, 'markDone')} disabled={!!busy} onPress={() => report({ status: 'done' }, 'done')} />
                <Button
                  small
                  variant="secondary"
                  label={ct(lang, 'markChanged')}
                  disabled={!!busy}
                  onPress={() => report({ status: 'changed' }, 'changed')}
                />
                <Button
                  small
                  variant="secondary"
                  label={ct(lang, 'markSkipped')}
                  disabled={!!busy}
                  onPress={() => report({ status: 'skipped' }, 'skipped')}
                />
              </>
            )}
          </Row>

          {reported ? (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                {ct(lang, 'howDidTheyLikeIt', { child: childName })}
              </ThemedText>
              <Row>
                {REACTIONS.map((r) => (
                  <Chip
                    key={r.id}
                    label={ct(lang, r.key)}
                    selected={a.reaction === r.id}
                    disabled={!!busy}
                    onPress={() => report({ reaction: a.reaction === r.id ? null : r.id }, r.id)}
                  />
                ))}
              </Row>
              <Field
                label={ct(lang, 'noteFor', { parent: parentName })}
                value={note}
                onChangeText={setNote}
                placeholder={ct(lang, 'notePlaceholder')}
                multiline
              />
              {note !== (a.caregiverNote ?? '') ? (
                <Row>
                  <Button small label={ct(lang, 'saveNote')} disabled={!!busy} onPress={() => report({ note }, 'note')} />
                </Row>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </Card>
  );
}
