/** The caregiver's own page: language, the family, what the parent shares, and sign out. */
import * as Linking from 'expo-linking';

import { Button, Card, ChoiceRow, Row, Screen, Section } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { useAction } from '@/hooks/use-action';
import { api } from '@/lib/api';
import { ct } from '@/lib/caregiver-text';
import { LANGUAGES } from '@/shared/library';
import type { Language } from '@/shared/types';
import { useCaregiver, useSession } from '@/state/session';

export default function CaregiverProfileScreen() {
  const { me, lang, reload } = useCaregiver();
  const { signOut } = useSession();
  const { busy, run } = useAction();
  if (!me) return null;
  const { caregiver, family } = me;
  const vars = { parent: family.parentName, child: family.childName };

  const setLanguage = (language: Language) =>
    run('lang', () => api.patch('/api/caregiver/me', { language })).then(() => reload().catch(() => {}));

  return (
    <Screen title={caregiver.name} subtitle={ct(lang, 'meSubtitle', vars)}>
      <Section title={ct(lang, 'language')} hint={ct(lang, 'languageHint')}>
        <ChoiceRow
          options={LANGUAGES.map((l) => ({ id: l.id, label: l.id === 'en' ? l.label : `${l.native} · ${l.label}` }))}
          value={caregiver.language}
          onChange={(l) => (busy ? undefined : setLanguage(l))}
        />
      </Section>

      {family.parentPhone ? (
        <Section title={ct(lang, 'parentPhone', vars)}>
          <Card>
            <Row>
              <ThemedText type="smallBold" style={{ flex: 1 }} selectable>
                {family.parentPhone}
              </ThemedText>
              <Button small label={ct(lang, 'call')} onPress={() => Linking.openURL(`tel:${family.parentPhone}`)} />
            </Row>
          </Card>
        </Section>
      ) : null}

      <Section title={ct(lang, 'sharedWithYou', vars)}>
        <Card>
          <ThemedText type="small">✓ {ct(lang, 'sharesPlan')}</ThemedText>
          <ThemedText type="small" themeColor={caregiver.seesGoals ? 'text' : 'textSecondary'}>
            {caregiver.seesGoals ? '✓' : '–'} {ct(lang, 'sharesGoals', vars)}
          </ThemedText>
          <ThemedText type="small" themeColor={caregiver.seesDayDetails ? 'text' : 'textSecondary'}>
            {caregiver.seesDayDetails ? '✓' : '–'} {ct(lang, 'sharesDay')}
          </ThemedText>
        </Card>
      </Section>

      {caregiver.email ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          {ct(lang, 'signedInAs', { email: caregiver.email })}
        </ThemedText>
      ) : null}
      <Button variant="danger" label={ct(lang, 'signOut')} onPress={signOut} />
    </Screen>
  );
}
