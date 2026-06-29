import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { InquiryStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

const STATUSES: InquiryStatus[] = ['new', 'in_progress', 'closed'];

export default async function InquiriesAdmin() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('inquiries')
    .select('id,kind,payload,status,created_at')
    .order('created_at', { ascending: false });
  const inquiries = data ?? [];

  async function updateStatus(formData: FormData) {
    'use server';
    const supabase = await createClient();
    await supabase
      .from('inquiries')
      .update({ status: String(formData.get('status')) as InquiryStatus })
      .eq('id', String(formData.get('id')));
    revalidatePath('/admin/inquiries');
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-navy">Inquiries</h1>
      <p className="mt-1 text-ink/60">Submissions from the site. Each is also emailed to the owning staff member.</p>

      <div className="mt-6 space-y-3">
        {inquiries.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-ink/40 ring-1 ring-ink/10">No inquiries yet.</p>
        )}
        {inquiries.map((q) => {
          const p = (q.payload ?? {}) as Record<string, string>;
          return (
            <div key={q.id} className="rounded-2xl bg-white p-5 ring-1 ring-ink/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="rounded-full bg-navy px-2.5 py-0.5 text-xs font-medium uppercase text-white">{q.kind}</span>
                  <span className="ml-3 font-medium">{p.name}</span>
                  <span className="ml-2 text-ink/60">{p.email}</span>
                </div>
                <form action={updateStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={q.id} />
                  <select name="status" defaultValue={q.status} className="rounded-md border border-ink/20 px-2 py-1 text-sm">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button className="rounded-md bg-navy px-3 py-1 text-sm text-white">Save</button>
                </form>
              </div>
              {(p.country || p.institution || p.meetingDate) && (
                <p className="mt-2 text-sm text-ink/60">
                  {[p.country && `Country: ${p.country}`, p.institution && `Institution: ${p.institution}`, p.meetingDate && `Meeting: ${p.meetingDate}`].filter(Boolean).join(' · ')}
                </p>
              )}
              <p className="mt-2 whitespace-pre-wrap text-ink/80">{p.message}</p>
              <p className="mt-2 text-xs text-ink/40">{new Date(q.created_at).toLocaleString()}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
