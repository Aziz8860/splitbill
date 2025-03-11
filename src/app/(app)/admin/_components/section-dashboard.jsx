import React from 'react';
import { CardUser } from './card-user';
import { CardReceipt } from './card-receipt';
import { CardItem } from './card-item';
import { CardTransaction } from './card-transcaction';

export const SectionDashboard = () => {
  return (
    <section className="flex flex-col items-center space-y-4">
      <div className="grid grid-cols-2 gap-4 w-full">
        <CardUser />
        <CardReceipt />
        <CardItem />
        <CardTransaction />
      </div>
    </section>
  );
};
