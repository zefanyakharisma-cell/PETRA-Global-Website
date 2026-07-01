import Image from 'next/image';
import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { Cta } from '@/components/ui/Cta';
import { createClient } from '@/lib/supabase/server';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap, type Locale } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';
import { HeroCarousel, type HeroSlide } from './HeroCarousel';

interface HeroContent {
  eyebrow?: LocaleMap;
  heading?: LocaleMap;
  subcopy?: LocaleMap;
  image_url?: string;
  ctas?: { label: LocaleMap; href: string; variant?: 'magenta' | 'amber' | 'blue' | 'navy' | 'outline'; newTab?: boolean }[];
}

/** Resolve cover images for the carousel background from a chosen entity source. */
async function carouselSlides(source: string, locale: Locale, limit = 6): Promise<HeroSlide[]> {
  const supabase = await createClient();
  if (source === 'news') {
    const { data } = await supabase
      .from('news')
      .select('slug,title,cover_url,published_at')
      .not('published_at', 'is', null)
      .not('cover_url', 'is', null)
      .order('published_at', { ascending: false })
      .limit(limit);
    return (data ?? [])
      .filter((n) => n.cover_url)
      .map((n) => ({ image_url: n.cover_url as string, title: t(n.title as LocaleMap, locale), href: `/news/${n.slug}` }));
  }
  // Default: programs (featured first).
  const { data } = await supabase
    .from('programs')
    .select('slug,title,cover_url,is_featured')
    .not('cover_url', 'is', null)
    .order('is_featured', { ascending: false })
    .limit(limit);
  return (data ?? [])
    .filter((p) => p.cover_url)
    .map((p) => ({ image_url: p.cover_url as string, title: t(p.title as LocaleMap, locale), href: `/programs/${p.slug}` }));
}

/** Full-bleed hero. Staggered reveal: eyebrow -> headline -> subcopy -> CTAs. */
export async function HeroBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as HeroContent;
  const layout = (block.config.layout as string) ?? 'centered';
  const split = layout === 'split-with-image';

  // Background mode. Back-compat: when `bgType` is unset, fall back to the
  // single uploaded image if one exists (the pre-carousel behaviour).
  const bgType = (block.config.bgType as string) ?? (c.image_url ? 'image' : 'none');
  const bgSource = (block.config.bgSource as string) ?? 'programs';

  const slides = !split && bgType === 'carousel' ? await carouselSlides(bgSource, locale) : [];
  const showImageBg = !split && bgType === 'image' && !!c.image_url;
  const showCarouselBg = !split && bgType === 'carousel' && slides.length > 0;
  const hasBg = showImageBg || showCarouselBg;

  return (
    <Section
      config={{ ...block.config, background: block.config.background ?? 'navy' }}
      className="relative overflow-hidden"
    >
      {hasBg && (
        // z-0 (not negative): the section sets `relative` without a z-index, so a
        // negative-z child would slip behind the opaque section background and
        // vanish. Keep it at 0 and lift the copy to z-10 instead.
        <div className="absolute inset-0 z-0">
          {showImageBg && (
            <>
              <Image src={c.image_url!} alt="" fill priority sizes="100vw" className="object-cover" />
              {/* Directional gradient: readable copy up top, image breathes below. */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/75 to-navy/45" />
            </>
          )}
          {showCarouselBg && <HeroCarousel slides={slides} />}
        </div>
      )}
      <Container className="relative z-10">
        <div
          className={clsx(
            'grid items-center gap-10',
            split ? 'md:grid-cols-2' : 'max-w-3xl',
            layout === 'centered' && 'mx-auto text-center',
            layout === 'left' && 'text-left',
          )}
        >
          <div className={clsx(layout === 'centered' && 'flex flex-col items-center')}>
            {c.eyebrow && (
              <Reveal>
                <p className="font-condensed text-lg uppercase tracking-widest text-cyan">
                  {t(c.eyebrow, locale)}
                </p>
              </Reveal>
            )}
            <Reveal delay={0.08}>
              <h1 className="mt-3 text-5xl leading-[0.95] md:text-7xl">
                {t(c.heading, locale) || 'Headline'}
              </h1>
            </Reveal>
            {c.subcopy && (
              <Reveal delay={0.16}>
                <p className="mt-5 max-w-xl font-body text-lg text-white/85">
                  {t(c.subcopy, locale)}
                </p>
              </Reveal>
            )}
            {c.ctas && c.ctas.length > 0 && (
              <Reveal delay={0.24}>
                <div
                  className={clsx(
                    'mt-8 flex flex-wrap gap-3',
                    layout === 'centered' && 'justify-center',
                  )}
                >
                  {c.ctas.slice(0, 2).map((cta, i) => (
                    <Cta key={i} href={cta.href || '#'} variant={cta.variant || (i === 0 ? 'magenta' : 'outline')} newTab={cta.newTab}>
                      {t(cta.label, locale)}
                    </Cta>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
          {split && c.image_url && (
            <Reveal delay={0.12}>
              <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
                <Image
                  src={c.image_url}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-[800ms] ease-out group-hover:scale-105"
                />
              </div>
            </Reveal>
          )}
        </div>
      </Container>
      {hasBg && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center text-white/60"
        >
          <span className="animate-scroll-cue text-2xl leading-none">⌄</span>
        </div>
      )}
    </Section>
  );
}
