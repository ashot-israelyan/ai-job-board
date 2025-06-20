import { Suspense } from 'react';

import { LogOutIcon } from 'lucide-react';

import { SidebarMenuButton } from '@/components/ui/sidebar';
import { SignOutButton } from '@/services/clerk/components/AuthButtons';
import { getCurrentOrganization, getCurrentUser } from '@/services/clerk/lib/getCurrentAuth';

import { SidebarOrganizationButtonClient } from './_SidebarOrganizationButtonClient';

export function SidebarOrganizationButton() {
  return (
    <Suspense>
      <SidebarOrganizationButtonSuspense />
    </Suspense>
  );
}

async function SidebarOrganizationButtonSuspense() {
  const [{ user }, { organization }] = await Promise.all([
    getCurrentUser({ allData: true }),
    getCurrentOrganization({ allData: true }),
  ]);

  if (!user || !organization) {
    return (
      <SignOutButton>
        <SidebarMenuButton>
          <LogOutIcon />
          <span>Log Out</span>
        </SidebarMenuButton>
      </SignOutButton>
    );
  }

  return <SidebarOrganizationButtonClient user={user} organization={organization} />;
}
