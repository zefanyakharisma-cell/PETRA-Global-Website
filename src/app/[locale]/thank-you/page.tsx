import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/Section';
import { Cta } from '@/components/ui/Cta';

export default async function ThankYouPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('thankYou');

  return (
    <section className="bg-navy py-28 text-white">
      <Container narrow className="text-center">
        <p className="font-display text-7xl text-cyan">✓</p>
        <h1 className="mt-4 text-5xl">{t('title')}</h1>
        <p className="mx-auto mt-4 max-w-md text-white/80">{t('body')}</p>
        <div className="mt-8 flex justify-center">
          <Cta href="/" variant="amber">{t('cta')}</Cta>
        </div>
      </Container>
    </section>
  );
}
