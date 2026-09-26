// src/app/dashboard/events/page.tsx - events list

'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarDays, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRole } from '@/lib/types';
import { eventsApi } from '@/lib/api';

// Mirrors EventsAdminService.list (backend/src/services/eventsAdmin.service.ts).
interface EventRow {
  id: number;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  locationName: string | null;
  isActive: boolean;
  rsvpEnabled: boolean;
  capacity: number | null;
  csg: { id: number; name: string } | null;
  hasForm: boolean;
  formOpen: boolean;
  going: number;
  registrations: number;
}

function when(e: EventRow) {
  if (!e.startsAt) return '—';
  const start = new Date(e.startsAt);
  return format(start, 'EEE d MMM yyyy, HH:mm');
}

function EventsList() {
  const router = useRouter();
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events-admin'],
    queryFn: () => eventsApi.list() as Promise<EventRow[]>,
  });

  const now = Date.now();
  const isPast = (e: EventRow) => {
    const end = e.endsAt ?? e.startsAt;
    return !!end && new Date(end).getTime() < now;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">Services, conferences and gatherings members can RSVP or register for</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/new">
            <Plus className="mr-2 h-4 w-4" />
            New event
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All events</CardTitle>
          <CardDescription>Newest first. Past events stay here with their responses.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>For</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-gray-500">
                      <CalendarDays className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                      No events yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((e) => {
                    const count = e.hasForm ? e.registrations : e.going;
                    const noun = e.hasForm ? 'registered' : 'going';
                    return (
                      <TableRow
                        key={e.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/dashboard/events/${e.id}`)}
                      >
                        <TableCell>
                          <div className="font-medium text-gray-900">{e.title}</div>
                          <div className="text-xs text-gray-500">{e.locationName || '—'}</div>
                        </TableCell>
                        <TableCell className="text-gray-600">{when(e)}</TableCell>
                        <TableCell className="text-gray-600">{e.csg ? e.csg.name : 'Whole church'}</TableCell>
                        <TableCell className="text-gray-600">
                          {e.hasForm || e.rsvpEnabled
                            ? `${count}${e.capacity ? ` / ${e.capacity}` : ''} ${noun}`
                            : 'No sign-up'}
                        </TableCell>
                        <TableCell>
                          {!e.isActive ? (
                            <Badge variant="secondary">Hidden</Badge>
                          ) : isPast(e) ? (
                            <Badge variant="outline">Past</Badge>
                          ) : (
                            <Badge>Upcoming</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function EventsPage() {
  return (
    <ProtectedRoute requireRole={[AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.EDITOR]}>
      <EventsList />
    </ProtectedRoute>
  );
}
