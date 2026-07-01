import {
  Globe, GraduationCap, Users, Handshake, BookOpen, Award,
  MapPin, Plane, Building2, Heart, Lightbulb, Sparkles,
  Calendar, Mail, Compass, Star, type LucideIcon,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Section, Container } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
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
  const onNavy = block.config.background === 'navy';

  return (
    <Section config={block.config}>
      <Container>
        {(c.heading || c.intro) && (
          <div className="mb-10 max-w-2xl">
            {c.heading && (
              <Reveal>
                <h2 className="text-4xl md:text-5xl">{t(c.heading, locale)}</h2>
              </Reveal>
            )}
            {c.intro && (
              <Reveal delay={0.06}>
                <p className={clsx('mt-4 text-lg', onNavy ? 'text-white/80' : 'text-ink/70')}>
                  {t(c.intro, locale)}
                </p>
              </Reveal>
            )}
          </div>
        )}
        <div
          className={clsx(
            'grid gap-8 sm:grid-cols-2',
            columns >= 3 && 'lg:grid-cols-3',
            columns >= 4 && 'lg:grid-cols-4',
          )}
        >
          {items.map((f, i) => {
            const Icon = ICONS[f.icon ?? ''] ?? Sparkles;
            const inner = (
              <div className="flex flex-col gap-3">
                <span
                  className={clsx(
                    'inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ease-out',
                    onNavy ? 'bg-white/10 group-hover:bg-white/20' : 'bg-ink/5 group-hover:bg-ink/[0.08]',
                    'group-hover:-rotate-6 group-hover:scale-110',
                    ACCENT_TEXT[accent],
                  )}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <h3 className={clsx('text-xl transition-colors', f.href && ACCENT_GROUP_HOVER[accent])}>
                  {t(f.title, locale) || 'Feature'}
                </h3>
                {f.body && (
                  <p className={clsx(onNavy ? 'text-white/75' : 'text-ink/65')}>{t(f.body, locale)}</p>
                )}
              </div>
            );
            return (
              <Reveal key={i} delay={i * 0.05}>
                {f.href ? (
                  <Link href={f.href} className="group block transition duration-300 ease-out hover:-translate-y-1">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
