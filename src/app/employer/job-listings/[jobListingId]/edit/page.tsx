import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { Card, CardContent } from '@/components/ui/card';
import { getJobListing } from '@/features/jobListings/actions/actions';
import { JobListingForm } from '@/features/jobListings/components/JobListingForm';
import { getCurrentOrganization } from '@/services/clerk/lib/getCurrentAuth';

type Props = {
  params: Promise<{ jobListingId: string }>;
};

export default function EditJobListingPage(props: Props) {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Edit Job Listing</h1>

      <Card>
        <CardContent>
          <Suspense>
            <SuspendedPage {...props} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function SuspendedPage({ params }: Props) {
  const { jobListingId } = await params;
  const { orgId } = await getCurrentOrganization();

  if (!orgId) {
    return notFound();
  }

  const jobListing = await getJobListing(jobListingId, orgId);

  if (!jobListing) return notFound();

  return <JobListingForm jobListing={jobListing} />;
}
