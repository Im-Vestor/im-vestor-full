import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Shield, UserX, XCircle } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  action: string;
  adminId: string;
  timestamp: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditLogProps {
  entries?: AuditLogEntry[];
  isLoading?: boolean;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'USER_DELETION_ATTEMPT':
    case 'USER_DELETION_SUCCESS':
    case 'PERMANENT_USER_DELETION_ATTEMPT':
    case 'PERMANENT_USER_DELETION_SUCCESS':
    case 'FORCE_USER_DELETION_ATTEMPT':
    case 'FORCE_USER_DELETION_SUCCESS':
      return <UserX className="h-4 w-4 text-red-500" />;
    case 'USER_DELETION_FAILED':
    case 'PERMANENT_USER_DELETION_FAILED':
    case 'FORCE_USER_DELETION_FAILED':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Shield className="h-4 w-4 text-blue-500" />;
  }
};

const getActionColor = (action: string) => {
  if (action.includes('SUCCESS')) return 'bg-green-100 text-green-800 border-green-200';
  if (action.includes('FAILED')) return 'bg-red-100 text-red-800 border-red-200';
  if (action.includes('ATTEMPT')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-blue-100 text-blue-800 border-blue-200';
};

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString();
};

export function AuditLog({ entries = [], isLoading = false }: AuditLogProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Audit Log
          </CardTitle>
          <CardDescription>Recent admin actions and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg animate-pulse">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin Audit Log
        </CardTitle>
        <CardDescription>Recent admin actions and system events</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit log entries found</p>
                <p className="text-sm">Admin actions will appear here</p>
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActionIcon(entry.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs ${getActionColor(entry.action)}`}>
                        {entry.action.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm">
                      {entry.action.includes('USER_DELETION') && (
                        <div>
                          <strong>Target User:</strong> {entry.details.targetUserId}
                          {entry.details.targetUserEmail && (
                            <span className="text-muted-foreground"> ({entry.details.targetUserEmail})</span>
                          )}
                        </div>
                      )}
                      {entry.details.reason && (
                        <div className="mt-1">
                          <strong>Reason:</strong> {entry.details.reason}
                        </div>
                      )}
                      {entry.details.error && (
                        <div className="mt-1 text-red-600">
                          <strong>Error:</strong> {entry.details.error}
                        </div>
                      )}
                      {entry.ipAddress && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          IP: {entry.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default AuditLog;
