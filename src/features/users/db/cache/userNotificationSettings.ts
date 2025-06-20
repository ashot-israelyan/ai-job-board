import { revalidateTag } from 'next/cache';

import { getGlobalTag, getIdTag } from '@/lib/dataCache';

export function getUserNotificationSettingsGlobalTag() {
  return getGlobalTag('userNotificationSettings');
}

export function getUserNotificationSettingsIdTag(userId: string) {
  return getIdTag('userNotificationSettings', userId);
}

export function revalidateUserNotificationSettingsCache(userId: string) {
  revalidateTag(getUserNotificationSettingsGlobalTag());
  revalidateTag(getUserNotificationSettingsIdTag(userId));
}
