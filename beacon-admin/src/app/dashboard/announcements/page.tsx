'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Plus, 
  Search, 
  Megaphone, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  AlertCircle,
  Calendar,
  Clock,
  ExternalLink,
  Image,
  Filter,
  Download,
  Upload,
  TrendingUp,
  Users,
  Star,
  Zap
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
import { announcementsApi } from '@/lib/api';
import { Announcement } from '@/lib/types';

interface AnnouncementsTableProps {
  announcements: Announcement[];
  isLoading: boolean;
  onDelete: (id: number) => void;
  onToggleActive: (id: number) => void;
}

function AnnouncementsTable({ announcements, isLoading, onDelete, onToggleActive }: AnnouncementsTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return {
          className: 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg shadow-red-500/25',
          icon: <Zap className="w-3 h-3" />
        };
      case 'MEDIUM':
        return {
          className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/25',
          icon: <Star className="w-3 h-3" />
        };
      case 'LOW':
        return {
          className: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 shadow-lg shadow-slate-500/25',
          icon: <Calendar className="w-3 h-3" />
        };
      default:
        return {
          className: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0',
          icon: <Calendar className="w-3 h-3" />
        };
    }
  };

  const isExpired = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <TableHead className="w-[100px] font-semibold text-slate-700 py-4">Preview</TableHead>
              <TableHead className="font-semibold text-slate-700">Announcement Details</TableHead>
              <TableHead className="font-semibold text-slate-700 w-[120px]">Priority</TableHead>
              <TableHead className="font-semibold text-slate-700 w-[180px]">Schedule</TableHead>
              <TableHead className="font-semibold text-slate-700 w-[100px]">Engagement</TableHead>
              <TableHead className="font-semibold text-slate-700 w-[120px]">Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/25">
                        <Megaphone className="h-12 w-12 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                        <Plus className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold text-slate-800">No announcements yet</h3>
                      <p className="text-slate-500 max-w-sm">Get started by creating your first announcement to keep your community informed.</p>
                    </div>
                    <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25 px-8">
                      <Link href="/dashboard/announcements/new">
                        <Plus className="mr-2 h-5 w-5" />
                        Create First Announcement
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((announcement, index) => (
                <TableRow 
                  key={announcement.id} 
                  className="border-b border-slate-100 last:border-0"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell className="py-4">
                    <div className="relative w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                      {announcement.imageUrl ? (
                        <>
                          <img
                            src={announcement.imageUrl}
                            alt={announcement.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200" />
                        </>
                      ) : (
                        <Image className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="max-w-[350px] space-y-2">
                      <div className="flex items-start space-x-2">
                        <h3 className="font-semibold text-slate-800 text-base leading-tight line-clamp-2">
                          {announcement.title}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {announcement.content.substring(0, 120)}...
                      </p>
                      {announcement.actionUrl && (
                        <div className="flex items-center space-x-2 pt-1">
                          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 rounded-lg">
                            <ExternalLink className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700 truncate max-w-[150px]">
                              {announcement.actionText || 'Learn More'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    {(() => {
                      const config = getPriorityConfig(announcement.priority);
                      return (
                        <Badge className={`${config.className} font-medium px-3 py-1`}>
                          <span className="flex items-center space-x-1">
                            {config.icon}
                            <span>{announcement.priority}</span>
                          </span>
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-slate-600">Started {format(new Date(announcement.startDate), 'MMM dd')}</span>
                      </div>
                      {announcement.expiryDate && (
                        <div className={`flex items-center space-x-2 text-sm ${isExpired(announcement.expiryDate) ? 'text-red-600' : 'text-slate-600'}`}>
                          <div className={`w-2 h-2 rounded-full ${isExpired(announcement.expiryDate) ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                          <span>
                            {isExpired(announcement.expiryDate) ? 'Expired' : 'Expires'} {format(new Date(announcement.expiryDate), 'MMM dd')}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 px-2 py-1 bg-slate-100 rounded-lg">
                        <Eye className="h-3 w-3 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">{announcement.viewCount}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col space-y-2">
                      <Badge 
                        variant={announcement.isActive ? 'default' : 'secondary'}
                        className={announcement.isActive 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-sm' 
                          : 'bg-slate-200 text-slate-700'
                        }
                      >
                        {announcement.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {isExpired(announcement.expiryDate) && (
                        <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 text-xs">
                          Expired
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-9 w-9 p-0 rounded-lg"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-xl rounded-lg">
                        <DropdownMenuLabel className="text-slate-700 font-semibold">Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild className="rounded-md mx-1">
                          <Link href={`/dashboard/announcements/${announcement.id}`}>
                            <Eye className="mr-2 h-4 w-4 text-blue-600" />
                            <span>View Details</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-md mx-1">
                          <Link href={`/dashboard/announcements/${announcement.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4 text-amber-600" />
                            <span>Edit</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onToggleActive(announcement.id)}
                          className="rounded-md mx-1"
                        >
                          <AlertCircle className="mr-2 h-4 w-4 text-purple-600" />
                          <span>{announcement.isActive ? 'Deactivate' : 'Activate'}</span>
                        </DropdownMenuItem>
                        {announcement.actionUrl && (
                          <DropdownMenuItem asChild className="rounded-md mx-1">
                            <a 
                              href={announcement.actionUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-4 w-4 text-green-600" />
                              <span>Visit Link</span>
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(announcement.id)}
                          className="text-red-600 rounded-md mx-1"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white border border-slate-200 shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-slate-800">Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 leading-relaxed">
              This action cannot be undone. This will permanently delete the announcement and remove it from your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="space-x-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border-0 shadow-lg"
            >
              Delete Announcement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function AnnouncementsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', { page: currentPage, search: searchTerm, limit: 20 }],
    queryFn: () => announcementsApi.getAll({
      page: currentPage,
      search: searchTerm,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => announcementsApi.delete(id),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Announcement deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete announcement',
        variant: 'destructive',
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => announcementsApi.toggleActive(id),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update status',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleToggleActive = (id: number) => {
    toggleActiveMutation.mutate(id);
  };

  const announcements = data?.announcements || [];
  const totalPages = data?.totalPages || 1;

  const activeCount = announcements.filter(a => a.isActive).length;
  const expiredCount = announcements.filter(a => 
    a.expiryDate && new Date(a.expiryDate) < new Date()
  ).length;
  const highPriorityCount = announcements.filter(a => a.priority === 'HIGH').length;
  const totalViews = announcements.reduce((sum, a) => sum + (a.viewCount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Announcements
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Keep your community informed with important updates and notices
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="lg" className="border-slate-300 rounded-xl px-6">
            <Download className="mr-2 h-5 w-5" />
            Export Data
          </Button>
          <Button 
            asChild 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25 px-8"
          >
            <Link href="/dashboard/announcements/new">
              <Plus className="mr-2 h-5 w-5" />
              New Announcement
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-200 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Total Announcements</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 mb-1">{data?.total || 0}</div>
            <p className="text-sm text-slate-500">
              Total announcements created
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-200 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Active Now</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 mb-1">{activeCount}</div>
            <p className="text-sm text-slate-500">
              Currently visible to users
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-200 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">High Priority</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 mb-1">{highPriorityCount}</div>
            <p className="text-sm text-slate-500">
              Urgent notices requiring attention
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-200 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Total Views</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 mb-1">{totalViews.toLocaleString()}</div>
            <p className="text-sm text-slate-500">
              Community engagement metrics
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-800">Manage Announcements</CardTitle>
              <CardDescription className="text-slate-600 mt-2">
                Create, edit, and manage your community announcements
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 bg-white shadow-sm"
              />
            </div>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-slate-300 rounded-xl px-6"
            >
              <Filter className="mr-2 h-5 w-5" />
              Filter & Sort
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <AnnouncementsTable
            announcements={announcements}
            isLoading={isLoading}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Showing <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> to <span className="font-medium">{Math.min(currentPage * 20, data?.total || 0)}</span> of <span className="font-medium">{data?.total || 0}</span> announcements
              </p>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-slate-300 rounded-xl px-6"
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg ${
                          currentPage === page 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-md' 
                            : 'border-slate-300'
                        }`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-slate-300 rounded-xl px-6"
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