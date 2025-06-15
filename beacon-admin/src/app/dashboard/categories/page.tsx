'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  FolderOpen, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Palette,
  Hash,
  BookOpen,
  Video,
  Headphones,
  Megaphone,
  Layers,
  Tag,
  TrendingUp,
  Calendar,
  Grid3X3
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { categoriesApi } from '@/lib/api';
import { Category } from '@/lib/types';
import { formatDate } from '@/lib/utils';

// Color name mapping function
const getColorName = (hexColor: string): string => {
  const colorMap: { [key: string]: string } = {
    '#ef4444': 'Red',
    '#f97316': 'Orange',
    '#f59e0b': 'Amber',
    '#eab308': 'Yellow',
    '#84cc16': 'Lime',
    '#22c55e': 'Green',
    '#10b981': 'Emerald',
    '#14b8a6': 'Teal',
    '#06b6d4': 'Cyan',
    '#0ea5e9': 'Sky Blue',
    '#3b82f6': 'Blue',
    '#6366f1': 'Indigo',
    '#8b5cf6': 'Violet',
    '#a855f7': 'Purple',
    '#d946ef': 'Fuchsia',
    '#ec4899': 'Pink',
    '#f43f5e': 'Rose',
    '#64748b': 'Slate',
    '#374151': 'Gray',
    '#111827': 'Dark'
  };
  
  return colorMap[hexColor] || 'Custom';
};

// Enhanced Color picker component
const ColorPicker = ({ value, onChange }: { value: string; onChange: (color: string) => void }) => {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#64748b', '#374151', '#111827'
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-10 gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg ${
              value === color ? 'border-slate-800 shadow-lg scale-105' : 'border-slate-200 hover:border-slate-400'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
      <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
        <div 
          className="w-6 h-6 rounded-lg border border-slate-300 shadow-sm"
          style={{ backgroundColor: value }}
        />
        <span className="text-sm font-medium text-slate-700">Selected: {getColorName(value)}</span>
      </div>
    </div>
  );
};

// Enhanced Category form component
interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: { name: string; description: string; color: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CategoryForm = ({ category, onSubmit, onCancel, isLoading }: CategoryFormProps) => {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [color, setColor] = useState(category?.color || '#3b82f6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, color });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Category Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter category name..."
          required
          className="h-12 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter category description..."
          rows={3}
          className="border-slate-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 resize-none"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700">Category Color</Label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <DialogFooter className="space-x-3 pt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="border-slate-300 hover:bg-slate-50 rounded-xl px-6"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !name.trim()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg rounded-xl px-6"
        >
          {category ? 'Update Category' : 'Create Category'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch categories
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast({
        title: 'Success',
        description: 'Category created successfully',
        variant: 'success',
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) => 
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast({
        title: 'Success',
        description: 'Category updated successfully',
        variant: 'success',
      });
      setEditingCategory(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
        variant: 'success',
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreate = (data: { name: string; description: string; color: string }) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: { name: string; description: string; color: string }) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  // Filter categories based on search
  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white border-0 shadow-2xl rounded-2xl overflow-hidden">
            <CardContent className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Error loading categories</h3>
              <p className="text-slate-600 mb-6">{error.message}</p>
              <Button 
                onClick={() => queryClient.invalidateQueries(['categories'])} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Categories
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Organize your content with beautiful, customizable categories
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25 px-8"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-200 rounded-2xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Total Categories</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Layers className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 mb-1">{categories?.length || 0}</div>
            <p className="text-sm text-slate-500">
              All content categories
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-200 rounded-2xl hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">For Devotionals</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 mb-1">5</div>
            <p className="text-sm text-slate-500">
              Used in devotionals
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-200 rounded-2xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">For Sermons</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Video className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 mb-1">8</div>
            <p className="text-sm text-slate-500">
              Used in sermons
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-200 rounded-2xl hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Most Used</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 mb-1">Sunday Service</div>
            <p className="text-sm text-slate-500">
              Most popular category
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <Card className="bg-white border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-800">Manage Categories</CardTitle>
              <CardDescription className="text-slate-600 mt-2">
                Create and organize categories to better structure your content
              </CardDescription>
            </div>
          </div>
          
          {/* Search */}
          <div className="flex items-center space-x-4 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 bg-white shadow-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-150 border-b border-slate-200">
                  <TableHead className="font-semibold text-slate-700 py-4">Category</TableHead>
                  <TableHead className="font-semibold text-slate-700">Description</TableHead>
                  <TableHead className="font-semibold text-slate-700 w-[120px]">Color</TableHead>
                  <TableHead className="font-semibold text-slate-700 w-[150px]">Usage Stats</TableHead>
                  <TableHead className="font-semibold text-slate-700 w-[120px]">Created</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="hover:bg-slate-50/50 transition-colors duration-200">
                      <TableCell className="py-4">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-6 w-6 rounded-lg" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-lg" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-lg" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center space-y-6">
                        <div className="relative">
                          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/25">
                            <FolderOpen className="h-12 w-12 text-white" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                            <Plus className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="text-center space-y-2">
                          <h3 className="text-xl font-semibold text-slate-800">No categories found</h3>
                          <p className="text-slate-500 max-w-sm">Create your first category to start organizing your content effectively.</p>
                        </div>
                        <Button 
                          onClick={() => setIsCreateDialogOpen(true)}
                          size="lg" 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25 px-8"
                        >
                          <Plus className="mr-2 h-5 w-5" />
                          Create First Category
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category, index) => (
                    <TableRow 
                      key={category.id} 
                      className="hover:bg-slate-50/50 transition-colors duration-200 border-b border-slate-100 last:border-0"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-8 h-8 rounded-xl border-2 border-white shadow-lg transition-transform duration-200 hover:scale-110"
                            style={{ backgroundColor: category.color || '#3b82f6' }}
                          />
                          <div>
                            <span className="font-semibold text-slate-800">{category.name}</span>
                            <div className="flex items-center space-x-1 mt-1">
                              <Tag className="h-3 w-3 text-slate-400" />
                              <span className="text-xs text-slate-500">Category</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="max-w-xs">
                          <p className="text-slate-600 line-clamp-2">
                            {category.description || 'No description provided'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge 
                          className="font-medium border-2 shadow-sm"
                          style={{ 
                            borderColor: category.color || '#3b82f6',
                            color: category.color || '#3b82f6',
                            backgroundColor: `${category.color || '#3b82f6'}10`
                          }}
                        >
                          {getColorName(category.color || '#3b82f6')}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 rounded-lg">
                            <BookOpen className="h-3 w-3 text-blue-600" />
                            <span className="font-medium text-blue-700">12</span>
                          </div>
                          <div className="flex items-center space-x-1 px-2 py-1 bg-purple-50 rounded-lg">
                            <Video className="h-3 w-3 text-purple-600" />
                            <span className="font-medium text-purple-700">8</span>
                          </div>
                          <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 rounded-lg">
                            <Headphones className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-700">5</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span className="text-sm text-slate-600">{formatDate(category.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-9 w-9 p-0 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-xl rounded-lg">
                            <DropdownMenuLabel className="text-slate-700 font-semibold">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setEditingCategory(category)}
                              className="hover:bg-slate-50 rounded-md mx-1"
                            >
                              <Edit className="mr-2 h-4 w-4 text-blue-600" />
                              <span>Edit Category</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteId(category.id)}
                              className="text-red-600 hover:bg-red-50 rounded-md mx-1"
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
        </CardContent>
      </Card>

      {/* Create Category Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-lg">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-slate-800">Create New Category</DialogTitle>
            <DialogDescription className="text-slate-600">
              Add a new category to organize your content better and improve discoverability.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={createMutation.isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-lg">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-slate-800">Edit Category</DialogTitle>
            <DialogDescription className="text-slate-600">
              Update the category information and customize its appearance.
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onSubmit={handleUpdate}
              onCancel={() => setEditingCategory(null)}
              isLoading={updateMutation.isLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white border border-slate-200 shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-slate-800">Delete Category?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 leading-relaxed">
              Are you sure you want to delete this category? This action cannot be undone and will remove the category from all associated content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="space-x-3">
            <AlertDialogCancel className="hover:bg-slate-100 rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border-0 shadow-lg rounded-xl"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}