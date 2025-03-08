import { auth } from '@/libs/auth';
import { LogoutButton } from './_components/logout-button';
import { SectionProfile } from './_components/section-profile';
import { SectionLoginNotification } from './_components/section-loginNotification';

export default async function Page() {
  const session = await auth();
  //check if user is logged in
  if (!session) {
    return (
      <div className="flex items-center justify-center">
        <div className="flex items-center justify-center w-[300px] h-screen">
          <SectionLoginNotification />
        </div>
      </div>
    );
  }
  //if user logged in return this
  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col w-[300px] space-y-5">
        <section className="flex justify-between items-center">
          <div className="text-xl font-bold tracking-tight">Splitbill</div>
          <LogoutButton />
        </section>
        <SectionProfile />
      </div>
    </div>
  );
}
