import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Mail, Phone, Trash2, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function Leads() {
  const { data: patients, isLoading, refetch } = trpc.patients.list.useQuery({
    leadStatus: "lead",
  });

  const convertLead = trpc.patients.update.useMutation({
    onSuccess: () => {
      toast.success("Lead convertido para prospect!");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePatient = trpc.patients.delete.useMutation({
    onSuccess: () => {
      toast.success("Lead descartado!");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

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
          <h1 className="text-3xl font-bold">Leads do Chatbot</h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar leads que chegam do chatbot do site
          </p>
        </div>

        {!patients?.length ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum lead no momento</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {patients.length} Lead{patients.length !== 1 ? "s" : ""} Ativo{patients.length !== 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold">{patient.name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            {patient.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                {patient.email}
                              </div>
                            )}
                            {patient.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                {patient.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {patient.lastInteractionAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Última interação: {new Date(patient.lastInteractionAt).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                        onClick={() =>
                          convertLead.mutate({
                            id: patient.id,
                            leadStatus: "prospect",
                          })
                        }
                        disabled={convertLead.isPending}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Converter
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => deletePatient.mutate({ id: patient.id })}
                        disabled={deletePatient.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
