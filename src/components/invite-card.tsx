/** The parent's view of a caregiver's invite: make a code, then copy it or share a join link. */
import { View } from 'react-native';

import { Button, Card, Row } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAction } from '@/hooks/use-action';
import { api } from '@/lib/api';
import { shortDate } from '@/lib/dates';
import { copyText, formatInviteCode, inviteMessage, joinLink, shareText } from '@/lib/invite';
import type { Caregiver } from '@/shared/types';
import { useFamily } from '@/state/session';

export function InviteCard({ caregiver }: { caregiver: Caregiver }) {
  const family = useFamily();
  const { busy, run } = useAction();
  const code = caregiver.inviteCode;
  const joined = caregiver.status === 'joined';

  const makeCode = () => run('code', () => api.post(`/api/caregivers/${caregiver.id}/invite`)).then(family.reload);

  if (caregiver.status === 'stopped') return null;

  if (!code) {
    return (
      <Card tone={joined ? 'default' : 'accent'}>
        <ThemedText type="small" themeColor="textSecondary">
          {joined
            ? `${caregiver.name} signs in as ${caregiver.email}. If they forget their password, make a new code and they can set a new login with it.`
            : caregiver.status === 'invited'
              ? `${caregiver.name}’s invite code expired. Make a new one to share.`
              : `${caregiver.name} gets their own TARA login. Make an invite code, then send it to them however you like.`}
        </ThemedText>
        <Row>
          <Button
            small
            variant={joined ? 'secondary' : 'primary'}
            label={busy === 'code' ? 'Making a code…' : joined ? 'New login code' : 'Make invite code'}
            disabled={!!busy}
            onPress={makeCode}
          />
        </Row>
      </Card>
    );
  }

  const message = inviteMessage({
    caregiverName: caregiver.name,
    parentName: family.parent?.name ?? 'the parent',
    childName: family.parent?.childName ?? 'your child',
    code,
  });

  return (
    <Card tone="accent">
      <ThemedText type="small" themeColor="textSecondary">
        {joined ? `New login code for ${caregiver.name}` : `Invite code for ${caregiver.name}`}
      </ThemedText>
      <View style={{ gap: Spacing.one }}>
        <ThemedText type="subtitle" selectable style={{ letterSpacing: 3 }}>
          {formatInviteCode(code)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Works once{caregiver.inviteExpiresAt ? `, until ${shortDate(caregiver.inviteExpiresAt.slice(0, 10))}` : ''}. Tip: text them
          yourself first so the invite doesn’t come out of nowhere.
        </ThemedText>
      </View>
      <Row>
        <Button small label="Share invite" onPress={() => shareText(message)} />
        <Button small variant="secondary" label="Copy code" onPress={() => copyText(formatInviteCode(code), 'Code')} />
        <Button small variant="secondary" label="Copy link" onPress={() => copyText(joinLink(code), 'Link')} />
        <Button small variant="ghost" label={busy === 'code' ? '…' : 'New code'} disabled={!!busy} onPress={makeCode} />
      </Row>
    </Card>
  );
}
