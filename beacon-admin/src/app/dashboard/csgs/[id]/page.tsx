// src/app/dashboard/csgs/[id]/page.tsx - CSG detail page (info, members, update composer)

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Loader2, Send, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { csgsApi } from '@/lib/api';
import { Csg } from '@/components/forms/CsgForm';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRole } from '@/lib/types';
import { useAuth } from '@/contexts/authContext';

interface CsgDetailPageProps {
  params: {
    id: string;
  };
}

// Mirrors backend's CsgMemberSummary (see backend/src/services/csg.service.ts)
interface CsgMemberSummary {
  id: number; // membership id
  joinedAt: string;
  appUser: {
    id: number;
    email: string | null;
    displayName: string | null;
    photoUrl: string | null;
  };
}

function UpdateComposer({ csgId }: { csgId: number }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notifyMembers, setNotifyMembers] = useState(false);
  const { toast } = useToast();

  const postUpdateMutation = useMutation({
    mutationFn: () =>
      csgsApi.postUpdate(csgId, {
        title: title.trim() || undefined,
        body: body.trim(),
        notifyMembers,
      }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Update posted successfully' });
      setTitle('');
      setBody('');
      setNotifyMembers(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to post update',
        variant: 'destructive',
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post an Update</CardTitle>
        <CardDescription>Share a message with this group&apos;s members</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="update-title">Title (Optional)</Label>
          <Input
            id="update-title"
            placeholder="Update title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="update-body">Message</Label>
          <Textarea
            id="update-body"
            placeholder="Write your update..."
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notify-members">Notify members</Label>
            <p className="text-sm text-gray-600">Send a push notification to group members</p>
          </div>
          <Switch id="notify-members" checked={notifyMembers} onCheckedChange={setNotifyMembers} />
        </div>
        <Button
          onClick={() => postUpdateMutation.mutate()}
          disabled={!body.trim() || postUpdateMutation.isPending}
        >
          {postUpdateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Post Update
        </Button>
      </CardContent>
    </Card>
  );
}

function CsgDetailPageContent({ params }: CsgDetailPageProps) {
  const csgId = parseInt(params.id);
  const { admin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [removeMembershipId, setRemoveMembershipId] = useState<number | null>(null);

  const { data: csg, isLoading: isCsgLoading, error: csgError } = useQuery({
    queryKey: ['csg', csgId],
    queryFn: () => csgsApi.getById(csgId) as Promise<Csg>,
  });

  const { data: members = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ['csg-members', csgId],
    queryFn: () => csgsApi.getAdminMembers(csgId) as Promise<CsgMemberSummary[]>,
  });

  const removeMemberMutation = useMutation({
    mutationFn: (membershipId: number) => csgsApi.removeMember(csgId, membershipId),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Member removed successfully' });
      queryClient.invalidateQueries({ queryKey: ['csg-members', csgId] });
      queryClient.invalidateQueries({ queryKey: ['csg', csgId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to remove member',
        variant: 'destructive',
      });
    },
  });

  const canEdit =
    admin?.role === 'SUPER_ADMIN' ||
    admin?.role === 'ADMIN' ||
    (admin?.role === 'CSG_ADMIN' && admin?.csgId === csgId);

  if (isCsgLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (csgError || !csg) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Community Group not found</h3>
        <p className="text-gray-500 mt-2">The group you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/csgs">Back to Community Groups</Link>
        </Button>
      </div>
    );
  }

  const formatSchedule = () => {
    if (csg.meetsOn && csg.meetingTime) return `${csg.meetsOn} · ${csg.meetingTime}`;
    if (csg.meetsOn) return csg.meetsOn;
    if (csg.meetingTime) return csg.meetingTime;
    return 'No schedule set';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/csgs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{csg.name}</h1>
            <p className="text-gray-600">Community Service Group details</p>
          </div>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href={`/dashboard/csgs/${csg.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Group
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Schedule</p>
              <p className="text-gray-900">{formatSchedule()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Members</p>
              <p className="text-gray-900">{csg.memberCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-gray-900">{csg.address || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant={csg.isActive ? 'default' : 'secondary'}>
                {csg.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          {csg.description && (
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-gray-900 whitespace-pre-wrap">{csg.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>People who have joined this group</CardDescription>
        </CardHeader>
        <CardContent>
          {isMembersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                      <Users className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                      No members yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium text-gray-900">
                        {member.appUser.displayName || 'Unnamed'}
                      </TableCell>
                      <TableCell className="text-gray-600">{member.appUser.email || '—'}</TableCell>
                      <TableCell className="text-gray-600">
                        {member.joinedAt ? format(new Date(member.joinedAt), 'MMM dd, yyyy') : '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setRemoveMembershipId(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UpdateComposer csgId={csgId} />

      <AlertDialog open={removeMembershipId !== null} onOpenChange={() => setRemoveMembershipId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the member from this Community Group. They can rejoin later from the
              mobile app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removeMembershipId) {
                  removeMemberMutation.mutate(removeMembershipId);
                  setRemoveMembershipId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CsgDetailPage({ params }: CsgDetailPageProps) {
  return (
    <ProtectedRoute requireRole={[AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.CSG_ADMIN]}>
      <CsgDetailPageContent params={params} />
    </ProtectedRoute>
  );
}
