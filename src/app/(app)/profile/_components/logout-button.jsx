'use client';
import { Button } from '@heroui/react';
import { useActionState } from 'react';
import { logoutAction } from './logout-action';

export const LogoutButton = () => {
  const [state, formAction, pending] = useActionState(logoutAction, null);

  return (
    <form action={formAction}>
      <Button
        isLoading={pending}
        type="submit"
        color="danger"
        className="rounded-full"
      >
        Keluar
      </Button>
    </form>
  );
};
