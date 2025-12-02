/**
 * Entry point - redirects directly to vault
 */

import { Redirect } from 'expo-router';

export default function Index() {
  // Go directly to vault - lock overlay will show if needed
  return <Redirect href={'/(vault)' as any} />;
}
