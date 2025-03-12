'use client';
import { Button } from '@heroui/react';
import { useActionState } from 'react';
import { logoutAction } from '../action';

export const LogoutButton = () => {
  const [state, formAction, pending] = useActionState(logoutAction, null);

  return (
    <form action={formAction}>
      <Button
        isLoading={pending}
        type="submit"
        color="danger"
        className="flex rounded-full h-8 items-center hero-button-danger"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
        >
          <path
            fill="#ffffff"
            d="M5 22a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3h-2V4H6v16h12v-2h2v3a1 1 0 0 1-1 1zm13-6v-3h-7v-2h7V8l5 4z"
          ></path>
        </svg>
        Keluar
      </Button>
    </form>
  );
};
