import { revalidateTag } from 'next/cache';

import { getGlobalTag, getIdTag } from '@/lib/dataCache';

export function getOrganizationGlobalTag() {
  return getGlobalTag('organizations');
}

export function getOrganizationIdTag(id: string) {
  return getIdTag('organizations', id);
}

export function revalidateOrganizationCache(id: string) {
  revalidateTag(getOrganizationGlobalTag());
  revalidateTag(getOrganizationIdTag(id));
}
