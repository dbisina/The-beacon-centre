// src/app/dashboard/notifications/page.tsx - Push notification composer

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bell, Loader2, Send, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useToast } from '@/hooks/use-toast';
import { notifyApi, csgsApi } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRole } from '@/lib/types';

// Local types - kept scoped to this page rather than centralized in lib/types.ts
interface Csg {
  id: number;
  name: string;
  isActive?: boolean;
}

type Audience = 'all' | 'topic' | 'csg';

const notificationSchema = z
  .object({
    audience: z.enum(['all', 'topic', 'csg'], {
      required_error: 'Please select an audience',
    }),
    topic: z.string().optional(),
    csgId: z.string().optional(),
    title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
    body: z.string().min(1, 'Message body is required'),
  })
  .superRefine((data, ctx) => {
    if (data.audience === 'topic' && !data.topic?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Topic is required when audience is "By topic"',
        path: ['topic'],
      });
    }
    if (data.audience === 'csg' && !data.csgId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a Community Group',
        path: ['csgId'],
      });
    }
  });

type NotificationFormData = z.infer<typeof notificationSchema>;

const defaultFormValues: NotificationFormData = {
  audience: 'all',
  topic: '',
  csgId: undefined,
  title: '',
  body: '',
};

function NotificationComposer() {
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: defaultFormValues,
  });

  const watchedValues = watch();

  const { data: csgs = [], isLoading: csgsLoading } = useQuery<Csg[]>({
    queryKey: ['csgs'],
    queryFn: () => csgsApi.getAll(),
    enabled: watchedValues.audience === 'csg',
  });

  const sendMutation = useMutation({
    mutationFn: (data: NotificationFormData) =>
      notifyApi.send({
        audience: data.audience as Audience,
        topic: data.audience === 'topic' ? data.topic : undefined,
        csgId: data.audience === 'csg' && data.csgId ? Number(data.csgId) : undefined,
        title: data.title,
        body: data.body,
      }),
    onSuccess: (result: any) => {
      const successCount = result?.successCount ?? 0;
      const totalTargeted = result?.totalTargeted ?? 0;
      const invalidCount = result?.invalidCount ?? 0;

      toast({
        title: 'Notification sent',
        description:
          `Delivered to ${successCount} of ${totalTargeted} targeted device(s).` +
          (invalidCount > 0 ? ` ${invalidCount} inactive token(s) were removed.` : ''),
      });

      reset(defaultFormValues);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to send notification',
        variant: 'destructive',
      });
    },
  });

  const isSending = sendMutation.isPending;

  const doSend = (data: NotificationFormData) => {
    sendMutation.mutate(data);
  };

  const onSubmit = (data: NotificationFormData) => {
    if (data.audience === 'all') {
      setShowConfirm(true);
      return;
    }
    doSend(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <Bell className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Push Notifications</h1>
          <p className="text-gray-600">Compose and send a push notification to app users</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audience</CardTitle>
              <CardDescription>Choose who should receive this notification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audience">Send to</Label>
                <Select
                  value={watchedValues.audience}
                  onValueChange={(value: Audience) => {
                    setValue('audience', value, { shouldValidate: true });
                    setValue('topic', '');
                    setValue('csgId', undefined);
                  }}
                >
                  <SelectTrigger id="audience">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="topic">By topic</SelectItem>
                    <SelectItem value="csg">Specific CSG</SelectItem>
                  </SelectContent>
                </Select>
                {errors.audience && <p className="text-sm text-red-600">{errors.audience.message}</p>}
              </div>

              {watchedValues.audience === 'topic' && (
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input id="topic" placeholder="e.g. announcements, live" {...register('topic')} />
                  {errors.topic && <p className="text-sm text-red-600">{errors.topic.message}</p>}
                </div>
              )}

              {watchedValues.audience === 'csg' && (
                <div className="space-y-2">
                  <Label htmlFor="csgId">Community Group</Label>
                  <Select
                    value={watchedValues.csgId}
                    onValueChange={(value: string) => setValue('csgId', value, { shouldValidate: true })}
                  >
                    <SelectTrigger id="csgId">
                      <SelectValue placeholder={csgsLoading ? 'Loading groups...' : 'Select a group'} />
                    </SelectTrigger>
                    <SelectContent>
                      {csgs.map((csg) => (
                        <SelectItem key={csg.id} value={String(csg.id)}>
                          {csg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.csgId && <p className="text-sm text-red-600">{errors.csgId.message}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Message</CardTitle>
              <CardDescription>Write the notification title and body</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Notification title..." {...register('title')} />
                {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Textarea id="body" placeholder="Notification message..." rows={5} {...register('body')} />
                {errors.body && <p className="text-sm text-red-600">{errors.body.message}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button type="submit" disabled={isSending} className="w-full">
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Notification
              </Button>
              <p className="text-sm text-gray-600">
                {watchedValues.audience === 'all' && 'This will be sent to every active device.'}
                {watchedValues.audience === 'topic' && 'Sent to devices subscribed to this topic.'}
                {watchedValues.audience === 'csg' && 'Sent to members of the selected Community Group.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <Megaphone className="h-4 w-4 text-gray-500" />
                <span>Tips</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>• Keep titles short - most devices truncate long ones.</p>
              <p>• Topics let mobile users opt in/out of categories.</p>
              <p>• Sending to "Everyone" reaches every active device, so use it sparingly.</p>
            </CardContent>
          </Card>
        </div>
      </form>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send to everyone?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a push notification to every active device across the app. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirm(false);
                handleSubmit(doSend)();
              }}
            >
              Send to Everyone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute requireRole={[AdminRole.SUPER_ADMIN, AdminRole.ADMIN]}>
      <NotificationComposer />
    </ProtectedRoute>
  );
}
