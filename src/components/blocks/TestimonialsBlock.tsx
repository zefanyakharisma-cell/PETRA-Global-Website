import Image from 'next/image';
import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

/** Testimonials from the `testimonials` entity. Carousel or grid; filterable. */
export async function TestimonialsBlock({ block, locale }: BlockComponentProps) {
  const supabase = await createClient();
  let query = supabase
    .from('testimonials')
    .select('quote,person_name,country,photo_url,program_id')
    .limit(9);

  const programId = block.config.programId as string | undefined;
  if (programId) query = query.eq('program_id', programId);

  const { data } = await query;
  const items = data ?? [];
  const onNavy = (block.config.background ?? 'navy') === 'navy';

  return (
    <Section config={{ ...block.config, background: block.config.background ?? 'navy' }}>
      <Container>
        {items.length === 0 ? (
          <EmptyState
            onDark={onNavy}
            title={locale === 'id' ? 'Belum ada testimoni' : 'No testimonials yet'}
            hint={locale === 'id' ? 'Cerita mahasiswa dan mitra akan tampil di sini.' : 'Student and partner stories will appear here.'}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <figure className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 transition duration-300 ease-out hover:-translate-y-1 hover:bg-white/[0.08] hover:ring-cyan/30">
                  <span aria-hidden className="pointer-events-none absolute -right-2 -top-4 font-editorial text-8xl leading-none text-cyan/10 transition-colors duration-300 group-hover:text-cyan/20">
                    &rdquo;
                  </span>
                  <blockquote className="relative font-editorial text-xl leading-snug text-white">
                    &ldquo;{t(item.quote as LocaleMap, locale)}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    {item.photo_url && (
                      <span className="relative h-10 w-10 overflow-hidden rounded-full">
                        <Image src={item.photo_url} alt={item.person_name} fill className="object-cover" />
                      </span>
                    )}
                    <span>
                      <span className="block font-semibold text-white">{item.person_name}</span>
                      {item.country && <span className="block text-sm text-cyan">{item.country}</span>}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
