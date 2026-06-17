import React, { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnamneseTab } from "./AnamneseTab";
import { Card } from "@/components/ui/card";

export function PatientDetail() {
  const [location] = useLocation();
  const [match, params] = useRoute("/patients/:id");

  if (!match || !params?.id) {
    return <div>Paciente não encontrado</div>;
  }

  const patientId = parseInt(params.id as string);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Paciente #{patientId}</h1>
          <p className="text-gray-600">Gerenciar informações do paciente</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="anamnese" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="sessoes">Sessões</TabsTrigger>
            <TabsTrigger value="notas">Notas</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {/* Anamnese Tab */}
            <TabsContent value="anamnese">
              <AnamneseTab patientId={patientId} />
            </TabsContent>

            {/* Perfil Tab */}
            <TabsContent value="perfil">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Perfil do Paciente</h2>
                <p className="text-gray-600">Seção de perfil em desenvolvimento...</p>
              </Card>
            </TabsContent>

            {/* Sessões Tab */}
            <TabsContent value="sessoes">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Sessões</h2>
                <p className="text-gray-600">Seção de sessões em desenvolvimento...</p>
              </Card>
            </TabsContent>

            {/* Notas Tab */}
            <TabsContent value="notas">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Notas Clínicas</h2>
                <p className="text-gray-600">Seção de notas em desenvolvimento...</p>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export default PatientDetail;
