import moment from 'moment';

export const HistoryCard = ({ item }) => {
  return (
    <div
      key={item.id}
      className="w-full border border-slate-200 bg-slate-100 px-3 py-2 rounded-lg space-y-2"
    >
      <div className="grid grid-cols-6  border-b-1 border-slate-200">
        <div className="flex col-span-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full w-8 h-8 items-center justify-center text-xs font-bold text-white">
          {item.restaurant.charAt(0)}
        </div>
        <div className="col-span-5 ">
          <div className="font-bold tracking-tighter text-sm">
            {item.restaurant}
          </div>
          <div className="text-xs font-light">
            {moment(item.date).format('MMM DD, YYYY - hh:mm')}
          </div>
        </div>
      </div>
      <div className="flex font-sm  item-center justify-between items-center">
        <div className="flex gap-2">
          <p> Total</p> <p className="font-bold">${item.subtotal}</p>
        </div>
        <div className="text-xs font-light">{item._count.items} item</div>
      </div>
    </div>
  );
};
