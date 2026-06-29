'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { submitInquiry, type InquiryState } from '@/app/actions/inquiry';
import { Cta } from '@/components/ui/Cta';
import type { InquiryKind, Locale } from '@/lib/types';

const initial: InquiryState = { ok: false };

function field(label: string, children: React.ReactNode) {
  return (
    <label className="block">
      <span className="mb-1 block font-condensed text-sm uppercase tracking-wide text-ink/70">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-ink focus:border-magenta';

export function InquiryForm({
  kind,
  programId,
  recipientStaffId,
  admissionsUrl,
  locale,
}: {
  kind: InquiryKind;
  programId?: string;
  recipientStaffId?: string;
  admissionsUrl?: string;
  locale: Locale;
}) {
  const [state, formAction] = useFormState(submitInquiry, initial);
  const id = locale === 'id';

  if (state.ok) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-ink/10">
        <h3 className="text-3xl text-navy">{id ? 'Terima kasih!' : 'Thank you!'}</h3>
        <p className="mt-2 text-ink/70">
          {id ? 'Pesan Anda sudah kami terima. Tim kami akan menghubungi Anda.' : 'We have your message. Our team will be in touch soon.'}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl bg-white p-6 ring-1 ring-ink/10 md:p-8">
      <input type="hidden" name="kind" value={kind} />
      {programId && <input type="hidden" name="programId" value={programId} />}
      {recipientStaffId && <input type="hidden" name="recipientStaffId" value={recipientStaffId} />}
      {/* Honeypot */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="grid gap-4 sm:grid-cols-2">
        {field(id ? 'Nama' : 'Name', <input name="name" required className={inputCls} />)}
        {field('Email', <input name="email" type="email" required className={inputCls} />)}
      </div>

      {kind === 'student' &&
        field(id ? 'Negara asal' : 'Country of origin', <input name="country" className={inputCls} />)}

      {kind === 'partner' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {field(id ? 'Institusi' : 'Institution', <input name="institution" className={inputCls} />)}
          {field(id ? 'Tanggal pertemuan' : 'Preferred meeting date', <input name="meetingDate" type="date" className={inputCls} />)}
        </div>
      )}

      {field(
        id ? 'Pesan' : 'Message',
        <textarea name="message" required rows={4} className={inputCls} />,
      )}

      {state.error && <p className="text-sm text-magenta">{state.error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton label={id ? 'Kirim' : 'Send inquiry'} />
        {kind === 'student' && admissionsUrl && (
          <Cta href={admissionsUrl} external variant="outline" className="text-navy">
            {id ? 'Daftar via Admisi →' : 'Apply via Admissions →'}
          </Cta>
        )}
      </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md bg-magenta px-6 py-3 font-condensed text-lg uppercase tracking-wide text-white transition hover:brightness-110 disabled:opacity-60"
    >
      {pending ? '…' : label}
    </button>
  );
}
