import { Section, Container } from '@/components/ui/Section';
import { InquiryForm } from './inquiry/InquiryForm';
import { RichText, InlineHtml } from '@/components/ui/RichText';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap, type InquiryKind } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

interface InquiryFormContent {
  heading?: LocaleMap;
  intro?: LocaleMap;
}

/**
 * Conversion block. Presets: student (notifies program owner, shows
 * "Apply via Admissions →"), partner (meeting request), outbound (internal
 * interest, no Admissions link). Anchored #inquiry so staff CTAs can deep-link.
 */
export function InquiryFormBlock({ block, locale, pageOwnerStaffId }: BlockComponentProps) {
  const c = block.content as InquiryFormContent;
  const kind = ((block.config.preset as string) ?? 'student') as InquiryKind;
  const programId = block.config.programId as string | undefined;
  const recipientStaffId = (block.config.recipientStaffId as string) || pageOwnerStaffId || undefined;
  const admissionsUrl = process.env.NEXT_PUBLIC_ADMISSIONS_URL;
  // centered (default) · split (intro beside form) · card (boxed panel).
  const layout = (block.config.layout as string) ?? 'centered';
  const onNavy = (block.config.background ?? 'navy') === 'navy';

  const header = (align: 'center' | 'left') => (
    <div className={clsx('mb-6', align === 'center' && 'text-center')}>
      <InlineHtml as="h2" html={t(c.heading, locale)} fallback={locale === 'id' ? 'Mari terhubung' : "Let's talk"} className="text-3xl md:text-4xl" />
      {t(c.intro, locale) && <RichText html={t(c.intro, locale)} onNavy={onNavy} className={clsx('mt-2', onNavy ? 'text-white/80' : 'text-ink/70')} />}
    </div>
  );

  const form = (
    <InquiryForm
      kind={kind}
      programId={programId}
      recipientStaffId={recipientStaffId}
      admissionsUrl={kind === 'student' ? admissionsUrl : undefined}
      locale={locale}
    />
  );

  if (layout === 'split') {
    return (
      <Section id="inquiry" config={{ ...block.config, background: block.config.background ?? 'navy' }}>
        <Container>
          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            <div>{header('left')}</div>
            <div>{form}</div>
          </div>
        </Container>
      </Section>
    );
  }

  if (layout === 'card') {
    return (
      <Section id="inquiry" config={{ ...block.config, background: block.config.background ?? 'navy' }}>
        <Container narrow>
          <div className={clsx('rounded-2xl p-6 md:p-10', onNavy ? 'bg-white/5 ring-1 ring-white/10' : 'bg-white shadow-lg ring-1 ring-ink/5')}>
            {header('center')}
            {form}
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section id="inquiry" config={{ ...block.config, background: block.config.background ?? 'navy' }}>
      <Container narrow>
        {header('center')}
        {form}
      </Container>
    </Section>
  );
}
