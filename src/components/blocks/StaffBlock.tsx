import Image from 'next/image';
import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Cta } from '@/components/ui/Cta';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

/**
 * Single mode → per-page "Talk to [name]" CTA (defaults to the page owner).
 * Directory mode → grid of the IO team (About page). Contact always routes
 * through the inquiry form (anchor #inquiry); raw mailto is never exposed.
 */
export async function StaffBlock({ block, locale, pageOwnerStaffId }: BlockComponentProps) {
  const mode = (block.config.mode as string) ?? 'single';
  const supabase = await createClient();
  const onNavy = block.config.background === 'navy';

  if (mode === 'directory') {
    const { data } = await supabase
      .from('staff')
      .select('id,name,role,area,photo_url')
      .eq('is_active', true)
      .order('name');
    const team = data ?? [];
    // grid = cards (default) · list = single-column rows.
    const dirList = (block.config.layout as string) === 'list';

    return (
      <Section config={block.config}>
        <Container>
          {team.length === 0 ? (
            <EmptyState
              onDark={onNavy}
              title={locale === 'id' ? 'Tim akan segera hadir' : 'Our team is coming soon'}
              hint={locale === 'id' ? 'Profil staf IO akan tampil di sini.' : 'IO staff profiles will appear here.'}
            />
          ) : (
            <div className={clsx(dirList ? 'mx-auto flex max-w-2xl flex-col gap-3' : 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3')}>
              {team.map((s, i) => (
                <Reveal key={s.id} delay={i * 0.05}>
                  <div className={clsx(
                    'group flex gap-4 rounded-2xl p-5 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lift',
                    onNavy ? 'bg-white/5 hover:bg-white/10' : 'bg-white ring-1 ring-ink/10 hover:ring-magenta/30',
                  )}>
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-ink/10">
                      {s.photo_url && <Image src={s.photo_url} alt={s.name} fill className="object-cover transition-transform duration-500 ease-out group-hover:scale-110" />}
                    </span>
                    <div>
                      <h3 className={clsx('text-xl', onNavy && 'text-white')}>{s.name}</h3>
                      <p className={clsx('text-sm', onNavy ? 'text-cyan' : 'text-magenta')}>{t(s.role as LocaleMap, locale)}</p>
                      <p className={clsx('text-sm', onNavy ? 'text-white/60' : 'text-ink/55')}>{t(s.area as LocaleMap, locale)}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </Section>
    );
  }

  // Single mode
  const staffId = (block.config.staffId as string) || pageOwnerStaffId;
  const { data: person } = staffId
    ? await supabase.from('staff').select('id,name,role,area,photo_url').eq('id', staffId).maybeSingle()
    : { data: null };

  return (
    <Section config={{ ...block.config, background: block.config.background ?? 'paper' }}>
      <Container narrow>
        {!person ? (
          <EmptyState
            title={locale === 'id' ? 'Kontak akan segera tersedia' : 'A contact will be assigned soon'}
            hint={locale === 'id' ? 'Tetapkan pemilik halaman di admin.' : 'Set a page owner in the admin panel.'}
          />
        ) : (
          <div className={clsx('flex flex-col items-center gap-6 rounded-2xl p-8 text-center sm:flex-row sm:text-left', onNavy ? 'bg-white/5' : 'bg-white ring-1 ring-ink/10')}>
            <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-ink/10">
              {person.photo_url && <Image src={person.photo_url} alt={person.name} fill className="object-cover" />}
            </span>
            <div className="flex-1">
              <p className="font-condensed uppercase tracking-wide text-ink/50">
                {locale === 'id' ? 'Punya pertanyaan?' : 'Have a question?'}
              </p>
              <h3 className={clsx('text-2xl', onNavy && 'text-white')}>{person.name}</h3>
              <p className={onNavy ? 'text-cyan' : 'text-magenta'}>{t(person.role as LocaleMap, locale)}</p>
            </div>
            <Cta href="#inquiry" variant="magenta">
              {locale === 'id' ? `Hubungi ${person.name.split(' ')[0]}` : `Talk to ${person.name.split(' ')[0]}`}
            </Cta>
          </div>
        )}
      </Container>
    </Section>
  );
}
