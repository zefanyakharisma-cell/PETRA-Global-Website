import { Section, Container } from '@/components/ui/Section';
import { InquiryForm } from './inquiry/InquiryForm';
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

  return (
    <Section id="inquiry" config={{ ...block.config, background: block.config.background ?? 'navy' }}>
      <Container narrow>
        <div className="mb-6 text-center">
          <h2 className="text-3xl md:text-4xl">
            {t(c.heading, locale) || (locale === 'id' ? 'Mari terhubung' : "Let's talk")}
          </h2>
          {c.intro && <p className="mt-2 text-white/80">{t(c.intro, locale)}</p>}
        </div>
        <InquiryForm
          kind={kind}
          programId={programId}
          recipientStaffId={recipientStaffId}
          admissionsUrl={kind === 'student' ? admissionsUrl : undefined}
          locale={locale}
        />
      </Container>
    </Section>
  );
}
