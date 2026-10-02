import React from "react";

export default function WeekdayStrip({
  weekDates,
  selectedDate,
  onSelectDate,
  getDayStatus,
  dayStatusColors,
  WEEKDAYS
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {weekDates.map((dateStr, idx) => {
        const isSelected = selectedDate === dateStr;
        const status = getDayStatus(dateStr);
        const statusClasses = dayStatusColors[status] || dayStatusColors.draft;
        const displayDate = new Date(dateStr + "T12:00:00.000Z");

        return (
          <button
            key={dateStr}
            onClick={() => onSelectDate(dateStr)}
            className={`
              flex-1 min-w-[100px] p-3 rounded-lg border transition-all flex flex-col items-center gap-1
              ${isSelected 
                ? "bg-accent text-dark font-bold border-accent shadow-lg shadow-accent/20" 
                : `bg-dark-paper ${statusClasses}`
              }
            `}
          >
            <span className="text-sm tracking-widest">{WEEKDAYS[idx]}</span>
            <span className={`text-xs ${isSelected ? "text-dark/80" : "text-gray-500"}`}>
               {displayDate.toLocaleDateString(undefined, {month:'short', day:'numeric'})}
            </span>
          </button>
        );
      })}
    </div>
  );
}