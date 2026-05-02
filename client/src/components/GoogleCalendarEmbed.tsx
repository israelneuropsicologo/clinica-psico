import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calendar } from 'lucide-react';

interface GoogleCalendarEmbedProps {
  calendarId?: string;
  height?: string;
}

export function GoogleCalendarEmbed({ 
  calendarId = 'primary', 
  height = '600px' 
}: GoogleCalendarEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Google Calendar Embed script
    const script = document.createElement('script');
    script.src = 'https://calendar.google.com/calendar/plus/embed.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoading(false);
      // Trigger calendar rendering
      if (window.gapi && window.gapi.load) {
        window.gapi.load('calendar', () => {
          // Calendar is loaded
        });
      }
    };

    script.onerror = () => {
      setError('Falha ao carregar o Google Calendar. Verifique sua conexão.');
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando calendário...</p>
            </div>
          </div>
        )}
        
        <div 
          className="overflow-hidden rounded-lg border"
          style={{ height: isLoading ? '0' : height }}
        >
          <iframe
            src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&ctz=America%2FSao_Paulo`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: isLoading ? 'none' : 'block'
            }}
            frameBorder="0"
            scrolling="no"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Extend window to include Google API
declare global {
  interface Window {
    gapi?: {
      load: (api: string, callback: () => void) => void;
    };
  }
}
