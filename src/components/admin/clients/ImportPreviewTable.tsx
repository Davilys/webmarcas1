import React, { useState } from 'react';
import { Check, X, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type ParsedClient, type ValidationError, SYSTEM_FIELDS } from '@/lib/clientParser';
import { cn } from '@/lib/utils';

interface ImportPreviewTableProps {
  clients: ParsedClient[];
  validationErrors: ValidationError[];
  selectedRows: number[];
  onSelectionChange: (selectedRows: number[]) => void;
  existingEmails?: string[];
}

export function ImportPreviewTable({
  clients,
  validationErrors,
  selectedRows,
  onSelectionChange,
  existingEmails = [],
}: ImportPreviewTableProps) {
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  // Get errors for a specific row
  const getRowErrors = (rowIndex: number) => {
    return validationErrors.filter(e => e.rowIndex === rowIndex);
  };

  // Check if email already exists
  const isEmailDuplicate = (email?: string) => {
    return email && existingEmails.includes(email.toLowerCase().trim());
  };

  // Toggle row selection
  const toggleRow = (rowIndex: number) => {
    if (selectedRows.includes(rowIndex)) {
      onSelectionChange(selectedRows.filter(r => r !== rowIndex));
    } else {
      onSelectionChange([...selectedRows, rowIndex]);
    }
  };

  // Toggle all rows
  const toggleAll = () => {
    if (selectedRows.length === clients.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(clients.map((_, i) => i));
    }
  };

  // Select only valid rows
  const selectValidOnly = () => {
    const validRows = clients
      .map((client, index) => ({ client, index }))
      .filter(({ client, index }) => {
        const rowErrors = getRowErrors(index);
        const isDuplicate = isEmailDuplicate(client.email);
        return rowErrors.length === 0 && !isDuplicate;
      })
      .map(({ index }) => index);
    onSelectionChange(validRows);
  };

  // Filter clients if showing only errors
  const displayClients = showOnlyErrors
    ? clients.filter((_, index) => {
        const rowErrors = getRowErrors(index);
        const isDuplicate = isEmailDuplicate(clients[index].email);
        return rowErrors.length > 0 || isDuplicate;
      })
    : clients;

  // Columns to display
  const displayColumns = SYSTEM_FIELDS.filter(f => 
    ['full_name', 'email', 'phone', 'company_name', 'cpf_cnpj'].includes(f.key)
  );

  // Stats
  const totalWithErrors = clients.filter((client, index) => {
    const rowErrors = getRowErrors(index);
    const isDuplicate = isEmailDuplicate(client.email);
    return rowErrors.length > 0 || isDuplicate;
  }).length;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              <strong>{clients.length - totalWithErrors}</strong> válidos
            </span>
          </div>
          {totalWithErrors > 0 && (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm">
                <strong>{totalWithErrors}</strong> com erros
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm">
              <strong>{selectedRows.length}</strong> selecionados
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOnlyErrors(!showOnlyErrors)}
          >
            {showOnlyErrors ? 'Mostrar todos' : 'Mostrar só erros'}
          </Button>
          <Button variant="ghost" size="sm" onClick={selectValidOnly}>
            Selecionar válidos
          </Button>
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="h-[400px] border rounded-lg">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedRows.length === clients.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="w-[50px]">Status</TableHead>
              {displayColumns.map(col => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayClients.map((client, displayIndex) => {
              // Get original index for selection tracking
              const originalIndex = showOnlyErrors
                ? clients.findIndex(c => c === client)
                : displayIndex;
              
              const rowErrors = getRowErrors(originalIndex);
              const isDuplicate = isEmailDuplicate(client.email);
              const hasErrors = rowErrors.length > 0 || isDuplicate;
              const isSelected = selectedRows.includes(originalIndex);

              return (
                <TableRow
                  key={originalIndex}
                  className={cn(
                    hasErrors && "bg-destructive/5",
                    isSelected && !hasErrors && "bg-primary/5"
                  )}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleRow(originalIndex)}
                    />
                  </TableCell>
                  <TableCell>
                    {hasErrors ? (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      </div>
                    ) : (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </TableCell>
                  {displayColumns.map(col => {
                    const value = (client as Record<string, unknown>)[col.key];
                    const fieldError = rowErrors.find(e => e.field === col.key);
                    const isEmailField = col.key === 'email';
                    
                    return (
                      <TableCell key={col.key}>
                        <div className="space-y-1">
                          <span className={cn(
                            "text-sm",
                            fieldError && "text-destructive"
                          )}>
                            {value ? String(value) : '-'}
                          </span>
                          {fieldError && (
                            <p className="text-xs text-destructive">{fieldError.message}</p>
                          )}
                          {isEmailField && isDuplicate && !fieldError && (
                            <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                              Já existe
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Info */}
      <div className="text-xs text-muted-foreground">
        <p>• Registros com erros não serão importados</p>
        <p>• E-mails duplicados podem ser atualizados ou ignorados</p>
      </div>
    </div>
  );
}
