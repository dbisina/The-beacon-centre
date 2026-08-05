// src/app/dashboard/giving/page.tsx - Giving ledger + bank accounts + projects

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  Landmark,
  FolderKanban,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { givingApi, projectsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRole } from '@/lib/types';
import { Project, formatNaira } from '@/components/forms/ProjectForm';

// ========================================
// Local types - the backend serializes BigInt money columns as strings,
// see backend/src/server.ts (BigInt.prototype.toJSON).
// ========================================

type GivingPurpose = 'TITHE' | 'OFFERING' | 'SEED' | 'PROJECT';
type GivingTransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'ABANDONED';

interface GivingTransaction {
  id: number;
  reference: string;
  email: string;
  amount: string; // kobo
  currency: string;
  purpose: GivingPurpose;
  projectId: number | null;
  project: { title: string } | null;
  anonymous: boolean;
  status: GivingTransactionStatus;
  channel: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface ChurchBankAccount {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface BankAccountFormValues {
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
  sortOrder: number;
}

const emptyBankAccountForm: BankAccountFormValues = {
  bankName: '',
  accountName: '',
  accountNumber: '',
  instructions: '',
  sortOrder: 0,
};

const TRANSACTIONS_PAGE_SIZE = 20;

const statusBadgeClass = (status: GivingTransactionStatus) => {
  switch (status) {
    case 'SUCCESS':
      return 'bg-green-100 text-green-800 border-0';
    case 'PENDING':
      return 'bg-amber-100 text-amber-800 border-0';
    case 'FAILED':
      return 'bg-red-100 text-red-800 border-0';
    case 'ABANDONED':
      return 'bg-slate-200 text-slate-700 border-0';
    default:
      return 'bg-slate-200 text-slate-700 border-0';
  }
};

function GivingPageContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('transactions');

  // Allow deep-linking to a tab, e.g. /dashboard/giving?tab=projects, without
  // pulling in useSearchParams (which requires a Suspense boundary in the
  // App Router) - a plain client-side read of window.location is enough here.
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'transactions' || tab === 'bank-accounts' || tab === 'projects') {
      setActiveTab(tab);
    }
  }, []);

  // ─── Transactions ───
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: [
      'giving-transactions',
      { page: transactionsPage, status: statusFilter, purpose: purposeFilter },
    ],
    queryFn: () =>
      givingApi.getAdminTransactions({
        page: transactionsPage,
        limit: TRANSACTIONS_PAGE_SIZE,
        status: statusFilter === 'all' ? undefined : statusFilter,
        purpose: purposeFilter === 'all' ? undefined : purposeFilter,
      }),
  });

  const transactions: GivingTransaction[] = transactionsData?.transactions || [];
  const transactionsTotal = transactionsData?.total || 0;
  const transactionsTotalPages = transactionsData?.totalPages || 1;

  // ─── Bank Accounts ───
  const [bankAccountDialogOpen, setBankAccountDialogOpen] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState<ChurchBankAccount | null>(null);
  const [bankAccountForm, setBankAccountForm] = useState<BankAccountFormValues>(emptyBankAccountForm);
  const [deleteBankAccountId, setDeleteBankAccountId] = useState<number | null>(null);

  const { data: bankAccounts, isLoading: bankAccountsLoading } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => givingApi.getBankAccounts() as Promise<ChurchBankAccount[]>,
  });

  const createBankAccountMutation = useMutation({
    mutationFn: (data: BankAccountFormValues) => givingApi.createBankAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({ title: 'Success', description: 'Bank account created successfully', variant: 'success' });
      closeBankAccountDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create bank account',
        variant: 'destructive',
      });
    },
  });

  const updateBankAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: BankAccountFormValues }) =>
      givingApi.updateBankAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({ title: 'Success', description: 'Bank account updated successfully', variant: 'success' });
      closeBankAccountDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update bank account',
        variant: 'destructive',
      });
    },
  });

  const deleteBankAccountMutation = useMutation({
    mutationFn: (id: number) => givingApi.deleteBankAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({ title: 'Success', description: 'Bank account deleted successfully', variant: 'success' });
      setDeleteBankAccountId(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete bank account',
        variant: 'destructive',
      });
    },
  });

  const openCreateBankAccountDialog = () => {
    setEditingBankAccount(null);
    setBankAccountForm(emptyBankAccountForm);
    setBankAccountDialogOpen(true);
  };

  const openEditBankAccountDialog = (account: ChurchBankAccount) => {
    setEditingBankAccount(account);
    setBankAccountForm({
      bankName: account.bankName,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      instructions: account.instructions || '',
      sortOrder: account.sortOrder,
    });
    setBankAccountDialogOpen(true);
  };

  const closeBankAccountDialog = () => {
    setBankAccountDialogOpen(false);
    setEditingBankAccount(null);
    setBankAccountForm(emptyBankAccountForm);
  };

  const handleBankAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBankAccount) {
      updateBankAccountMutation.mutate({ id: editingBankAccount.id, data: bankAccountForm });
    } else {
      createBankAccountMutation.mutate(bankAccountForm);
    }
  };

  const bankAccountSaving = createBankAccountMutation.isPending || updateBankAccountMutation.isPending;

  // ─── Projects ───
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll() as Promise<Project[]>,
  });

  const activeProjectsCount = (projects || []).filter((p) => p.isActive).length;
  const totalRaisedKobo = (projects || []).reduce((sum, p) => sum + Number(p.raisedAmount), 0);

  return (
    <div className="space-y-6 px-4 sm:px-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Giving</h1>
          <p className="text-gray-600">Manage the giving ledger, bank accounts, and projects</p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
            <Wallet className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{transactionsTotal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Bank Accounts</CardTitle>
            <Landmark className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{bankAccounts?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Projects</CardTitle>
            <FolderKanban className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeProjectsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Raised via Projects</CardTitle>
            <Wallet className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatNaira(totalRaisedKobo)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="bank-accounts">Bank Accounts</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        {/* ─── Transactions Tab ─── */}
        <TabsContent value="transactions" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Giving Ledger</CardTitle>
              <CardDescription>
                Read-only record of every giving transaction. Money records cannot be edited here.
              </CardDescription>
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setTransactionsPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="ABANDONED">Abandoned</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={purposeFilter}
                  onValueChange={(value) => {
                    setPurposeFilter(value);
                    setTransactionsPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Purposes</SelectItem>
                    <SelectItem value="TITHE">Tithe</SelectItem>
                    <SelectItem value="OFFERING">Offering</SelectItem>
                    <SelectItem value="SEED">Seed</SelectItem>
                    <SelectItem value="PROJECT">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={7}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                          No giving transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                          <TableCell>{tx.email}</TableCell>
                          <TableCell className="font-medium">{formatNaira(tx.amount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{tx.purpose}</Badge>
                          </TableCell>
                          <TableCell>{tx.project?.title || '—'}</TableCell>
                          <TableCell>
                            <Badge className={statusBadgeClass(tx.status)}>{tx.status}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(tx.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {transactionsTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-600">
                    Showing{' '}
                    <span className="font-medium">
                      {((transactionsPage - 1) * TRANSACTIONS_PAGE_SIZE) + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(transactionsPage * TRANSACTIONS_PAGE_SIZE, transactionsTotal)}
                    </span>{' '}
                    of <span className="font-medium">{transactionsTotal}</span> transactions
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTransactionsPage((p) => Math.max(1, p - 1))}
                      disabled={transactionsPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {transactionsPage} of {transactionsTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTransactionsPage((p) => Math.min(transactionsTotalPages, p + 1))}
                      disabled={transactionsPage === transactionsTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Bank Accounts Tab ─── */}
        <TabsContent value="bank-accounts" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Church Bank Accounts</CardTitle>
                <CardDescription>
                  The default manual-transfer giving options shown in the mobile app
                </CardDescription>
              </div>
              <Button onClick={openCreateBankAccountDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Bank Account
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bank</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Sort Order</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankAccountsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={5}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !bankAccounts || bankAccounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                          No bank accounts yet. Add one to show it as a giving option in the app.
                        </TableCell>
                      </TableRow>
                    ) : (
                      bankAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.bankName}</TableCell>
                          <TableCell>{account.accountName}</TableCell>
                          <TableCell className="font-mono">{account.accountNumber}</TableCell>
                          <TableCell>{account.sortOrder}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => openEditBankAccountDialog(account)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteBankAccountId(account.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
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
        </TabsContent>

        {/* ─── Projects Tab ─── */}
        <TabsContent value="projects" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Giving Projects</CardTitle>
                <CardDescription>Fundraising projects shown in the mobile app</CardDescription>
              </div>
              <Button asChild>
                <Link href="/dashboard/giving/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Target / Raised</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !projects || projects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                          No projects yet. Create one to start accepting project-designated giving.
                        </TableCell>
                      </TableRow>
                    ) : (
                      projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.title}</TableCell>
                          <TableCell className="w-[160px]">
                            <div className="space-y-1">
                              <Progress value={project.progressPct} />
                              <p className="text-xs text-gray-500">{project.progressPct}%</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="font-medium">{formatNaira(project.raisedAmount)}</span>
                              <span className="text-gray-500"> / {formatNaira(project.targetAmount)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                project.isActive
                                  ? 'bg-green-100 text-green-800 border-0'
                                  : 'bg-slate-200 text-slate-700 border-0'
                              }
                            >
                              {project.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{project.deadline ? formatDate(project.deadline) : '—'}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/giving/projects/${project.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bank Account Create/Edit Dialog */}
      <Dialog open={bankAccountDialogOpen} onOpenChange={(open) => (open ? undefined : closeBankAccountDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBankAccount ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle>
            <DialogDescription>
              This account will be shown to app users as a manual-transfer giving option.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBankAccountSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                required
                value={bankAccountForm.bankName}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, bankName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                required
                value={bankAccountForm.accountName}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                required
                value={bankAccountForm.accountNumber}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                rows={3}
                value={bankAccountForm.instructions}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, instructions: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={bankAccountForm.sortOrder}
                onChange={(e) =>
                  setBankAccountForm({ ...bankAccountForm, sortOrder: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeBankAccountDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={bankAccountSaving}>
                {bankAccountSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingBankAccount ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bank Account Delete Confirmation */}
      <AlertDialog open={deleteBankAccountId !== null} onOpenChange={() => setDeleteBankAccountId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bank Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this bank account from the giving options shown in the mobile app. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBankAccountId && deleteBankAccountMutation.mutate(deleteBankAccountId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function GivingPage() {
  return (
    <ProtectedRoute requireRole={[AdminRole.SUPER_ADMIN, AdminRole.ADMIN]}>
      <GivingPageContent />
    </ProtectedRoute>
  );
}
