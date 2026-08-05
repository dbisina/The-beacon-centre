// src/app/dashboard/prayer-requests/page.tsx - Prayer request inbox (read + mark-status only)

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  HeartHandshake,
  Lock,
  Globe,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Inbox,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { prayerRequestsApi } from '@/lib/api';

// ─── Local types (mirrors backend/prisma/schema.prisma: model PrayerRequest) ───

type PrayerRequestStatus = 'NEW' | 'IN_PROGRESS' | 'HANDLED';

interface PrayerRequest {
  id: number;
  appUserId?: number | null;
  name?: string | null;
  body: string;
  isPrivate: boolean;
  status: PrayerRequestStatus;
  handledByAdminId?: number | null;
  handledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PrayerRequestsResponse {
  prayerRequests: PrayerRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_TABS: { value: PrayerRequestStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'HANDLED', label: 'Handled' },
];

function StatusBadge({ status }: { status: PrayerRequestStatus }) {
  switch (status) {
    case 'NEW':
      return <Badge className="border-0 bg-blue-100 text-blue-700 hover:bg-blue-100">New</Badge>;
    case 'IN_PROGRESS':
      return (
        <Badge className="border-0 bg-amber-100 text-amber-700 hover:bg-amber-100">
          In Progress
        </Badge>
      );
    case 'HANDLED':
      return (
        <Badge className="border-0 bg-green-100 text-green-700 hover:bg-green-100">Handled</Badge>
      );
  }
}

const BODY_PREVIEW_LENGTH = 140;

function PrayerRequestsTable({
  requests,
  isLoading,
  onStatusChange,
  pendingId,
}: {
  requests: PrayerRequest[];
  isLoading: boolean;
  onStatusChange: (id: number, status: PrayerRequestStatus) => void;
  pendingId: number | null;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Inbox className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">No prayer requests</h3>
        <p className="max-w-sm text-sm text-slate-500">
          Prayer requests submitted from the mobile app will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-[160px]">Name</TableHead>
            <TableHead>Request</TableHead>
            <TableHead className="w-[110px]">Privacy</TableHead>
            <TableHead className="w-[140px]">Submitted</TableHead>
            <TableHead className="w-[130px]">Status</TableHead>
            <TableHead className="w-[170px]">Update Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const isExpanded = expandedIds.has(request.id);
            const needsTruncation = request.body.length > BODY_PREVIEW_LENGTH;
            const displayBody =
              isExpanded || !needsTruncation
                ? request.body
                : `${request.body.slice(0, BODY_PREVIEW_LENGTH)}...`;

            return (
              <TableRow key={request.id}>
                <TableCell className="align-top font-medium text-slate-800">
                  {request.name || <span className="italic text-slate-400">Anonymous</span>}
                </TableCell>
                <TableCell className="align-top">
                  <p className="max-w-lg whitespace-pre-wrap text-sm text-slate-700">
                    {displayBody}
                  </p>
                  {needsTruncation && (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(request.id)}
                      className="mt-1 flex items-center text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      {isExpanded ? (
                        <>
                          View less <ChevronUp className="ml-1 h-3 w-3" />
                        </>
                      ) : (
                        <>
                          View more <ChevronDown className="ml-1 h-3 w-3" />
                        </>
                      )}
                    </button>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  {request.isPrivate ? (
                    <Badge variant="outline" className="text-slate-600">
                      <Lock className="mr-1 h-3 w-3" /> Private
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-600">
                      <Globe className="mr-1 h-3 w-3" /> Public
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="align-top text-sm text-slate-600">
                  {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                  <div className="text-xs text-slate-400">
                    {format(new Date(request.createdAt), 'h:mm a')}
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <StatusBadge status={request.status} />
                </TableCell>
                <TableCell className="align-top">
                  <Select
                    value={request.status}
                    onValueChange={(value) =>
                      onStatusChange(request.id, value as PrayerRequestStatus)
                    }
                    disabled={pendingId === request.id}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      {pendingId === request.id ? (
                        <span className="flex items-center text-slate-500">
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Saving...
                        </span>
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="HANDLED">Handled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function PrayerRequestsPageContent() {
  const [statusFilter, setStatusFilter] = useState<PrayerRequestStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PrayerRequestsResponse>({
    queryKey: ['prayer-requests', { page: currentPage, status: statusFilter, limit: 20 }],
    queryFn: () =>
      prayerRequestsApi.getAll({
        page: currentPage,
        limit: 20,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  });

  // Lightweight counts (independent of the current filter/page) for the stat row.
  const { data: stats } = useQuery({
    queryKey: ['prayer-requests-stats'],
    queryFn: async () => {
      const [all, newReqs, inProgress, handled] = await Promise.all([
        prayerRequestsApi.getAll({ limit: 1 }),
        prayerRequestsApi.getAll({ limit: 1, status: 'NEW' }),
        prayerRequestsApi.getAll({ limit: 1, status: 'IN_PROGRESS' }),
        prayerRequestsApi.getAll({ limit: 1, status: 'HANDLED' }),
      ]);
      return {
        total: (all as PrayerRequestsResponse).total || 0,
        new: (newReqs as PrayerRequestsResponse).total || 0,
        inProgress: (inProgress as PrayerRequestsResponse).total || 0,
        handled: (handled as PrayerRequestsResponse).total || 0,
      };
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: PrayerRequestStatus }) => {
      setPendingId(id);
      return prayerRequestsApi.updateStatus(id, status);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Prayer request status updated' });
      queryClient.invalidateQueries({ queryKey: ['prayer-requests'] });
      queryClient.invalidateQueries({ queryKey: ['prayer-requests-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to update status',
        variant: 'destructive',
      });
    },
    onSettled: () => setPendingId(null),
  });

  const handleStatusChange = (id: number, status: PrayerRequestStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  const requests = data?.prayerRequests || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.total || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Prayer Requests</h1>
        <p className="mt-1 text-slate-600">
          Review prayer requests submitted from the mobile app and track their status
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total</CardTitle>
            <HeartHandshake className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.total ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">New</CardTitle>
            <Inbox className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats?.new ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{stats?.inProgress ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Handled</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats?.handled ?? '—'}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Inbox</CardTitle>
            <Tabs
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as PrayerRequestStatus | 'ALL');
                setCurrentPage(1);
              }}
            >
              <TabsList>
                {STATUS_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <PrayerRequestsTable
            requests={requests}
            isLoading={isLoading}
            onStatusChange={handleStatusChange}
            pendingId={pendingId}
          />

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600">
                Page {data?.page || 1} of {totalPages} ({totalCount} total)
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PrayerRequestsPage() {
  return (
    <ProtectedRoute requireRole={[AdminRole.SUPER_ADMIN, AdminRole.ADMIN]}>
      <PrayerRequestsPageContent />
    </ProtectedRoute>
  );
}
