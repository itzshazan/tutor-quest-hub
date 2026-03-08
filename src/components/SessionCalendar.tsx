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

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
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
        <h3 className="font-display text-lg font-semibold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
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
                "relative flex min-h-[60px] flex-col items-center rounded-lg p-1 text-sm transition-colors hover:bg-accent",
                !isCurrentMonth && "text-muted-foreground/50",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                isToday && !isSelected && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <span className="font-medium">{format(day, "d")}</span>
              {daySessions.length > 0 && (
                <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                  {daySessions.slice(0, 3).map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        session.status === "completed" && "bg-green-500",
                        session.status === "confirmed" && "bg-blue-500",
                        session.status === "pending" && "bg-yellow-500",
                        session.status === "cancelled" && "bg-red-500"
                      )}
                    />
                  ))}
                  {daySessions.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{daySessions.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Sessions */}
      {selectedDate && (
        <div className="mt-6 space-y-3">
          <h4 className="font-medium text-foreground">
            Sessions for {format(selectedDate, "MMMM d, yyyy")}
          </h4>
          {selectedDateSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions scheduled for this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedDateSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{session.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                        {session.other_user && ` • ${session.other_user.full_name}`}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn("capitalize", STATUS_COLORS[session.status])}>
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
