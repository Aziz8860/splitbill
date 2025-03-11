import React from 'react';
import { getData } from './action';

export const CardTransaction = async () => {
  const { price } = await getData();
  return (
    <div className="flex flex-col col-span-1 bg-green-100 h-[100px] border-slate-100 shadow-md rounded-lg p-4 items-center justify-center text-center w-full">
      <p className="tracking-tighter text-sm text-green-600">Transactions</p>
      <p className="tracking-wider font-bold text-green-600">${price}</p>
    </div>
  );
};
