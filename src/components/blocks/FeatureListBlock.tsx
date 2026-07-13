import {
  Globe, GraduationCap, Users, Handshake, BookOpen, Award,
  MapPin, Plane, Building2, Heart, Lightbulb, Sparkles,
  Calendar, Mail, Compass, Star, type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { Section, Container, isDarkBg, cardSurface } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { SpotlightOverlay } from '@/components/ui/SpotlightOverlay';
import { RichText, InlineHtml, stripHtml } from '@/components/ui/RichText';
import { clsx } from '@/lib/clsx';
import { t, type LocaleMap } from '@/lib/types';
import type { BlockComponentProps } from './registry.types';

/** Curated icon set offered in the editor (kept in sync with registry.meta). */
const ICONS: Record<string, LucideIcon> = {
  globe: Globe, graduation: GraduationCap, users: Users, handshake: Handshake,
  book: BookOpen, award: Award, pin: MapPin, plane: Plane, building: Building2,
  heart: Heart, idea: Lightbulb, sparkles: Sparkles, calendar: Calendar,
  mail: Mail, compass: Compass, star: Star,
};

interface Feature {
  icon?: string;
  image_url?: string;
  title?: LocaleMap;
  body?: LocaleMap;
  href?: string;
}

interface FeatureListContent {
  heading?: LocaleMap;
  intro?: LocaleMap;
  items?: Feature[];
}

const ACCENT_TEXT: Record<string, string> = {
  magenta: 'text-magenta',
  amber: 'text-amber',
  cyan: 'text-cyan',
  blue: 'text-blue',
  red: 'text-red',
  orange: 'text-orange',
  green: 'text-green',
  yellow: 'text-yellow',
};

// Literal group-hover variants — kept as complete strings so Tailwind's JIT
// scanner emits them (dynamic `group-hover:${...}` concatenation is not seen).
const ACCENT_GROUP_HOVER: Record<string, string> = {
  magenta: 'group-hover:text-magenta',
  amber: 'group-hover:text-amber',
  cyan: 'group-hover:text-cyan',
  blue: 'group-hover:text-blue',
  red: 'group-hover:text-red',
  orange: 'group-hover:text-orange',
  green: 'group-hover:text-green',
  yellow: 'group-hover:text-yellow',
};

/** Grid of icon + title + blurb features (benefits, services, highlights). */
export function FeatureListBlock({ block, locale }: BlockComponentProps) {
  const c = block.content as FeatureListContent;
  const items = c.items ?? [];
  const columns = Math.min(Math.max(Number(block.config.columns) || 3, 1), 4);
  const accent = (block.config.accent as string) ?? 'magenta';
  const onNavy = isDarkBg(block.config.background);
  const cardStyle = block.config.cardStyle as string | undefined;
  // grid = icon over text (default) · cards = bordered tiles · inline = icon
  // beside text in rows.
  const layout = (block.config.layout as string) ?? 'grid';
  const isCards = layout === 'cards';
  const isInline = layout === 'inline';

  return (
    <Section config={block.config}>
      <Container>
        {(c.heading || c.intro) && (
          <div className="mb-10 mx-auto max-w-2xl text-center">
            {t(c.heading, locale) && (
              <Reveal>
                <InlineHtml as="h2" html={t(c.heading, locale)} className="text-4xl md:text-5xl" />
              </Reveal>
            )}
            {t(c.intro, locale) && (
              <Reveal delay={0.06}>
                <RichText html={t(c.intro, locale)} onNavy={onNavy} className={clsx('mt-4 text-lg', !onNavy && 'text-ink/70')} />
              </Reveal>
            )}
          </div>
        )}
        <div
          className={clsx(
            'grid gap-8',
            isInline ? 'sm:grid-cols-2' : 'sm:grid-cols-2',
            !isInline && columns >= 3 && 'lg:grid-cols-3',
            !isInline && columns >= 4 && 'lg:grid-cols-4',
          )}
        >
          {items.map((f, i) => {
            const Icon = ICONS[f.icon ?? ''] ?? Sparkles;
            // A feature can carry an uploaded photo *or* fall back to its icon.
            // When present the photo becomes the media — a banner above the text
            // in grid/cards, a square thumbnail beside it in the inline layout.
            const media = f.image_url ? (
              <div
                className={clsx(
                  'relative shrink-0 overflow-hidden rounded-xl bg-ink/5',
                  isInline ? 'h-20 w-20' : 'aspect-[16/10] w-full',
                )}
              >
                <Image
                  src={f.image_url}
                  alt={stripHtml(t(f.title, locale)) || 'Feature'}
                  fill
                  className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />
              </div>
            ) : (
              <span
                className={clsx(
                  'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ease-out',
                  onNavy ? 'bg-white/10 group-hover:bg-white/20' : 'bg-ink/5 group-hover:bg-ink/[0.08]',
                  'group-hover:-rotate-6 group-hover:scale-110',
                  ACCENT_TEXT[accent],
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </span>
            );
            const inner = (
              <div className={clsx('flex gap-3', isInline ? 'flex-row items-start gap-4' : 'flex-col')}>
                {media}
                <div className={clsx(isInline && 'flex-1')}>
                  <InlineHtml as="h3" html={t(f.title, locale)} fallback="Feature" className={clsx('text-xl transition-colors', f.href && ACCENT_GROUP_HOVER[accent])} />
                  {t(f.body, locale) && (
                    <RichText html={t(f.body, locale)} onNavy={onNavy} className={clsx('mt-2', !onNavy && 'text-ink/65')} />
                  )}
                </div>
              </div>
            );
            // Cards wrap each feature in a bordered tile that lifts on hover.
            // `h-full` lets every tile fill its grid cell so tiles in a row stay
            // equal height regardless of body length.
            const cardClass = isCards
              ? clsx(
                  'relative overflow-hidden h-full rounded-[var(--card-r,1rem)] p-6 transition duration-300 ease-out hover:-translate-y-1.5',
                  cardSurface(cardStyle, onNavy),
                )
              : 'transition duration-300 ease-out hover:-translate-y-1';
            return (
              <Reveal key={i} delay={i * 0.05} className={clsx(isCards && 'h-full')}>
                {f.href ? (
                  <Link href={f.href} className={clsx('group block', cardClass)}>
                    {isCards && <SpotlightOverlay hue={accent} />}
                    {inner}
                  </Link>
                ) : (
                  <div className={clsx('group', isCards ? cardClass : 'h-full')}>
                    {isCards && <SpotlightOverlay hue={accent} />}
                    {inner}
                  </div>
                )}
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
