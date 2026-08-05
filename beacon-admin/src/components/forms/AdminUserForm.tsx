// src/components/forms/AdminUserForm.tsx - Shared create/edit form for admin accounts

'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminsApi, csgsApi } from '@/lib/api';
import { AdminRole } from '@/lib/types';

// ========================================
// Local types
// ========================================
// The shared `Admin` interface in lib/types.ts mixes snake_case fields
// (is_active, last_login, etc.) that don't match what the backend actually
// returns (camelCase, see backend/src/controllers/admin.controller.ts).
// We define our own local shape here matching the real API response, and
// re-use it across the admin-users list/new/edit pages.
export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
  csgId?: number | null;
  isActive: boolean;
  lastLogin?: string | null;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CsgOption {
  id: number;
  name: string;
}

export function getApiErrorMessage(error: any, fallback: string): string {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

// ========================================
// Validation schema
// ========================================
function buildSchema(isEdit: boolean) {
  return z
    .object({
      email: isEdit
        ? z.string().optional()
        : z.string().min(1, 'Email is required').email('Please enter a valid email address'),
      password: isEdit
        ? z.string().optional()
        : z.string().min(6, 'Password must be at least 6 characters'),
      name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
      role: z.nativeEnum(AdminRole, { required_error: 'Please select a role' }),
      csgId: z.string().optional(),
      isActive: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (data.role === AdminRole.CSG_ADMIN && !data.csgId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['csgId'],
          message: 'Please select a community group for this CSG admin',
        });
      }
    });
}

type AdminUserFormValues = z.infer<ReturnType<typeof buildSchema>>;

interface AdminUserFormProps {
  isEdit: boolean;
  admin?: AdminUser;
}

export function AdminUserForm({ isEdit, admin }: AdminUserFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const schema = useMemo(() => buildSchema(isEdit), [isEdit]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdminUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: admin
      ? {
          email: admin.email,
          password: '',
          name: admin.name,
          role: admin.role,
          csgId: admin.csgId ? String(admin.csgId) : '',
          isActive: admin.isActive,
        }
      : {
          email: '',
          password: '',
          name: '',
          role: AdminRole.ADMIN,
          csgId: '',
          isActive: true,
        },
  });

  const watchedValues = watch();
  const selectedRole = watchedValues.role;

  const { data: csgs = [], isLoading: csgsLoading } = useQuery({
    queryKey: ['csgs', 'picker'],
    queryFn: () => csgsApi.getAll() as Promise<CsgOption[]>,
    enabled: selectedRole === AdminRole.CSG_ADMIN,
  });

  const createMutation = useMutation({
    mutationFn: (data: AdminUserFormValues) =>
      adminsApi.create({
        email: (data.email || '').trim(),
        password: data.password || '',
        name: data.name.trim(),
        role: data.role,
        ...(data.role === AdminRole.CSG_ADMIN && data.csgId
          ? { csgId: Number(data.csgId) }
          : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Success',
        description: 'Admin account created successfully',
      });
      router.push('/dashboard/admin-users');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Failed to create admin account'),
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: AdminUserFormValues) =>
      adminsApi.update(admin!.id, {
        name: data.name.trim(),
        role: data.role,
        isActive: data.isActive,
        ...(data.role === AdminRole.CSG_ADMIN && data.csgId
          ? { csgId: Number(data.csgId) }
          : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Success',
        description: 'Admin account updated successfully',
      });
      router.push('/dashboard/admin-users');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Failed to update admin account'),
        variant: 'destructive',
      });
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: AdminUserFormValues) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleRoleChange = (value: string) => {
    const role = value as AdminRole;
    setValue('role', role);
    if (role !== AdminRole.CSG_ADMIN) {
      setValue('csgId', '');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>
                {isEdit
                  ? 'Update this admin account\'s details'
                  : 'Create login credentials and assign a role for the new admin'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEdit && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      {...register('password')}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter admin's full name..."
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={handleRoleChange}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AdminRole.SUPER_ADMIN}>Super Admin</SelectItem>
                    <SelectItem value={AdminRole.ADMIN}>Admin</SelectItem>
                    <SelectItem value={AdminRole.EDITOR}>Editor</SelectItem>
                    <SelectItem value={AdminRole.CSG_ADMIN}>CSG Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {selectedRole === AdminRole.CSG_ADMIN && (
                <div className="space-y-2">
                  <Label htmlFor="csgId">Community Group</Label>
                  <Select
                    value={watchedValues.csgId || ''}
                    onValueChange={(value) => setValue('csgId', value)}
                  >
                    <SelectTrigger id="csgId">
                      <SelectValue
                        placeholder={csgsLoading ? 'Loading groups...' : 'Select a community group'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {csgs.map((csg) => (
                        <SelectItem key={csg.id} value={String(csg.id)}>
                          {csg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.csgId && (
                    <p className="text-sm text-red-600">{errors.csgId.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    This admin will only be able to manage their assigned community group.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isEdit ? 'Update Admin' : 'Create Admin'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>

          {isEdit && (
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Active</Label>
                    <p className="text-sm text-gray-600">
                      Inactive admins cannot log in
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={watchedValues.isActive}
                    onCheckedChange={(checked) => setValue('isActive', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                <span>Role Permissions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>&bull; <strong>Super Admin</strong>: full access, including admin management</p>
              <p>&bull; <strong>Admin</strong>: manage content, giving, prayer &amp; contact</p>
              <p>&bull; <strong>Editor</strong>: manage content only</p>
              <p>&bull; <strong>CSG Admin</strong>: manage a single assigned community group</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
