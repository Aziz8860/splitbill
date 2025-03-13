'use client';
import { Button } from '@heroui/react';
import { useActionState } from 'react';
import { continueWithGoogleAction } from './action';

export const OauthButton = () => {
  const [state, formAction, pending] = useActionState(
    continueWithGoogleAction,
    null
  );

  return (
    <form action={formAction} className="w-full">
      <Button
        isLoading={pending}
        type="submit"
        className="w-full rounded-full shadow-md border border-slate-100 font-semibold text-slate-500 hover:bg-slate-50 transition-colors duration-300"
        variant="bordered"
        name="oAuth"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 128 128"
          className="mr-2"
        >
          <path
            fill="#4285F4"
            d="M44.59 4.21a63.28 63.28 0 0 0 4.33 120.9a67.6 67.6 0 0 0 32.36.35a57.13 57.13 0 0 0 25.9-13.46a57.44 57.44 0 0 0 16-26.26a74.3 74.3 0 0 0 1.61-33.58H65.27v24.69h34.47a29.72 29.72 0 0 1-12.66 19.52a36.2 36.2 0 0 1-13.93 5.5a41.3 41.3 0 0 1-15.1 0A37.2 37.2 0 0 1 44 95.74a39.3 39.3 0 0 1-14.5-19.42a38.3 38.3 0 0 1 0-24.63a39.25 39.25 0 0 1 9.18-14.91A37.17 37.17 0 0 1 76.13 27a34.3 34.3 0 0 1 13.64 8q5.83-5.8 11.64-11.63c2-2.09 4.18-4.08 6.15-6.22A61.2 61.2 0 0 0 87.2 4.59a64 64 0 0 0-42.61-.38"
          ></path>
        </svg>
        Continue with Google
      </Button>
    </form>
  );
};
