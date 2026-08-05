// src/app/dashboard/contact/page.tsx - Contact message inbox (read + mark-status only)

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Mail,
  Inbox,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Phone,
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { contactApi } from '@/lib/api';

// ─── Local types (mirrors backend/prisma/schema.prisma: model ContactMessage) ───

type ContactMessageStatus = 'NEW' | 'HANDLED';
type ContactCategory = 'GENERAL' | 'CSG' | 'PRAYER' | 'TECHNICAL' | 'OTHER';

interface ContactMessage {
  id: number;
  appUserId?: number | null;
  name: string;
  email: string;
  phone?: string | null;
  category: ContactCategory;
  csgId?: number | null;
  message: string;
  status: ContactMessageStatus;
  handledByAdminId?: number | null;
  handledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ContactMessagesResponse {
  contactMessages: ContactMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const CATEGORY_FILTERS: { value: ContactCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'GENERAL', label: 'General' },
  { value: 'CSG', label: 'Community Group' },
  { value: 'PRAYER', label: 'Prayer' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_FILTERS: { value: ContactMessageStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'HANDLED', label: 'Handled' },
];

function CategoryBadge({ category }: { category: ContactCategory }) {
  const config: Record<ContactCategory, string> = {
    GENERAL: 'bg-slate-100 text-slate-700',
    CSG: 'bg-blue-100 text-blue-700',
    PRAYER: 'bg-purple-100 text-purple-700',
    TECHNICAL: 'bg-amber-100 text-amber-700',
    OTHER: 'bg-rose-100 text-rose-700',
  };
  return <Badge className={`border-0 ${config[category]}`}>{category}</Badge>;
}

function StatusBadge({ status }: { status: ContactMessageStatus }) {
  return status === 'NEW' ? (
    <Badge className="border-0 bg-blue-100 text-blue-700 hover:bg-blue-100">New</Badge>
  ) : (
    <Badge className="border-0 bg-green-100 text-green-700 hover:bg-green-100">Handled</Badge>
  );
}

const MESSAGE_PREVIEW_LENGTH = 140;

function ContactTable({
  messages,
  isLoading,
  onToggleStatus,
  pendingId,
}: {
  messages: ContactMessage[];
  isLoading: boolean;
  onToggleStatus: (id: number, nextStatus: ContactMessageStatus) => void;
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

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Mail className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">No contact messages</h3>
        <p className="max-w-sm text-sm text-slate-500">
          Messages submitted from the mobile app's contact form will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-[180px]">Contact</TableHead>
            <TableHead className="w-[110px]">Category</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="w-[130px]">Received</TableHead>
            <TableHead className="w-[110px]">Status</TableHead>
            <TableHead className="w-[140px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((msg) => {
            const isExpanded = expandedIds.has(msg.id);
            const needsTruncation = msg.message.length > MESSAGE_PREVIEW_LENGTH;
            const displayMessage =
              isExpanded || !needsTruncation
                ? msg.message
                : `${msg.message.slice(0, MESSAGE_PREVIEW_LENGTH)}...`;

            return (
              <TableRow key={msg.id}>
                <TableCell className="align-top">
                  <div className="font-medium text-slate-800">{msg.name}</div>
                  <div className="text-xs text-slate-500">{msg.email}</div>
                  {msg.phone && (
                    <div className="mt-0.5 flex items-center text-xs text-slate-400">
                      <Phone className="mr-1 h-3 w-3" /> {msg.phone}
                    </div>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <CategoryBadge category={msg.category} />
                </TableCell>
                <TableCell className="align-top">
                  <p className="max-w-lg whitespace-pre-wrap text-sm text-slate-700">
                    {displayMessage}
                  </p>
                  {needsTruncation && (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(msg.id)}
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
                <TableCell className="align-top text-sm text-slate-600">
                  {format(new Date(msg.createdAt), 'MMM dd, yyyy')}
                  <div className="text-xs text-slate-400">
                    {format(new Date(msg.createdAt), 'h:mm a')}
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <StatusBadge status={msg.status} />
                </TableCell>
                <TableCell className="align-top">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pendingId === msg.id}
                    onClick={() => onToggleStatus(msg.id, msg.status === 'NEW' ? 'HANDLED' : 'NEW')}
                  >
                    {pendingId === msg.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : msg.status === 'NEW' ? (
                      'Mark handled'
                    ) : (
                      'Mark new'
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ContactPageContent() {
  const [statusFilter, setStatusFilter] = useState<ContactMessageStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<ContactCategory | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ContactMessagesResponse>({
    queryKey: [
      'contact-messages',
      { page: currentPage, status: statusFilter, category: categoryFilter, limit: 20 },
    ],
    queryFn: () =>
      contactApi.getAll({
        page: currentPage,
        limit: 20,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        category: categoryFilter === 'ALL' ? undefined : categoryFilter,
      }),
  });

  // Lightweight counts (independent of the current filter/page) for the stat row.
  const { data: stats } = useQuery({
    queryKey: ['contact-messages-stats'],
    queryFn: async () => {
      const [all, newMsgs, handled] = await Promise.all([
        contactApi.getAll({ limit: 1 }),
        contactApi.getAll({ limit: 1, status: 'NEW' }),
        contactApi.getAll({ limit: 1, status: 'HANDLED' }),
      ]);
      return {
        total: (all as ContactMessagesResponse).total || 0,
        new: (newMsgs as ContactMessagesResponse).total || 0,
        handled: (handled as ContactMessagesResponse).total || 0,
      };
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ContactMessageStatus }) => {
      setPendingId(id);
      return contactApi.updateStatus(id, status);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Contact message status updated' });
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      queryClient.invalidateQueries({ queryKey: ['contact-messages-stats'] });
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

  const handleToggleStatus = (id: number, nextStatus: ContactMessageStatus) => {
    updateStatusMutation.mutate({ id, status: nextStatus });
  };

  const messages = data?.contactMessages || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.total || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Contact Messages</h1>
        <p className="mt-1 text-slate-600">
          Review messages submitted through the mobile app's contact form
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Messages</CardTitle>
            <Mail className="h-4 w-4 text-slate-400" />
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Inbox</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value as ContactCategory | 'ALL');
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_FILTERS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as ContactMessageStatus | 'ALL');
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-full sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ContactTable
            messages={messages}
            isLoading={isLoading}
            onToggleStatus={handleToggleStatus}
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

export default function ContactPage() {
  return (
    <ProtectedRoute requireRole={[AdminRole.SUPER_ADMIN, AdminRole.ADMIN]}>
      <ContactPageContent />
    </ProtectedRoute>
  );
}
