import { Suspense } from 'react';

import { LogOutIcon } from 'lucide-react';

import { SidebarMenuButton } from '@/components/ui/sidebar';
import { SignOutButton } from '@/services/clerk/components/AuthButtons';
import { getCurrentUser } from '@/services/clerk/lib/getCurrentAuth';

import { SidebarUserButtonClient } from './_SidebarUserButtonClient';

export function SidebarUserButton() {
  return (
    <Suspense>
      <SidebarUserSuspense />
    </Suspense>
  );
}

async function SidebarUserSuspense() {
  const { user } = await getCurrentUser({ allData: true });

  if (!user) {
    return (
      <SignOutButton>
        <SidebarMenuButton>
          <LogOutIcon />
          <span>Log Out</span>
        </SidebarMenuButton>
      </SignOutButton>
    );
  }

  return <SidebarUserButtonClient user={user} />;
}
