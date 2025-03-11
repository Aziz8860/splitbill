import React from 'react';
import { getData } from './action';

export const CardReceipt = async () => {
  const { receipt } = await getData();
  return (
    <div className="flex flex-col col-span-1 bg-yellow-100 h-[100px] border-slate-100 shadow-md rounded-lg p-4 items-center justify-center text-center w-full">
      <p className="tracking-tighter text-sm text-yellow-600">Receipts</p>
      <p className="tracking-wider  font-bold text-yellow-600">{receipt}</p>
    </div>
  );
};
