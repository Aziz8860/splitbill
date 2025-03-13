import { Button } from '@heroui/react';
import Link from 'next/link';
import { OauthButton } from '../_components/oauth';

export default function Page() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex flex-col w-[400px] space-y-5 items-center border border-slate-200 rounded-xl px-5 py-12 shadow-md">
        <h1 className="font-bold text-large">Splitbill</h1>
        <OauthButton />
        <p className="tracking-extra-tight text-slate-500 text-sm">
          Tidak ingin Login ?
        </p>
        <Button className="w-full bg-primary text-white rounded-full hover:bg-primary-600 transition-colors duration-300">
          <Link href="/dashboard">Continue as guests</Link>
        </Button>
      </div>
    </div>
  );
}
