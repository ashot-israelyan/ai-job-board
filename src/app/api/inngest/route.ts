import { serve } from 'inngest/next';

import { inngest } from '@/services/inngest/client';
import {
  clerkCreateOrganization,
  clerkCreateOrgMembership,
  clerkCreateUser,
  clerkDeleteOrganization,
  clerkDeleteOrgMembership,
  clerkDeleteUser,
  clerkUpdateOrganization,
  clerkUpdateUser,
} from '@/services/inngest/functions/clerk';
import {
  prepareDailyUserJobListingNotifications,
  sendDailyUserJobListingEmail,
} from '@/services/inngest/functions/email';
import { rankApplication } from '@/services/inngest/functions/jobListingApplication';
import { createAiSummaryOfUploadedResume } from '@/services/inngest/functions/resume';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    clerkCreateUser,
    clerkUpdateUser,
    clerkDeleteUser,
    clerkCreateOrganization,
    clerkUpdateOrganization,
    clerkDeleteOrganization,
    clerkCreateOrgMembership,
    clerkDeleteOrgMembership,
    createAiSummaryOfUploadedResume,
    rankApplication,
    prepareDailyUserJobListingNotifications,
    sendDailyUserJobListingEmail,
  ],
});
