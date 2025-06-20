'use server';

import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { redirect } from 'next/navigation';

import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/drizzle/db';
import { JobListingTable } from '@/drizzle/schema';
import { getCurrentOrganization, getCurrentUser } from '@/services/clerk/lib/getCurrentAuth';
import { hasOrgUserPermission } from '@/services/clerk/lib/orgUserPermissions';
import { getMatchingJobListings } from '@/services/inngest/ai/getMatchingJobListings';

import { getJobListingGlobalTag, getJobListingIdTag } from '../db/cache/jobListings';
import {
  deleteJobListing as deleteJobListingDb,
  insertJobListing,
  updateJobListing as updateJobListingDb,
} from '../db/jobListings';
import {
  hasReachedMaxFeaturedJobListings,
  hasReachedMaxPublishedJobListings,
} from '../lib/planFeatureHelpers';
import { getNextJobListingStatus } from '../lib/utils';
import { jobListingAiSearchSchema, jobListingSchema } from './schemas';

export async function createJobListing(unsafeData: z.infer<typeof jobListingSchema>) {
  const { orgId } = await getCurrentOrganization();

  if (!orgId || !(await hasOrgUserPermission('org:job_listings:create'))) {
    return {
      error: true,
      message: "You don't have permission to create a job listing",
    };
  }

  const { success, data } = jobListingSchema.safeParse(unsafeData);

  if (!success) {
    return {
      error: true,
      message: 'There was an error creating your job listing',
    };
  }

  const jobListing = await insertJobListing({
    ...data,
    organizationId: orgId,
    status: 'draft',
  });

  redirect(`/employer/job-listings/${jobListing.id}`);
}

export async function updateJobListing(
  jobListingId: string,
  unsafeData: z.infer<typeof jobListingSchema>
) {
  const { orgId } = await getCurrentOrganization();

  if (!orgId || !(await hasOrgUserPermission('org:job_listings:update'))) {
    return {
      error: true,
      message: "You don't have permission to update a job listing",
    };
  }

  const { success, data } = jobListingSchema.safeParse(unsafeData);

  if (!success) {
    return {
      error: true,
      message: 'There was an error updating your job listing',
    };
  }

  const jobListing = await getJobListing(jobListingId, orgId);

  if (!jobListing) {
    return {
      error: true,
      message: 'There was an error updating your job listing',
    };
  }

  const updatedJobListing = await updateJobListingDb(jobListingId, data);

  redirect(`/employer/job-listings/${updatedJobListing.id}`);
}

export async function toggleJobListingStatus(id: string) {
  const error = {
    error: true,
    message: "You don't have permission to update this job listing's status",
  };

  const { orgId } = await getCurrentOrganization();

  if (!orgId) return error;

  const jobListing = await getJobListing(id, orgId);
  if (!jobListing) return error;

  const newStatus = getNextJobListingStatus(jobListing.status);

  if (
    !(await hasOrgUserPermission('org:job_listings:change_status')) ||
    (newStatus === 'published' && (await hasReachedMaxPublishedJobListings()))
  ) {
    return error;
  }

  await updateJobListingDb(id, {
    status: newStatus,
    isFeatured: newStatus === 'published' ? undefined : false,
    postedAt: newStatus === 'published' && !jobListing.postedAt ? new Date() : undefined,
  });

  return { error: false };
}

export async function toggleJobListingFeatured(id: string) {
  const error = {
    error: true,
    message: "You don't have permission to update this job listing's featured status",
  };
  const { orgId } = await getCurrentOrganization();
  if (!orgId) return error;

  const jobListing = await getJobListing(id, orgId);
  if (!jobListing) return error;

  const newFeaturedStatus = !jobListing.isFeatured;
  if (
    !(await hasOrgUserPermission('org:job_listings:change_status')) ||
    (newFeaturedStatus && (await hasReachedMaxFeaturedJobListings()))
  ) {
    return error;
  }

  await updateJobListingDb(id, {
    isFeatured: newFeaturedStatus,
  });

  return { error: false };
}

export async function deleteJobListing(id: string) {
  const error = {
    error: true,
    message: "You don't have permission to delete the job listing's featured status",
  };

  const { orgId } = await getCurrentOrganization();

  if (!orgId) return error;

  const jobListing = await getJobListing(id, orgId);
  if (!jobListing) return error;

  if (!(await hasOrgUserPermission('org:job_listings:delete'))) {
    return error;
  }

  await deleteJobListingDb(id);

  redirect('/employer');
}

export async function getAiJobListingSearchResults(
  unsafe: z.infer<typeof jobListingAiSearchSchema>
): Promise<{ error: true; message: string } | { error: false; jobIds: string[] }> {
  const { success, data } = jobListingAiSearchSchema.safeParse(unsafe);

  if (!success) {
    return {
      error: true,
      message: 'There was an error processing your search query',
    };
  }

  const { userId } = await getCurrentUser();

  if (!userId) {
    return {
      error: true,
      message: 'You need an account to use AI job search',
    };
  }

  const allListings = await getPublicJobListings();
  const matchedListings = await getMatchingJobListings(data.query, allListings, {
    maxNumberOfJobs: 10,
  });

  if (matchedListings.length === 0) {
    return {
      error: true,
      message: 'No jobs match your search criteria',
    };
  }

  return { error: false, jobIds: matchedListings };
}

export async function getJobListing(id: string, orgId: string) {
  'use cache';
  cacheTag(getJobListingIdTag(id));

  return db.query.JobListingTable.findFirst({
    where: and(eq(JobListingTable.id, id), eq(JobListingTable.organizationId, orgId)),
  });
}

async function getPublicJobListings() {
  'use cache';
  cacheTag(getJobListingGlobalTag());

  return db.query.JobListingTable.findMany({
    where: eq(JobListingTable.status, 'published'),
  });
}
