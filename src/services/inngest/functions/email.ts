import { subDays } from 'date-fns';
import { and, eq, gte } from 'drizzle-orm';
import { GetEvents } from 'inngest';

import { env } from '@/data/env/server';
import { db } from '@/drizzle/db';
import { JobListingTable, UserNotificationSettingsTable } from '@/drizzle/schema';
import { resend } from '@/services/resend/client';
import DailyJobListingEmail from '@/services/resend/components/DailyJobListingEmail';

import { getMatchingJobListings } from '../ai/getMatchingJobListings';
import { inngest } from '../client';

export const prepareDailyUserJobListingNotifications = inngest.createFunction(
  {
    id: 'prepare-daily-user-job-listing-notifications',
    name: 'Prepare Daily User Job Listing Notifications',
  },
  {
    cron: 'TZ=Asia/Yerevan 0 7 * * *',
  },
  async ({ step, event }) => {
    const getUsers = step.run('get-users', async () => {
      return await db.query.UserNotificationSettingsTable.findMany({
        where: eq(UserNotificationSettingsTable.newJobEmailNotifications, true),
        columns: {
          userId: true,
          newJobEmailNotifications: true,
          aiPrompt: true,
        },
        with: {
          user: {
            columns: {
              email: true,
              name: true,
            },
          },
        },
      });
    });

    const getJobListings = step.run('get-recent-job-listings', async () => {
      return await db.query.JobListingTable.findMany({
        where: and(
          gte(JobListingTable.postedAt, subDays(new Date(event.ts ?? Date.now()), 1)),
          eq(JobListingTable.status, 'published')
        ),
        columns: {
          createdAt: false,
          postedAt: false,
          updatedAt: false,
          status: false,
          organizationId: false,
        },
        with: {
          organization: {
            columns: {
              name: true,
            },
          },
        },
      });
    });

    const [userNotifications, jobListings] = await Promise.all([getUsers, getJobListings]);

    if (!jobListings.length || !userNotifications.length) return;

    const events = userNotifications.map((notification) => {
      return {
        name: 'app/email.daily-user-job-listings',
        user: {
          email: notification.user.email,
          name: notification.user.name,
        },
        data: {
          aiPrompt: notification.aiPrompt ?? undefined,
          jobListings: jobListings.map((listing) => {
            return {
              ...listing,
              organizationName: listing.organization.name,
            };
          }),
        },
      } as const satisfies GetEvents<typeof inngest>['app/email.daily-user-job-listings'];
    });

    await step.sendEvent('send-emails', events);
  }
);

export const sendDailyUserJobListingEmail = inngest.createFunction(
  {
    id: 'send-daily-user-job-listing-email',
    name: 'Send Daily User Job Listing Email',
    throttle: {
      limit: 10,
      period: '1m',
    },
  },
  {
    event: 'app/email.daily-user-job-listings',
  },
  async ({ event, step }) => {
    const { jobListings, aiPrompt } = event.data;
    const user = event.user;

    if (jobListings.length === 0) return null;

    let matchingJobListings: typeof jobListings = [];
    if (aiPrompt == null || aiPrompt.trim() === '') {
      matchingJobListings = jobListings;
    } else {
      const matchingIds = await getMatchingJobListings(aiPrompt, jobListings);
      matchingJobListings = jobListings.filter((listing) => matchingIds.includes(listing.id));
    }

    if (!matchingJobListings.length) {
      return;
    }

    await step.run('send-email', async () => {
      await resend.emails.send({
        from: 'Job Board <onboarding@resend.dev>',
        to: user.email,
        subject: 'Daily Job Listings',
        react: DailyJobListingEmail({
          jobListings: matchingJobListings,
          userName: user.name,
          serverUrl: env.SERVER_URL,
        }),
      });
    });
  }
);
