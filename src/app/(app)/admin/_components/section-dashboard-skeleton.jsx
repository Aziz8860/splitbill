export const SectionDashboardSkeleton = () => {
  return (
    <section className="flex flex-col items-center space-y-4">
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="flex flex-col col-span-1 bg-blue-100 h-[100px] border-slate-100 shadow-md rounded-lg p-4 items-center justify-center text-center w-full space-y-3">
          <p className="bg-blue-200 w-12 h-4 rounded-full animate-pulse"></p>
          <p className=" bg-blue-200 w-8 h-4 rounded-full animate-pulse"></p>
        </div>
        <div className="flex flex-col col-span-1 bg-yellow-100 h-[100px] border-slate-100 shadow-md rounded-lg p-4 items-center justify-center text-center w-full  space-y-3">
          <p className="bg-yellow-200 w-12 h-4 rounded-full animate-pulse"></p>
          <p className=" bg-yellow-200 w-8 h-4 rounded-full animate-pulse"></p>
        </div>
        <div className="flex flex-col col-span-1 bg-rose-100 h-[100px] border-slate-100 shadow-md rounded-lg p-4 items-center justify-center text-center w-full  space-y-3">
          <p className="bg-rose-200 w-12 h-4 rounded-full animate-pulse"></p>
          <p className=" bg-rose-200 w-8 h-4 rounded-full animate-pulse"></p>
        </div>
        <div className="flex flex-col col-span-1 bg-green-100 h-[100px] border-slate-100 shadow-md rounded-lg p-4 items-center justify-center text-center w-full  space-y-3">
          <p className="bg-green-200 w-12 h-4 rounded-full animate-pulse"></p>
          <p className=" bg-green-200 w-8 h-4 rounded-full animate-pulse"></p>
        </div>
      </div>
    </section>
  );
};
