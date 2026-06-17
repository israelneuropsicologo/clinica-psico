import { Card, CardContent } from "@/components/ui/card";
import { GoogleCalendarEmbed } from "@/components/GoogleCalendarEmbed";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { SessionsList } from "@/components/SessionsList";
import { SessionEditModal } from "@/components/SessionEditModal";
import { Button } from "@/components/ui/button";

export default function Calendar() {
  const [, navigate] = useLocation();
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: sessions } = trpc.sessions.list.useQuery({ status: "all" });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Agenda</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Google Calendar integrado - Suas sessões sincronizadas automaticamente
            </p>
          </div>
          <Button onClick={() => navigate("/sessions")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Sessão
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              ✅ <strong>Google Calendar integrado!</strong> Todas as sessões agendadas no Google Calendar aparecem automaticamente no sistema. Você pode gerenciar tudo diretamente no Google Calendar e as mudanças sincronizam em tempo real.
            </p>
          </CardContent>
        </Card>

        {/* Google Calendar Embed */}
        <GoogleCalendarEmbed calendarId="israelneuropsicologo@gmail.com" height="700px" />

        {/* Sessions List Below Calendar */}
        <Card>
          <CardContent className="pt-6">
            <SessionsList
              sessions={sessions || []}
              onEditSession={(session) => {
                setSelectedSession(session);
                setShowEditModal(true);
              }}
            />
          </CardContent>
        </Card>

        {/* Edit Modal */}
        <SessionEditModal
          session={selectedSession}
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSuccess={() => setSelectedSession(null)}
        />
      </div>
    </DashboardLayout>
  );
}
