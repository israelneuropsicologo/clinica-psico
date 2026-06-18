// @ts-nocheck
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mail, Phone, Trash2, CheckCircle, Calendar, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { RejectionModal } from "@/components/RejectionModal";
import { initializeTimezone, formatDateWithTimezone } from "@/lib/timezoneHelper";

export default function DirectBookings() {
  const { data: sessions, isLoading, refetch } = trpc.webhooks.getDirectBookings.useQuery({});
  const forceSyncMutation = trpc.webhooks.forceSyncPending.useQuery();
  const [rejectionModal, setRejectionModal] = useState<{ sessionId: number; patientName: string } | null>(null);
  const [userTimezone, setUserTimezone] = useState<string>("");

  // Detect user timezone automatically on mount
  useEffect(() => {
    const timezone = initializeTimezone();
    setUserTimezone(timezone);
  }, []);
  
  // Refetch quando forceSyncPending completa
  useEffect(() => {
    if (forceSyncMutation.data) {
      refetch();
    }
  }, [forceSyncMutation.data, refetch]);

  const updateSession = trpc.sessions.update.useMutation({
    onSuccess: () => {
      toast.success("Agendamento confirmado e adicionado à agenda!");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectSession = trpc.sessions.update.useMutation({
    onSuccess: () => {
      toast.success("Agendamento recusado e arquivado!");
      setRejectionModal(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleConfirm = (sessionId: number) => {
    updateSession.mutate({
      id: sessionId,
      status: "confirmed",
    });
  };

  const handleRejectClick = (sessionId: number, patientName: string) => {
    setRejectionModal({ sessionId, patientName });
  };

  const handleRejectConfirm = (reason: string) => {
    if (!rejectionModal) return;

    rejectSession.mutate({
      id: rejectionModal.sessionId,
      status: "cancelled",
      cancelReason: reason,
      rejectionReason: reason,
      rejectionDate: new Date(),
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos Diretos do Site</h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar agendamentos que chegam do site
            {userTimezone && <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">Fuso: {userTimezone}</span>}
          </p>
        </div>

        {!sessions?.length ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum agendamento pendente</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {sessions.length} Agendamento{sessions.length !== 1 ? "s" : ""} Pendente{sessions.length !== 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.map((session) => {
                  const { date, time, timezone } = formatDateWithTimezone(session.scheduledAt, userTimezone);
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-950/40 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-semibold">{session.patient?.name || `Paciente #${session.patientId}`}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              {session.patient?.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3.5 w-3.5" />
                                  {session.patient.email}
                                </div>
                              )}
                              {session.patient?.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5" />
                                  {session.patient.phone}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                              <Calendar className="h-3.5 w-3.5" />
                              {date} às {time}
                              <span className="text-xs ml-1 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                {timezone}
                              </span>
                            </div>
                            {session.sessionValue && (
                              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(Number(session.sessionValue))}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                          onClick={() => handleConfirm(session.id)}
                          disabled={updateSession.isPending}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => handleRejectClick(session.id, session.patient?.name || `Paciente #${session.patientId}`)}
                          disabled={rejectSession.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Recusar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rejection Modal */}
      <RejectionModal
        open={!!rejectionModal}
        patientName={rejectionModal?.patientName || ""}
        onClose={() => setRejectionModal(null)}
        onConfirm={handleRejectConfirm}
        isLoading={rejectSession.isPending}
      />
    </DashboardLayout>
  );
}
