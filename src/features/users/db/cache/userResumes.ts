import { revalidateTag } from 'next/cache';

import { getGlobalTag, getIdTag } from '@/lib/dataCache';

export function getUserResumeGlobalTag() {
  return getGlobalTag('userResumes');
}

export function getUserResumeIdTag(userId: string) {
  return getIdTag('userResumes', userId);
}

export function revalidateUserResumeCache(userId: string) {
  revalidateTag(getUserResumeGlobalTag());
  revalidateTag(getUserResumeIdTag(userId));
}
