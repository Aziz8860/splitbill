import { auth } from '@/libs/auth';
import { LogoutButton } from './_components/logout-button';
import { SectionHistory } from './_components/section-history';
import { SectionLoginNotification } from './_components/section-loginNotification';
import { SectionUploadButton } from './_components/section-uploadButton';

export default async function Page() {
  const session = await auth();
  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col w-[300px] space-y-8">
        <section className="flex justify-between items-center h-[50px]">
          <div className="text-2xl font-bold tracking-tight">Splitbill</div>
          {/* return wether user is logged in or not */}
          {session ? <LogoutButton /> : null}
        </section>
        <SectionUploadButton />

        {/* return wether user is logged in or not */}
        {session ? <SectionHistory /> : <SectionLoginNotification />}
      </div>
    </div>
  );
}
