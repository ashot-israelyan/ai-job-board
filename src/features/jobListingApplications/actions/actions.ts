'use server';

import { cacheTag } from 'next/dist/server/use-cache/cache-tag';

import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/drizzle/db';
import { JobListingTable, UserResumeTable } from '@/drizzle/schema';
import { getJobListingIdTag } from '@/features/jobListings/db/cache/jobListings';
import { getUserResumeIdTag } from '@/features/users/db/cache/userResumes';
import { getCurrentUser } from '@/services/clerk/lib/getCurrentAuth';
import { inngest } from '@/services/inngest/client';

import { insertJobListingApplication } from '../db/jobListingsApplication';
import { newJobListingApplicationSchema } from './schemas';

export async function createJobListingApplication(
  jobListingId: string,
  unsafeData: z.infer<typeof newJobListingApplicationSchema>
) {
  const permissionError = {
    error: true,
    message: "You don't have permission to submit an application",
  };
  const { userId } = await getCurrentUser();

  if (!userId) return permissionError;

  const [userResume, jobListing] = await Promise.all([
    getUserResume(userId),
    getPublicJobListing(jobListingId),
  ]);

  if (!userResume || !jobListing) return permissionError;

  const { success, data } = newJobListingApplicationSchema.safeParse(unsafeData);

  if (!success) {
    return {
      error: true,
      message: 'There was an error submitting your application',
    };
  }

  await insertJobListingApplication({
    jobListingId,
    userId,
    ...data,
  });

  await inngest.send({
    name: 'app/jobListingApplication.created',
    data: { jobListingId, userId },
  });

  return {
    error: false,
    message: 'Your application was successfully submitted',
  };
}

async function getPublicJobListing(id: string) {
  'use cache';
  cacheTag(getJobListingIdTag(id));

  return db.query.JobListingTable.findFirst({
    where: and(eq(JobListingTable.id, id), eq(JobListingTable.status, 'published')),
    columns: { id: true },
  });
}

async function getUserResume(userId: string) {
  'use cache';
  cacheTag(getUserResumeIdTag(userId));

  return db.query.UserResumeTable.findFirst({
    where: eq(UserResumeTable.userId, userId),
    columns: { userId: true },
  });
}
