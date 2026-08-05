// src/app/dashboard/admin-users/page.tsx - Admin account management (SUPER_ADMIN only)

'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  ShieldCheck,
  Users,
  UserCheck,
  MoreHorizontal,
  Edit,
  Trash2,
  Power,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useAuth } from '@/contexts/authContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { adminsApi, csgsApi } from '@/lib/api';
import { AdminRole } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import {
  AdminUser,
  CsgOption,
  getApiErrorMessage,
} from '@/components/forms/AdminUserForm';

function getRoleBadge(role: AdminRole) {
  switch (role) {
    case AdminRole.SUPER_ADMIN:
      return (
        <Badge className="bg-purple-600 text-white border-0">
          Super Admin
        </Badge>
      );
    case AdminRole.ADMIN:
      return (
        <Badge className="bg-blue-600 text-white border-0">
          Admin
        </Badge>
      );
    case AdminRole.EDITOR:
      return (
        <Badge className="bg-amber-600 text-white border-0">
          Editor
        </Badge>
      );
    case AdminRole.CSG_ADMIN:
      return (
        <Badge className="bg-teal-600 text-white border-0">
          CSG Admin
        </Badge>
      );
    default:
      return <Badge variant="secondary">{role}</Badge>;
  }
}

function AdminUsersPageContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const { admin: currentAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminsApi.getAll() as Promise<AdminUser[]>,
  });

  const { data: csgs = [] } = useQuery({
    queryKey: ['csgs', 'picker'],
    queryFn: () => csgsApi.getAll() as Promise<CsgOption[]>,
  });

  const csgNameById = useMemo(() => {
    const map = new Map<number, string>();
    csgs.forEach((csg) => map.set(csg.id, csg.name));
    return map;
  }, [csgs]);

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      adminsApi.update(id, { isActive }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Admin status updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Failed to update admin status'),
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminsApi.delete(id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Admin account deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Failed to delete admin account'),
        variant: 'destructive',
      });
    },
  });

  const filteredAdmins = admins.filter((a) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return a.email.toLowerCase().includes(term) || a.name.toLowerCase().includes(term);
  });

  const totalCount = admins.length;
  const activeCount = admins.filter((a) => a.isActive).length;
  const superAdminCount = admins.filter((a) => a.role === AdminRole.SUPER_ADMIN).length;
  const csgAdminCount = admins.filter((a) => a.role === AdminRole.CSG_ADMIN).length;

  return (
    <div className="space-y-8 px-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600 mt-1">
            Create and manage admin accounts and their roles
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin-users/new">
            <Plus className="mr-2 h-4 w-4" />
            New Admin
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Super Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{superAdminCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">CSG Admins</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{csgAdminCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Admins</CardTitle>
          <CardDescription>Manage admin accounts, roles, and access</CardDescription>
          <div className="relative max-w-md pt-2">
            <Search className="absolute left-3 top-1/2 mt-1 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Community Group</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                      No admins found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdmins.map((a) => {
                    const isSelf = currentAdmin?.id === a.id;
                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{a.name}</p>
                            <p className="text-sm text-gray-500">{a.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(a.role)}</TableCell>
                        <TableCell>
                          {a.role === AdminRole.CSG_ADMIN
                            ? a.csgId
                              ? csgNameById.get(a.csgId) || `CSG #${a.csgId}`
                              : <span className="text-amber-600 text-sm">Not assigned</span>
                            : <span className="text-gray-400">N/A</span>}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={a.isActive ? 'default' : 'secondary'}
                            className={a.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                          >
                            {a.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {a.lastLogin ? formatDateTime(a.lastLogin) : 'Never'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/admin-users/${a.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleActiveMutation.mutate({ id: a.id, isActive: !a.isActive })
                                }
                              >
                                <Power className="mr-2 h-4 w-4" />
                                {a.isActive ? 'Deactivate' : 'Reactivate'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteId(a.id)}
                                disabled={isSelf}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {isSelf ? "Can't delete your own account" : 'Delete'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the admin account
              and revoke their access to the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requireRole={[AdminRole.SUPER_ADMIN]}>
      <AdminUsersPageContent />
    </ProtectedRoute>
  );
}
