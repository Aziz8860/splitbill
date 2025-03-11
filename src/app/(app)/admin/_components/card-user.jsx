import React from 'react';
import { getData } from './action';

export const CardUser = async () => {
  const { user } = await getData();
  return (
    <div className="flex flex-col col-span-1 bg-blue-100 h-[100px] border-slate-100 shadow-md rounded-lg p-4 items-center justify-center text-center w-full">
      <p className="tracking-tighter text-sm text-blue-600">Users</p>
      <p className="tracking-wider font-bold text-blue-600">{user}</p>
    </div>
  );
};
