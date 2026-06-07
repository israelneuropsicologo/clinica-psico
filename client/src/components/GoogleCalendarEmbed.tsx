import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

interface GoogleCalendarEmbedProps {
  calendarId?: string;
  height?: string;
}

export function GoogleCalendarEmbed({ 
  calendarId = 'primary', 
  height = '600px' 
}: GoogleCalendarEmbedProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [daysInMonth, setDaysInMonth] = useState<(number | null)[]>([]);
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(0);

  // Buscar sessões do mês atual
  const { data: sessions = [], isLoading, error } = trpc.sessions.list.useQuery({
    from: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime(),
    to: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getTime(),
  });

  // Se houver erro, mostrar mensagem
  if (error) {
    console.error('[GoogleCalendarEmbed] Error loading sessions:', error);
  }

  // Calcular dias do mês
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    setFirstDayOfWeek(firstDay);
    
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay; i++) {
      days.push(i);
    }
    setDaysInMonth(days);
  }, [currentDate]);

  const getSessionsForDay = (day: number) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduledAt);
      return (
        sessionDate.getFullYear() === currentDate.getFullYear() &&
        sessionDate.getMonth() === currentDate.getMonth() &&
        sessionDate.getDate() === day
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendário de Sessões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Info Card */}
          <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900 dark:text-green-200">
              ✅ Calendário sincronizado com as sessões do sistema. Todas as suas sessões agendadas aparecem aqui automaticamente.
            </AlertDescription>
          </Alert>

          {/* Calendar Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold capitalize">{monthName}</h2>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 bg-muted">
              {weekDays.map(day => (
                <div key={day} className="p-3 text-center font-semibold text-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {daysInMonth.map((day, idx) => {
                const daySessionCount = day ? getSessionsForDay(day).length : 0;
                
                return (
                  <div
                    key={idx}
                    className={`min-h-24 p-2 border-r border-b text-sm ${
                      day === null ? 'bg-muted' : ''
                    } ${
                      day && new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString() === new Date().toDateString()
                        ? 'bg-blue-50 dark:bg-blue-950/30'
                        : ''
                    }`}
                  >
                    {day && (
                      <div className="space-y-1">
                        <div className="font-semibold text-xs">{day}</div>
                        {daySessionCount > 0 && (
                          <div className="text-xs text-primary font-medium">
                            {daySessionCount} sessão{daySessionCount > 1 ? 's' : ''}
                          </div>
                        )}
                        {getSessionsForDay(day).slice(0, 2).map((session, i) => (
                          <div key={i} className="text-xs bg-primary/10 text-primary rounded px-1 py-0.5 truncate">
                            {new Date(session.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Carregando sessões...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && sessions.length === 0 && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                Nenhuma sessão agendada para este mês.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
