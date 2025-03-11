import { auth } from '@/libs/auth';
import { LogoutButton } from '../dashboard/_components/logout-button';
import { Button } from '@heroui/react';
import { HomeButton } from './_components/home-button';
import { SectionDashboard } from './_components/section-dashboard';
import React from '@heroicons/react';
import { Suspense } from 'react';
import { SectionDashboardSkeleton } from './_components/section-dashboard-skeleton';

export default async function Page() {
  const session = await auth();

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col w-[300px] space-y-8">
        <section className="flex justify-between items-center h-[50px]">
          <div className="text-2xl font-bold tracking-tight">Splitbill</div>
          <div className="flex gap-4">
            <HomeButton />
            {session ? <LogoutButton /> : null}
          </div>
        </section>
        <Suspense fallback={<SectionDashboardSkeleton />}>
          <SectionDashboard />
        </Suspense>
      </div>
    </div>
  );
}
