import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import type { Session } from "../../../drizzle/schema";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  User,
  Plus,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

type ViewMode = "month" | "week";

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
  no_show: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800",
};

export default function Calendar() {
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch sessions for the visible range
  const { from, to } = useMemo(() => {
    if (viewMode === "week") {
      const weekDays = getWeekDays(currentDate);
      return {
        from: weekDays[0].getTime(),
        to: weekDays[6].setHours(23, 59, 59, 999),
      };
    } else {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
      return { from: start.getTime(), to: end.getTime() };
    }
  }, [viewMode, currentDate]);

  const { data: sessions } = trpc.sessions.list.useQuery({ from, to });

  function navigate_prev() {
    const d = new Date(currentDate);
    if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  }

  function navigate_next() {
    const d = new Date(currentDate);
    if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  const sessionsForDay = (day: Date): Session[] =>
    (sessions ?? []).filter((s) => isSameDay(new Date(s.scheduledAt), day)) as Session[];

  const title =
    viewMode === "month"
      ? `${MONTHS_PT[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : (() => {
          const days = getWeekDays(currentDate);
          const first = days[0];
          const last = days[6];
          if (first.getMonth() === last.getMonth()) {
            return `${first.getDate()} – ${last.getDate()} de ${MONTHS_PT[first.getMonth()]} ${first.getFullYear()}`;
          }
          return `${first.getDate()} ${MONTHS_PT[first.getMonth()]} – ${last.getDate()} ${MONTHS_PT[last.getMonth()]} ${last.getFullYear()}`;
        })();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Agenda</h1>
            <p className="text-muted-foreground text-sm mt-1">Visualize e gerencie suas sessões</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={goToday}>Hoje</Button>
            <div className="flex rounded-md border border-border overflow-hidden">
              <Button
                variant={viewMode === "month" ? "default" : "ghost"}
                size="sm"
                className="rounded-none border-0"
                onClick={() => setViewMode("month")}
              >
                Mês
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "ghost"}
                size="sm"
                className="rounded-none border-0 border-l border-border"
                onClick={() => setViewMode("week")}
              >
                Semana
              </Button>
            </div>
            <Button onClick={() => navigate("/sessions")} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Sessão
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={navigate_prev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center">{title}</h2>
          <Button variant="outline" size="icon" onClick={navigate_next}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        {viewMode === "month" ? (
          <MonthView
            year={currentDate.getFullYear()}
            month={currentDate.getMonth()}
            sessionsForDay={sessionsForDay}
            onSessionClick={(id) => navigate(`/sessions/${id}`)}
          />
        ) : (
          <WeekView
            weekDays={getWeekDays(currentDate)}
            sessionsForDay={sessionsForDay}
            onSessionClick={(id) => navigate(`/sessions/${id}`)}
          />
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {[
            { status: "scheduled", label: "Agendada" },
            { status: "confirmed", label: "Confirmada" },
            { status: "completed", label: "Realizada" },
            { status: "cancelled", label: "Cancelada" },
            { status: "no_show", label: "Não compareceu" },
          ].map(({ status, label }) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm border ${STATUS_COLORS[status]}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

function MonthView({
  year,
  month,
  sessionsForDay,
  onSessionClick,
}: {
  year: number;
  month: number;
  sessionsForDay: (day: Date) => Session[];
  onSessionClick: (id: number) => void;
}) {
  const cells = getMonthDays(year, month);
  const today = new Date();

  return (
    <Card>
      <CardContent className="p-0 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS_PT.map((d) => (
            <div key={d} className="p-2 text-center text-xs font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        {/* Cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const daySessions = day ? sessionsForDay(day) : [];
            const isToday = day ? isSameDay(day, today) : false;
            const isCurrentMonth = day?.getMonth() === month;
            return (
              <div
                key={i}
                className={`min-h-[90px] p-1.5 border-b border-r border-border last:border-r-0 ${
                  !day ? "bg-muted/20" : ""
                } ${!isCurrentMonth ? "opacity-40" : ""}`}
              >
                {day && (
                  <>
                    <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                    }`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {daySessions.slice(0, 3).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => onSessionClick(s.id)}
                          className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded border truncate hover:opacity-80 transition-opacity ${STATUS_COLORS[s.status]}`}
                        >
                          {new Date(s.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {" "}P#{s.patientId}
                        </button>
                      ))}
                      {daySessions.length > 3 && (
                        <p className="text-[10px] text-muted-foreground pl-1">+{daySessions.length - 3} mais</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function WeekView({
  weekDays,
  sessionsForDay,
  onSessionClick,
}: {
  weekDays: Date[];
  sessionsForDay: (day: Date) => Session[];
  onSessionClick: (id: number) => void;
}) {
  const today = new Date();

  return (
    <Card>
      <CardContent className="p-0 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today);
            return (
              <div key={day.toISOString()} className="p-3 text-center border-r border-border last:border-r-0">
                <p className="text-xs text-muted-foreground">{DAYS_PT[day.getDay()]}</p>
                <div className={`text-lg font-bold mx-auto w-9 h-9 flex items-center justify-center rounded-full mt-0.5 ${
                  isToday ? "bg-primary text-primary-foreground" : ""
                }`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7 min-h-[400px]">
          {weekDays.map((day) => {
            const daySessions = sessionsForDay(day);
            return (
              <div key={day.toISOString()} className="p-2 border-r border-border last:border-r-0 space-y-1.5">
                {daySessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50 text-center mt-4">—</p>
                ) : (
                  daySessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onSessionClick(s.id)}
                      className={`w-full text-left p-2 rounded-lg border text-xs hover:opacity-80 transition-opacity ${STATUS_COLORS[s.status]}`}
                    >
                      <div className="flex items-center gap-1 font-semibold mb-0.5">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        {new Date(s.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Paciente #{s.patientId}</span>
                      </div>
                      <div className="mt-1">
                        <StatusBadge status={s.status} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
