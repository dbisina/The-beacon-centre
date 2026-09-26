// src/app/dashboard/events/[id]/page.tsx - create or edit an event, build its
// registration form, read its responses. /dashboard/events/new creates one.

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowDown, ArrowLeft, ArrowUp, Download, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRole } from '@/lib/types';
import { csgsApi, eventsApi, EventFieldType, EventFormFieldInput } from '@/lib/api';

// ─── Shapes (mirror backend events.service.ts / eventsAdmin.service.ts) ───

interface EventDto {
  id: number;
  title: string;
  content: string;
  startsAt: string | null;
  endsAt: string | null;
  locationName: string | null;
  address: string | null;
  csgId: number | null;
  rsvpEnabled: boolean;
  capacity: number | null;
  taken: number;
  spotsLeft: number | null;
  form: {
    title: string;
    description: string | null;
    isOpen: boolean;
    closesAt: string | null;
    confirmationMessage: string | null;
    fields: Array<EventFormFieldInput & { id: number }>;
  } | null;
}

interface Responses {
  rsvps: Array<{ name: string | null; email: string | null; status: string; at: string }>;
  fields: Array<{ id: number; label: string; type: EventFieldType }>;
  registrations: Array<{ id: number; name: string | null; email: string | null; answers: Record<string, unknown>; at: string }>;
}

const FIELD_TYPES: Array<{ value: EventFieldType; label: string }> = [
  { value: 'TEXT', label: 'Short answer' },
  { value: 'TEXTAREA', label: 'Paragraph' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone number' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DATE', label: 'Date' },
  { value: 'TIME', label: 'Time' },
  { value: 'SELECT', label: 'Dropdown' },
  { value: 'RADIO', label: 'Multiple choice' },
  { value: 'CHECKBOX', label: 'Checkboxes' },
  { value: 'YES_NO', label: 'Yes / No' },
];
const CHOICE: EventFieldType[] = ['SELECT', 'RADIO', 'CHECKBOX'];

/** ISO -> the local "YYYY-MM-DDTHH:mm" a datetime-local input wants. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
/** datetime-local value (the admin's own clock) -> ISO for the API. */
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

const errorText = (e: unknown) => (e as { message?: string })?.message || 'Something went wrong';

// ─── Details ───

function DetailsTab({ event, isNew }: { event: EventDto | null; isNew: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: csgs = [] } = useQuery({
    queryKey: ['csgs'],
    queryFn: () => csgsApi.getAll() as Promise<Array<{ id: number; name: string }>>,
  });

  const [title, setTitle] = useState(event?.title ?? '');
  const [content, setContent] = useState(event?.content ?? '');
  const [startsAt, setStartsAt] = useState(toLocalInput(event?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toLocalInput(event?.endsAt ?? null));
  const [locationName, setLocationName] = useState(event?.locationName ?? '');
  const [address, setAddress] = useState(event?.address ?? '');
  const [csgId, setCsgId] = useState(event?.csgId ? String(event.csgId) : 'all');
  const [rsvpEnabled, setRsvpEnabled] = useState(event?.rsvpEnabled ?? true);
  const [capacity, setCapacity] = useState(event?.capacity ? String(event.capacity) : '');

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        content,
        startsAt: fromLocalInput(startsAt),
        endsAt: fromLocalInput(endsAt),
        locationName,
        address,
        csgId: csgId === 'all' ? null : Number(csgId),
        rsvpEnabled,
        capacity: capacity.trim() ? Number(capacity) : null,
      };
      return isNew ? eventsApi.create(payload) : eventsApi.update(event!.id, payload);
    },
    onSuccess: (data: { id: number }) => {
      toast({ title: isNew ? 'Event created' : 'Event saved' });
      queryClient.invalidateQueries({ queryKey: ['events-admin'] });
      queryClient.invalidateQueries({ queryKey: ['event', data.id] });
      if (isNew) router.replace(`/dashboard/events/${data.id}`);
    },
    onError: (e) => toast({ title: 'Could not save', description: errorText(e), variant: 'destructive' }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
        <CardDescription>
          Shown in the app&apos;s Events list and News from now until the event is over.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Youth Conference 2026" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">Description</Label>
          <Textarea id="content" rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startsAt">Starts</Label>
            <Input id="startsAt" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endsAt">Ends (optional)</Label>
            <Input id="endsAt" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locationName">Place</Label>
            <Input id="locationName" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Main auditorium" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Who is it for</Label>
            <Select value={csgId} onValueChange={setCsgId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Whole church</SelectItem>
                {csgs.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} members only
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Places (optional)</Label>
            <Input id="capacity" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="No limit" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">&quot;I&apos;m going&quot; button</p>
            <p className="text-xs text-gray-500">
              Lets members RSVP. Ignored once the event has a registration form - registering takes its place.
            </p>
          </div>
          <Switch checked={rsvpEnabled} onCheckedChange={setRsvpEnabled} />
        </div>
        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending || !title.trim() || !content.trim() || !startsAt}>
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isNew ? 'Create event' : 'Save changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Registration form builder ───

type DraftField = EventFormFieldInput & { key: string; optionsText: string };

let draftSeq = 0;
const newKey = () => `new-${++draftSeq}`;

function FormTab({ event }: { event: EventDto }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const f = event.form;
  const [title, setTitle] = useState(f?.title ?? 'Registration');
  const [description, setDescription] = useState(f?.description ?? '');
  const [confirmation, setConfirmation] = useState(f?.confirmationMessage ?? '');
  const [isOpen, setIsOpen] = useState(f?.isOpen ?? true);
  const [closesAt, setClosesAt] = useState(toLocalInput(f?.closesAt ?? null));
  const [fields, setFields] = useState<DraftField[]>(
    (f?.fields ?? []).map((x) => ({ ...x, key: String(x.id), optionsText: x.options.join('\n') })),
  );

  const patch = (key: string, change: Partial<DraftField>) =>
    setFields((all) => all.map((x) => (x.key === key ? { ...x, ...change } : x)));
  const move = (i: number, dir: -1 | 1) =>
    setFields((all) => {
      const j = i + dir;
      if (j < 0 || j >= all.length) return all;
      const next = [...all];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = useMutation({
    mutationFn: () =>
      eventsApi.saveForm(event.id, {
        title,
        description: description || null,
        confirmationMessage: confirmation || null,
        isOpen,
        closesAt: fromLocalInput(closesAt),
        fields: fields.map(({ key: _k, optionsText, ...x }) => ({
          ...x,
          options: CHOICE.includes(x.type) ? optionsText.split('\n').map((o) => o.trim()).filter(Boolean) : [],
        })),
      }),
    onSuccess: () => {
      toast({ title: 'Form saved' });
      queryClient.invalidateQueries({ queryKey: ['event', event.id] });
      queryClient.invalidateQueries({ queryKey: ['events-admin'] });
    },
    onError: (e) => toast({ title: 'Could not save the form', description: errorText(e), variant: 'destructive' }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration form</CardTitle>
        <CardDescription>
          Add questions to collect details when people sign up. Renaming a question keeps the answers already given;
          removing one hides its answers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Form title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Closes (optional)</Label>
            <Input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Intro (optional)</Label>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Message after signing up (optional)</Label>
          <Textarea rows={2} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="e.g. See you there! Bring a Bible." />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Accepting registrations</p>
            <p className="text-xs text-gray-500">Turn off to close the form without losing its answers.</p>
          </div>
          <Switch checked={isOpen} onCheckedChange={setIsOpen} />
        </div>

        <div className="space-y-3">
          {fields.length === 0 && (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-gray-500">
              No questions yet. Members will register with just their name and email.
            </p>
          )}
          {fields.map((x, i) => (
            <div key={x.key} className="space-y-3 rounded-md border p-4">
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  className="flex-1"
                  value={x.label}
                  onChange={(e) => patch(x.key, { label: e.target.value })}
                  placeholder={`Question ${i + 1}`}
                  aria-label={`Question ${i + 1} label`}
                />
                <Select value={x.type} onValueChange={(v) => patch(x.key, { type: v as EventFieldType })}>
                  <SelectTrigger className="md:w-48" aria-label="Answer type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {CHOICE.includes(x.type) && (
                <Textarea
                  rows={3}
                  value={x.optionsText}
                  onChange={(e) => patch(x.key, { optionsText: e.target.value })}
                  placeholder={'One option per line\nat least two'}
                  aria-label="Options, one per line"
                />
              )}
              <Input
                value={x.helpText ?? ''}
                onChange={(e) => patch(x.key, { helpText: e.target.value })}
                placeholder="Help text (optional)"
                aria-label="Help text"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={x.required} onCheckedChange={(v) => patch(x.key, { required: v })} />
                  Required
                </label>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === fields.length - 1} aria-label="Move down">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => setFields((all) => all.filter((y) => y.key !== x.key))}
                    aria-label="Remove question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              setFields((all) => [...all, { key: newKey(), label: '', type: 'TEXT', required: false, options: [], optionsText: '' }])
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add question
          </Button>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save form
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Responses ───

const showAnswer = (v: unknown) =>
  Array.isArray(v) ? v.join(', ') : v === true ? 'Yes' : v === false ? 'No' : v == null ? '—' : String(v);

function ResponsesTab({ event }: { event: EventDto }) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['event-responses', event.id],
    queryFn: () => eventsApi.responses(event.id) as Promise<Responses>,
  });

  async function download() {
    setDownloading(true);
    try {
      await eventsApi.downloadCsv(event.id);
    } catch (e) {
      toast({ title: 'Download failed', description: errorText(e), variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading || !data) {
    return <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin" />;
  }

  const hasForm = data.fields.length > 0 || !!event.form;
  const going = data.rsvps.filter((r) => r.status === 'GOING').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Responses</CardTitle>
          <CardDescription>
            {hasForm
              ? `${data.registrations.length} registered${event.capacity ? ` of ${event.capacity} places` : ''}`
              : `${going} going${event.capacity ? ` of ${event.capacity} places` : ''} · ${data.rsvps.length} responses`}
          </CardDescription>
        </div>
        <Button variant="outline" onClick={download} disabled={downloading}>
          {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Download CSV
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {hasForm ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                {data.fields.map((f) => (
                  <TableHead key={f.id}>{f.label}</TableHead>
                ))}
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={data.fields.length + 3} className="py-8 text-center text-gray-500">
                    No registrations yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.registrations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name || '—'}</TableCell>
                    <TableCell className="text-gray-600">{r.email || '—'}</TableCell>
                    {data.fields.map((f) => (
                      <TableCell key={f.id} className="text-gray-600">
                        {showAnswer(r.answers?.[String(f.id)])}
                      </TableCell>
                    ))}
                    <TableCell className="text-gray-600">{format(new Date(r.at), 'd MMM, HH:mm')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rsvps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-gray-500">
                    No responses yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.rsvps.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.name || '—'}</TableCell>
                    <TableCell className="text-gray-600">{r.email || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'GOING' ? 'default' : 'secondary'}>
                        {r.status === 'GOING' ? 'Going' : r.status === 'MAYBE' ? 'Maybe' : 'Not going'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{format(new Date(r.at), 'd MMM, HH:mm')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ───

function EventEditor() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === 'new';
  const id = isNew ? null : Number(params.id);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.get(id!) as Promise<EventDto>,
    enabled: !!id,
  });

  // Remount the tabs when a different event loads so local drafts reset.
  const [version, setVersion] = useState(0);
  useEffect(() => setVersion((v) => v + 1), [event?.id]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Events
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">{isNew ? 'New event' : event?.title ?? 'Event'}</h1>
      </div>

      {!isNew && isLoading ? (
        <Loader2 className="mx-auto my-10 h-8 w-8 animate-spin" />
      ) : isNew ? (
        <DetailsTab event={null} isNew />
      ) : event ? (
        <Tabs defaultValue="details" key={version}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="form">Registration form</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <DetailsTab event={event} isNew={false} />
          </TabsContent>
          <TabsContent value="form">
            <FormTab event={event} />
          </TabsContent>
          <TabsContent value="responses">
            <ResponsesTab event={event} />
          </TabsContent>
        </Tabs>
      ) : (
        <p className="py-10 text-center text-gray-500">This event could not be found.</p>
      )}
    </div>
  );
}

export default function EventPage() {
  return (
    <ProtectedRoute requireRole={[AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.EDITOR]}>
      <EventEditor />
    </ProtectedRoute>
  );
}
