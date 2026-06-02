import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ACTIONS = [
  "login",
  "logout",
  "create",
  "update",
  "delete",
  "view",
  "export",
];

const ENTITY_TYPES = [
  "patients",
  "sessions",
  "users",
  "transactions",
  "documents",
  "clinical_notes",
];

export default function AdminAudit() {
  const [filters, setFilters] = useState({
    userId: "",
    action: "",
    entityType: "",
    startDate: "",
    endDate: "",
  });

  const [page, setPage] = useState(0);
  const limit = 50;

  const { data: logs, isLoading } = trpc.audit.list.useQuery({
    userId: filters.userId ? parseInt(filters.userId) : undefined,
    action: filters.action || undefined,
    entityType: filters.entityType || undefined,
    startDate: filters.startDate ? new Date(filters.startDate) : undefined,
    endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    limit,
    offset: page * limit,
  });

  const { data: totalCount } = trpc.audit.count.useQuery({
    userId: filters.userId ? parseInt(filters.userId) : undefined,
    action: filters.action || undefined,
    entityType: filters.entityType || undefined,
    startDate: filters.startDate ? new Date(filters.startDate) : undefined,
    endDate: filters.endDate ? new Date(filters.endDate) : undefined,
  });

  const getStatusColor = (status: string) => {
    return status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      login: "bg-blue-100 text-blue-800",
      logout: "bg-gray-100 text-gray-800",
      create: "bg-green-100 text-green-800",
      update: "bg-yellow-100 text-yellow-800",
      delete: "bg-red-100 text-red-800",
      view: "bg-purple-100 text-purple-800",
      export: "bg-indigo-100 text-indigo-800",
    };
    return colors[action] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatório de Atividades</h1>
        <p className="text-gray-600 mt-2">
          Visualize e filtre todas as atividades dos usuários internos
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium">ID do Usuário</label>
              <Input
                type="number"
                placeholder="ID do usuário"
                value={filters.userId}
                onChange={(e) =>
                  setFilters({ ...filters, userId: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Ação</label>
              <Select value={filters.action} onValueChange={(value) =>
                setFilters({ ...filters, action: value })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as ações</SelectItem>
                  {ACTIONS.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Tipo de Entidade</label>
              <Select
                value={filters.entityType}
                onValueChange={(value) =>
                  setFilters({ ...filters, entityType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() =>
                setFilters({
                  userId: "",
                  action: "",
                  entityType: "",
                  startDate: "",
                  endDate: "",
                })
              }
              variant="outline"
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Logs de Auditoria ({totalCount || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : logs && logs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-sm">{log.userId}</TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.entityType || "-"}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {log.description || log.entityName || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum log encontrado
            </div>
          )}

          {/* Paginação */}
          {logs && logs.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Mostrando {page * limit + 1} a{" "}
                {Math.min((page + 1) * limit, totalCount || 0)} de{" "}
                {totalCount || 0}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  variant="outline"
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={!logs || logs.length < limit}
                  variant="outline"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
