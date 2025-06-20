import { cacheTag } from 'next/dist/server/use-cache/cache-tag';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import { UserTable } from '@/drizzle/schema';
import { OrganizationTable } from '@/drizzle/schema/organization';
import { getOrganizationIdTag } from '@/features/organizations/db/cache/organizations';
import { getUserIdTag } from '@/features/users/db/cache/users';

export async function getCurrentUser({ allData = false } = {}) {
  const { userId } = await auth();

  return {
    userId,
    user: allData && userId !== null ? await getUser(userId) : undefined,
  };
}

export async function getCurrentOrganization({ allData = false } = {}) {
  const { orgId } = await auth();

  return {
    orgId,
    organization: allData && orgId != null ? await getOrganization(orgId) : undefined,
  };
}

async function getUser(id: string) {
  'use cache';
  cacheTag(getUserIdTag(id));

  return db.query.UserTable.findFirst({
    where: eq(UserTable.id, id),
  });
}

async function getOrganization(id: string) {
  'use cache';
  cacheTag(getOrganizationIdTag(id));

  return db.query.OrganizationTable.findFirst({
    where: eq(OrganizationTable.id, id),
  });
}
