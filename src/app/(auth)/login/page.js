import { Button } from '@heroui/react';
import Link from 'next/link';
import Image from 'next/image';
import { OauthButton } from '../_components/oauth';
import { auth } from '@/libs/auth';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await auth();

  // If already logged in, redirect to dashboard
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center to-background p-4">
      <div className="w-full max-w-lg space-y-8 border-2 rounded-lg p-8">
        <div className="text-center">
          <Image
            src="/logo-splitbill.svg"
            alt="SplitBill Logo"
            width={80}
            height={80}
            className="mx-auto"
          />
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Ayo sini Splitbill praktis
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Scan, split bill, share, semuanya sat set!
          </p>
        </div>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                Pilihan sign in
              </span>
            </div>
          </div>

          <div className="mt-6">
            <OauthButton />

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">Tidak ingin Login?</p>
              <Link
                className="flex items-center justify-center mt-2 py-2 w-full bg-primary text-white rounded-full hover:bg-primary-600 transition-colors duration-300"
                href="/dashboard"
              >
                Masuk sebagai guest
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  Enaknya pake Splitbill
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-primary-50 p-4 text-center">
              <h3 className="text-lg font-medium text-primary-700">
                Semua prosesnya bisa sat set
              </h3>
              <p className="mt-2 text-sm text-primary-600">
                Kamu bisa share tagihan dengan cara scan atau upload gambar.
                Kami bakal proses itung-itungan dengan bantuan AI, biar kamu
                nggak usah pusing. Aman, deh!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
