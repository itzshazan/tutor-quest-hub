import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  subject: string;
  status: string;
  other_user?: {
    full_name: string;
  };
}

interface SessionCalendarProps {
  sessions: Session[];
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

const STATUS_DOT: Record<string, string> = {
  pending: "bg-[#ffd166]",
  confirmed: "bg-[#60a5fa]",
  completed: "bg-[#90be6d]",
  cancelled: "bg-[#ff5a5a]",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-[#fff9c4] text-[#d4a017] border-[#ffd166]",
  confirmed: "bg-[#dbeafe] text-[#2563eb] border-[#60a5fa]",
  completed: "bg-[#eef6ea] text-[#4a7a2a] border-[#90be6d]",
  cancelled: "bg-[#ffebed] text-[#d32f2f] border-[#ff5a5a]",
};

export function SessionCalendar({ sessions, onDateSelect, selectedDate }: SessionCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, Session[]>();
    sessions.forEach((session) => {
      const dateKey = session.session_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(session);
    });
    return map;
  }, [sessions]);

  const getSessionsForDate = (date: Date): Session[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return sessionsByDate.get(dateKey) || [];
  };

  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : [];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-kalam text-2xl font-bold text-hd-ink">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-[3px] border-hd-ink bg-white hover:bg-[#fdfbf7] hover:text-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl transition-all hover:-translate-y-0.5"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-[3px] border-hd-ink bg-white hover:bg-[#fdfbf7] hover:text-hd-ink shadow-[2px_2px_0px_0px_#2d2d2d] rounded-xl transition-all hover:-translate-y-0.5"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-2 text-sm font-bold text-hd-ink/50 font-kalam">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const daySessions = getSessionsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect?.(day)}
              className={cn(
                "relative flex min-h-[56px] flex-col items-center rounded-xl p-1.5 text-sm font-bold transition-all border-2",
                !isCurrentMonth && "text-hd-ink/25 border-transparent",
                isCurrentMonth && "text-hd-ink border-hd-ink/10 hover:border-hd-ink/30 hover:bg-white/60",
                isSelected && "bg-[#ff5a5a] text-white border-hd-ink shadow-[3px_3px_0px_0px_#2d2d2d] hover:bg-[#ff5a5a]",
                isToday && !isSelected && "border-[#ff5a5a] border-dashed bg-[#fff5f5]"
              )}
            >
              <span className="font-kalam text-base">{format(day, "d")}</span>
              {daySessions.length > 0 && (
                <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                  {daySessions.slice(0, 3).map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "h-2 w-2 rounded-full border border-hd-ink/30",
                        STATUS_DOT[session.status] || "bg-gray-400"
                      )}
                    />
                  ))}
                  {daySessions.length > 3 && (
                    <span className={cn("text-[9px] font-bold", isSelected ? "text-white/80" : "text-hd-ink/50")}>+{daySessions.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Sessions */}
      {selectedDate && (
        <div className="mt-4 space-y-3 border-t-2 border-dashed border-hd-ink/20 pt-4">
          <h4 className="font-kalam text-lg font-bold text-hd-ink">
            Sessions for {format(selectedDate, "MMMM d, yyyy")}
          </h4>
          {selectedDateSessions.length === 0 ? (
            <p className="text-sm font-medium text-hd-ink/50">No sessions scheduled for this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedDateSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-xl border-2 border-hd-ink bg-white p-3 shadow-[2px_2px_0px_0px_#2d2d2d]"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-hd-ink/50" />
                    <div>
                      <p className="font-bold text-hd-ink">{session.subject}</p>
                      <p className="text-sm font-medium text-hd-ink/60">
                        {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                        {session.other_user && ` • ${session.other_user.full_name}`}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn("capitalize text-xs font-bold border-2 shadow-[1px_1px_0px_0px_#2d2d2d]", STATUS_BADGE[session.status] || "bg-white text-hd-ink border-hd-ink")}>
                    {session.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
