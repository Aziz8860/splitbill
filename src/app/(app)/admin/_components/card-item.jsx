import React from 'react';
import { getData } from './action';

export const CardItem = async () => {
  const { item } = await getData();
  return (
    <div className="flex flex-col col-span-1 bg-rose-100 h-[100px] border-slate-100 shadow-md rounded-lg p-4 items-center justify-center text-center w-full">
      <p className="tracking-tighter text-sm text-rose-600">Items</p>
      <p className="tracking-wider font-bold text-rose-600">{item}</p>
    </div>
  );
};
