import { auth } from '@/libs/auth';
import { user } from '@heroui/react';
import moment from 'moment';

export const SectionProfile = async () => {
  const session = await auth();

  return (
    <section className="flex flex-col border border-slate-200 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col items-center space-y-7">
        <div className=" bg-indigo-300 rounded-full w-24 h-24 text-white flex items-center justify-center font-bold">
          {session.user.name.charAt(0)}
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className="text-lg font-bold">{session.user.name}</div>
          <div className="text-sm">{session.user.email}</div>
          <div className="text-xs italic">
            Bergabung: {moment(session.user.createdAt).format('DD MMM YYYY')}
          </div>
        </div>
        <div className="flex gap-8">
          <p className="text-sm text-slate-500">
            {session.user.receipts.length} Recipt
          </p>
          <p className="text-sm text-slate-500">
            {session.user.people.length} Friends
          </p>
        </div>
      </div>
    </section>
  );
};
