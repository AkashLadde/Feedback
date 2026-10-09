import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface LiveClockProps {
  className?: string;
  showSeconds?: boolean;
  showIcon?: boolean;
  variant?: 'badge' | 'header' | 'minimal' | 'banner';
}

export const LiveClock: React.FC<LiveClockProps> = ({
  className = '',
  showSeconds = true,
  showIcon = true,
  variant = 'badge'
}) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = days[time.getDay()];
  const dateNum = String(time.getDate()).padStart(2, '0');
  const monthName = months[time.getMonth()];
  const year = time.getFullYear();

  let hours = time.getHours();
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hourStr = String(hours).padStart(2, '0');

  const timeStr = showSeconds ? `${hourStr}:${minutes}:${seconds} ${ampm}` : `${hourStr}:${minutes} ${ampm}`;
  const dateStr = `${dayName}, ${dateNum} ${monthName} ${year}`;

  if (variant === 'banner') {
    return (
      <div className={`flex items-center gap-2 font-mono text-[11px] text-slate-200 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-white">{dayName.toUpperCase()}</span>
        <span className="text-slate-400">•</span>
        <span>{dateNum} {monthName} {year}</span>
        <span className="text-slate-400">•</span>
        <span className="font-bold text-amber-300">{timeStr}</span>
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className={`bg-gradient-to-r from-pink-50 via-rose-50 to-orange-50 border border-pink-200/80 px-3.5 py-1.5 rounded-2xl shadow-xs flex items-center gap-2 ${className}`}>
        {showIcon && <Clock className="w-3.5 h-3.5 text-pink-700 animate-pulse" />}
        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <span className="text-pink-900">{dateStr}</span>
          <span className="text-slate-300 font-normal">|</span>
          <span className="font-mono text-rose-800 font-extrabold">{timeStr}</span>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`font-mono text-xs flex items-center gap-1.5 ${className}`}>
        {showIcon && <Clock className="w-3 h-3 text-pink-600" />}
        <span className="font-bold">{timeStr}</span>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-800 shadow-xs ${className}`}>
      {showIcon && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
      <span className="text-slate-300 font-medium">{dayName}, {dateNum} {monthName}</span>
      <span className="text-slate-600">•</span>
      <span className="font-mono font-extrabold text-pink-300">{timeStr}</span>
    </div>
  );
};
