import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/Section';
import { Cta } from '@/components/ui/Cta';

/** Branded, localized 404. */
export default async function NotFound() {
  const t = await getTranslations('notFound');
  return (
    <section className="bg-navy py-28 text-white">
      <Container narrow className="text-center">
        <p className="font-display text-8xl text-magenta">404</p>
        <h1 className="mt-2 text-4xl">{t('title')}</h1>
        <p className="mx-auto mt-4 max-w-md text-white/80">{t('body')}</p>
        <div className="mt-8 flex justify-center">
          <Cta href="/" variant="amber">{t('cta')}</Cta>
        </div>
      </Container>
    </section>
  );
}
