/** Sharing a caregiver invite: the code, a join link, and the share sheet / clipboard. */
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Platform, Share } from 'react-native';

import { notify } from '@/lib/notify';

/** "ABCD2345" → "ABCD-2345" (easier to read out). */
export const formatInviteCode = (code: string) => (code.length > 4 ? `${code.slice(0, 4)}-${code.slice(4)}` : code);

/** Opens the join screen with the code filled in (the web address on web, the app's link on a phone). */
export const joinLink = (code: string) => Linking.createURL('/join', { queryParams: { code } });

export function inviteMessage(i: { caregiverName: string; parentName: string; childName: string; code: string }) {
  return [
    `Hi ${i.caregiverName}! It’s ${i.parentName}. I’m using TARA to share simple activity ideas for ${i.childName}. It’s not to check on you, just to make our days easier.`,
    '',
    `Join here: ${joinLink(i.code)}`,
    `Or open TARA, choose “I’m a caregiver → Join with an invite code” and enter ${formatInviteCode(i.code)}.`,
  ].join('\n');
}

export async function copyText(text: string, what: string) {
  try {
    await Clipboard.setStringAsync(text);
    notify(`${what} copied`);
  } catch {
    notify('Couldn’t copy', text);
  }
}

/** The system share sheet on phones (and browsers that have one); otherwise copies the invite. */
export async function shareText(message: string) {
  if (Platform.OS === 'web') {
    const nav = globalThis.navigator as Navigator | undefined;
    if (nav?.share) {
      try {
        await nav.share({ text: message });
      } catch {
        // Closing the share sheet throws; nothing to do.
      }
      return;
    }
    return copyText(message, 'Invite');
  }
  try {
    await Share.share({ message });
  } catch {
    await copyText(message, 'Invite');
  }
}
