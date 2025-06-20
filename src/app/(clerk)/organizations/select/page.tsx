import { Suspense } from 'react';

import { OrganizationList } from '@clerk/nextjs';

type Props = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function OrganizationsSelectPage(props: Props) {
  return (
    <Suspense>
      <SuspendedPage {...props} />
    </Suspense>
  );
}

async function SuspendedPage({ searchParams }: Props) {
  const { redirect } = await searchParams;

  const redirectUrl = redirect ?? '/employer';

  return (
    <OrganizationList
      hidePersonal
      hideSlug
      skipInvitationScreen
      afterSelectOrganizationUrl={redirectUrl}
      afterCreateOrganizationUrl={redirectUrl}
    />
  );
}
