import { router, type Href } from 'expo-router';

/**
 * Close an edit screen. Pops it when it was opened on top of another screen; otherwise (opened
 * from a link, or the page was refreshed on web) goes to `fallback` instead of getting stuck.
 *
 * Uses canDismiss (the app's own screen stack) rather than canGoBack, which on web also counts
 * the browser's history and can say "yes" when the stack has nothing to go back to.
 */
export function closeScreen(fallback: Href = '/') {
  if (router.canDismiss()) router.dismiss();
  else router.replace(fallback);
}

/** Leave a whole stack of edit screens (e.g. after deleting the thing they were about). */
export function closeAll(fallback: Href = '/') {
  if (router.canDismiss()) router.dismissAll();
  else router.replace(fallback);
}
