import { Suspense } from 'react';

import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { redirect } from 'next/navigation';

import { desc, eq } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import { JobListingTable } from '@/drizzle/schema';
import { getJobListingOrganizationTag } from '@/features/jobListings/db/cache/jobListings';
import { getCurrentOrganization } from '@/services/clerk/lib/getCurrentAuth';

export default function EmployerHomePage() {
  return (
    <Suspense>
      <SuspendedPage />
    </Suspense>
  );
}

async function SuspendedPage() {
  const { orgId } = await getCurrentOrganization();

  if (!orgId) return null;

  const jobListing = await getMostRecentJobListing(orgId);

  if (!jobListing) {
    redirect('/employer/job-listings/new');
  } else {
    redirect(`/employer/job-listings/${jobListing.id}`);
  }
}

async function getMostRecentJobListing(orgId: string) {
  'use cache';

  cacheTag(getJobListingOrganizationTag(orgId));

  return db.query.JobListingTable.findFirst({
    where: eq(JobListingTable.organizationId, orgId),
    orderBy: desc(JobListingTable.createdAt),
    columns: { id: true },
  });
}
