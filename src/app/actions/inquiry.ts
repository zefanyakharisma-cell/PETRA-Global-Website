'use server';

import { z } from 'zod';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';

const schema = z.object({
  kind: z.enum(['student', 'partner', 'outbound']),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  message: z.string().min(1).max(4000),
  // Optional preset-specific fields, captured loosely into payload.
  country: z.string().max(120).optional(),
  institution: z.string().max(200).optional(),
  meetingDate: z.string().max(60).optional(),
  programId: z.string().uuid().optional(),
  recipientStaffId: z.string().uuid().optional(),
  // Honeypot — must stay empty.
  company: z.string().max(0).optional(),
});

export type InquiryState = { ok: boolean; error?: string };

/**
 * Inserts an inquiry and notifies the owning staff member via Resend.
 * Uses the service-role client server-side so we can also read the recipient's
 * email (not exposed to the public) and resolve the program owner.
 */
export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: 'Please check the form and try again.' };
  }
  const d = parsed.data;
  if (d.company) return { ok: true }; // honeypot tripped — silently succeed

  const supabase = createAdminClient();

  // Resolve recipient: explicit staff -> program owner -> none.
  let recipientStaffId = d.recipientStaffId ?? null;
  if (!recipientStaffId && d.programId) {
    const { data: program } = await supabase
      .from('programs')
      .select('owner_staff_id')
      .eq('id', d.programId)
      .maybeSingle();
    recipientStaffId = program?.owner_staff_id ?? null;
  }

  const payload = {
    name: d.name,
    email: d.email,
    message: d.message,
    country: d.country ?? null,
    institution: d.institution ?? null,
    meetingDate: d.meetingDate ?? null,
  };

  const { error } = await supabase.from('inquiries').insert({
    kind: d.kind,
    payload,
    program_id: d.programId ?? null,
    recipient_staff_id: recipientStaffId,
    status: 'new',
  });

  if (error) return { ok: false, error: 'Could not submit right now. Please try again.' };

  // Fire the notification (best-effort — a failed email must not fail the submit).
  try {
    await notifyStaff(supabase, recipientStaffId, d, payload);
  } catch {
    /* logged server-side via Resend dashboard; submission already persisted */
  }

  return { ok: true };
}

async function notifyStaff(
  supabase: ReturnType<typeof createAdminClient>,
  recipientStaffId: string | null,
  d: z.infer<typeof schema>,
  payload: Record<string, unknown>,
) {
  if (!process.env.RESEND_API_KEY) return;

  let to = process.env.RESEND_FROM_EMAIL ?? '';
  if (recipientStaffId) {
    const { data: staff } = await supabase
      .from('staff')
      .select('email,name')
      .eq('id', recipientStaffId)
      .maybeSingle();
    if (staff?.email) to = staff.email;
  }
  if (!to) return;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    replyTo: d.email,
    subject: `New ${d.kind} inquiry — ${d.name}`,
    text: [
      `Kind: ${d.kind}`,
      `Name: ${d.name}`,
      `Email: ${d.email}`,
      payload.country ? `Country: ${payload.country}` : '',
      payload.institution ? `Institution: ${payload.institution}` : '',
      payload.meetingDate ? `Preferred meeting: ${payload.meetingDate}` : '',
      '',
      d.message,
    ]
      .filter(Boolean)
      .join('\n'),
  });
}
