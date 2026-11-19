import { useEffect, useRef, useState } from 'react';
import { Lock, Star } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { HeroSlider } from '@/components/layout/HeroSlider';
import { SimulationNote } from '@/components/feedback/SimulationNote';
import { Reveal, Stagger, StaggerItem } from '@/components/motion';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { BudayaHorizontalGallery } from '@/components/ui/BudayaHorizontalGallery';
import { Button } from '@/components/ui/Button';
import { ContactCard } from '@/components/ui/ContactCard';
import { JourneyHorizontalGallery } from '@/components/ui/JourneyLenisExperience';
import { JourneyLightbox } from '@/components/ui/JourneyStorySection';
import { SongketPattern } from '@/components/ui/SongketPattern';
import { useAuth } from '@/contexts/AuthContext';
import { PUBLIC_NAVBAR_HEIGHT, useLenisContext } from '@/contexts/LenisContext';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { AGENDA_COPY } from '@/content/site';
import { can } from '@/utils/permissions';
import {
  DEFAULT_HOME_CONTENT,
  FALLBACK_AGENDA_ITEMS,
  subscribeActiveAgenda,
  subscribeHomeContent,
} from '@/services/cmsService';
import {
  DEFAULT_HERO_SETTINGS,
  FALLBACK_CURRENT_PERIOD,
  FALLBACK_JOURNEY_ITEMS,
  fetchCurrentPeriod,
  subscribeActiveHeroSlides,
  subscribeActiveJourneyItems,
  subscribeHeroSettings,
} from '@/services/publicService';
import type {
  AgendaDoc,
  HeroSettings,
  HeroSlide,
  HomeContentDoc,
  JourneyItemDoc,
  PeriodDoc,
  PublicSettings,
} from '@/types/models';

const UNIT_STRIP_BG: Record<string, string> = {
  'maroon-700': 'g-maroon',
  'gold-400': 'g-gold',
  'maroon-500': 'bg-maroon-500',
  'gold-300': 'bg-gold-300',
  'maroon-950': 'g-dark',
};

export default function HomePage() {
  const { settings } = useOutletContext<{ settings: PublicSettings }>();
  const { user, status, role } = useAuth();
  const { scrollTo } = useLenisContext();
  const navigate = useNavigate();
  const prefersReduced = usePrefersReducedMotion();
  const aboutRef = useRef<HTMLElement>(null);

  const isActiveUser = Boolean(user && status === 'active');
  const canEditPeriods = isActiveUser && can(role, 'periods:edit');
  const canEditAgenda = isActiveUser && can(role, 'content:edit');
  const canEditJourney = isActiveUser && can(role, 'journey:edit');
  const canEditSettings = isActiveUser && can(role, 'content:edit');

  const { scrollYProgress: aboutProgress } = useScroll({
    target: aboutRef,
    offset: ['start end', 'end start'],
  });
  const aboutPhotoY = useTransform(aboutProgress, [0, 1], ['-4%', '4%']);

  const [period, setPeriod] = useState<PeriodDoc>(FALLBACK_CURRENT_PERIOD);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [heroSettings, setHeroSettings] = useState<HeroSettings>(DEFAULT_HERO_SETTINGS);
  const [journeyItems, setJourneyItems] = useState<JourneyItemDoc[]>(FALLBACK_JOURNEY_ITEMS);
  const [homeContent, setHomeContent] = useState<HomeContentDoc>(DEFAULT_HOME_CONTENT);
  const [agendaItems, setAgendaItems] = useState<AgendaDoc[]>(FALLBACK_AGENDA_ITEMS);
  const [journeyLightboxIndex, setJourneyLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'HIMASRI — Himpunan Mahasiswa Sriwijaya IT PLN';
    void fetchCurrentPeriod().then(setPeriod);
    const unsubSlides = subscribeActiveHeroSlides(setHeroSlides);
    const unsubHeroSettings = subscribeHeroSettings(setHeroSettings);
    const unsubHome = subscribeHomeContent(setHomeContent);
    const unsubJourney = subscribeActiveJourneyItems((list) => {
      setJourneyItems(list.length > 0 ? list : FALLBACK_JOURNEY_ITEMS);
    });
    return () => {
      unsubSlides();
      unsubHeroSettings();
      unsubHome();
      unsubJourney();
    };
  }, []);

  useEffect(() => {
    return subscribeActiveAgenda(setAgendaItems, period.id);
  }, [period.id]);

  const scrollToId = (id: string) => {
    scrollTo(`#${id}`, { offset: -PUBLIC_NAVBAR_HEIGHT });
  };

  const memberDestination =
    user && status === 'active'
      ? '/anggota/struktur'
      : user && status === 'pending'
        ? '/daftar/menunggu'
        : '/masuk';

  const intiTopTwo = period.inti.slice(0, 2);
  const kahim = intiTopTwo[0] ?? null;
  const wakahim = intiTopTwo[1] ?? null;
  const hasBphData = period.inti.length > 0 || period.heads.length > 0;
  const hasKahimContact = Boolean(kahim && settings.kahimWhatsapp);
  const hasWakahimContact = Boolean(wakahim && settings.wakahimWhatsapp);
  const hasAnyContact = hasKahimContact || hasWakahimContact;

  return (
    <div>
      {/* 1. Hero (Full Viewport 100svh) */}
      <section id="beranda">
        <HeroSlider
          slides={heroSlides}
          settings={heroSettings}
          heroCopy={homeContent.hero}
          periodLabel={period.label}
          intiOfficers={period.inti}
          onExploreClick={() => scrollToId('tentang')}
          onMemberClick={() => navigate(memberDestination)}
          onSeeBphClick={() => scrollToId('bph')}
        />
      </section>

      {/* 2. Tentang */}
      <section
        ref={aboutRef}
        id="tentang"
        className="g-cream border-b border-cream-200 py-16 md:py-24"
      >
        <div className="public-container grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <Reveal className="space-y-4 md:space-y-5">
              <p className="type-label font-bold uppercase tracking-[0.08em] text-maroon-700">
                {homeContent.about.title}
              </p>
              <h2 className="type-h1 leading-[1.1] md:text-4xl md:leading-[1.12] font-extrabold tracking-[-0.02em] text-ink-900">
                {homeContent.about.statement}
              </h2>
              <p className="type-body leading-7 md:type-body-lg text-ink-600">
                {homeContent.about.leftLead}
              </p>
              <p className="type-body leading-7 text-ink-900">{homeContent.about.paragraph}</p>
            </Reveal>

            <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {homeContent.about.pillars.map((pillar, idx) => (
                <StaggerItem key={pillar.id} className="h-full">
                  <div
                    className={[
                      'h-full rounded-lg p-5 flex flex-col justify-between gap-2',
                      idx === 0
                        ? 'g-maroon text-cream-50 shadow-block'
                        : 'bg-white border border-cream-200 text-ink-900 shadow-card',
                    ].join(' ')}
                  >
                    <h3
                      className={[
                        'type-body-lg leading-6 font-bold',
                        idx === 0 ? 'text-gold-300' : 'text-ink-900',
                      ].join(' ')}
                    >
                      {pillar.title}
                    </h3>
                    <p
                      className={[
                        'type-small leading-6',
                        idx === 0 ? 'text-cream-100/85' : 'text-ink-600',
                      ].join(' ')}
                    >
                      {pillar.description}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <div className="lg:col-span-6 relative pb-6 pr-6">
            <div
              aria-hidden="true"
              className="absolute right-0 bottom-0 left-8 top-8 rounded-xl g-gold shadow-gold"
            />
            <div className="relative overflow-hidden rounded-xl shadow-block aspect-[4/3] bg-maroon-950">
              <motion.img
                src="/assets/images/budaya/ampera.webp"
                alt="Jembatan Ampera Palembang — Warisan Sumatera Selatan"
                loading="lazy"
                style={prefersReduced ? undefined : { y: aboutPhotoY, scale: 1.08 }}
                className="h-full w-full object-cover object-center will-change-transform"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Budaya Palembang — Horizontal Pinned Editorial Gallery (same component as Journey) */}
      <section id="budaya" className="bg-cream-100 border-b border-cream-200">
        <div className="public-container pt-16 pb-8 md:pt-24 md:pb-10">
          <Reveal className="max-w-3xl space-y-4 md:space-y-5">
            <p className="type-label font-bold uppercase tracking-[0.08em] text-maroon-700">
              Budaya Palembang
            </p>
            <h2 className="text-3xl leading-[1.1] md:text-5xl md:leading-[1.08] font-extrabold tracking-[-0.025em] text-ink-900">
              {homeContent.culture.title}
            </h2>
            <p className="type-body leading-7 md:type-body-lg text-ink-600 max-w-2xl">
              {homeContent.culture.description}
            </p>
          </Reveal>
        </div>

        <BudayaHorizontalGallery
          items={homeContent.culture.items}
          onCtaClick={() => scrollToId('bph')}
        />
      </section>

      {/* 4. BPH & Kontak (Compact Executive Summary + Link to /struktur) */}
      <section id="bph" className="relative overflow-hidden g-maroon text-cream-50 py-16 md:py-24">
        <SongketPattern corner="tr" opacity={0.07} />
        <div className="public-container relative z-10 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <Reveal className="max-w-2xl space-y-4 md:space-y-5">
              <p className="type-label font-bold uppercase tracking-[0.08em] text-gold-300">
                {homeContent.bph.title}
              </p>
              <h2 className="type-h1 leading-[1.1] md:text-4xl md:leading-[1.12] font-extrabold tracking-[-0.02em] text-cream-50">
                {period.label ? `Kabinet ${period.label}` : 'Struktur Kepengurusan'}
              </h2>
              <p className="type-body leading-7 md:type-body-lg text-cream-100/85">
                {homeContent.bph.description}
              </p>
            </Reveal>

            {hasBphData && (
              <Link to="/struktur" className="shrink-0">
                <Button variant="gold" pill arrowRight>
                  Lihat struktur lengkap
                </Button>
              </Link>
            )}
          </div>

          {hasBphData ? (
            <>
              {/* Pengurus Inti — Optional Group Photo + Grid */}
              <div className="rounded-xl border border-white/15 bg-maroon-950/55 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
                {period.groupPhotoUrl && (
                  <div className="lg:col-span-5 aspect-[16/10] lg:aspect-auto bg-maroon-950 overflow-hidden">
                    <img
                      src={period.groupPhotoUrl}
                      alt={`Presidium Inti Kabinet ${period.label}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div
                  className={[
                    period.groupPhotoUrl ? 'lg:col-span-7' : 'lg:col-span-12',
                    'p-5 sm:p-6 flex flex-col justify-between gap-4',
                  ].join(' ')}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3">
                    <p className="type-label font-bold uppercase tracking-[0.06em] text-gold-300">
                      Pengurus Inti
                    </p>
                    <span className="type-caption font-medium text-cream-100/75 tabular-nums">
                      {period.inti.length} pengurus
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                    {period.inti.map((officer) => (
                      <div
                        key={officer.position + officer.nama}
                        className="min-w-0 rounded-lg border border-white/10 bg-white/[0.06] p-3.5 flex items-start gap-2.5"
                      >
                        <Avatar
                          name={officer.nama}
                          photoURL={officer.photoUrl}
                          size="S"
                          className="shrink-0 mt-0.5"
                        />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="type-micro leading-4 font-semibold uppercase tracking-wider text-gold-300 line-clamp-2">
                            {officer.position}
                          </p>
                          <p className="type-small leading-5 font-bold text-cream-50 line-clamp-2">
                            {officer.nama}
                          </p>
                          <p className="type-caption leading-4 text-cream-100/75 line-clamp-1">
                            {officer.jurusan}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Departemen & Biro — Horizontal Carousel on Mobile, Spacious 3-Col Grid on Desktop (min-w 300px) */}
              {period.heads.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="type-label font-bold uppercase tracking-[0.08em] text-gold-300">
                      Departemen & Biro ({period.heads.length})
                    </p>
                    <span className="type-caption text-cream-100/70 lg:hidden">Geser untuk melihat →</span>
                  </div>

                  <div className="flex lg:grid lg:grid-cols-3 gap-4 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 snap-x snap-mandatory">
                    {period.heads.map((head) => (
                      <article
                        key={head.unit}
                        className="min-w-[300px] lg:min-w-0 shrink-0 snap-start rounded-xl overflow-hidden bg-cream-50 text-ink-900 border border-cream-200 flex flex-col"
                      >
                        <div
                          className={[
                            'h-1.5 w-full shrink-0',
                            UNIT_STRIP_BG[head.color] ?? 'g-gold',
                          ].join(' ')}
                        />
                        <div className="p-4 flex items-center gap-3.5 flex-1">
                          {head.photoUrl ? (
                            <img
                              src={head.photoUrl}
                              alt={`${head.kind === 'DEPARTEMEN' ? 'Departemen' : 'Biro'} ${head.unit}`}
                              loading="lazy"
                              className="h-16 w-20 shrink-0 rounded-md object-cover bg-cream-100"
                            />
                          ) : (
                            <Avatar
                              name={head.nama}
                              photoURL={head.leaderPhotoUrl}
                              size="M"
                              className="shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="type-micro font-bold uppercase tracking-wider text-maroon-700">
                              {head.kind === 'DEPARTEMEN' ? 'Departemen' : 'Biro'} · {head.unit}
                            </p>
                            <p className="type-app-body leading-5 font-bold text-ink-900 line-clamp-2">
                              {head.nama}
                            </p>
                            <p className="type-caption text-ink-600 truncate">
                              {head.jabatan} · {head.jurusan}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-white/15 bg-maroon-950/55 px-6 py-10 text-center space-y-3">
              <p className="type-body-lg font-bold text-cream-50">
                Susunan pengurus periode berjalan belum dipublikasikan
              </p>
              <p className="type-small text-cream-100/80 max-w-lg mx-auto">
                Data pengurus inti serta kepala departemen dan biro akan tampil di sini segera setelah diperbarui.
              </p>
              {canEditPeriods && (
                <div className="pt-2">
                  <Link to="/admin/periode">
                    <Button variant="gold" pill size="sm" arrowRight>
                      Tambahkan periode & BPH di panel
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-white/15 bg-maroon-950/60 px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 shrink-0 text-gold-300 mt-0.5" aria-hidden="true" />
              <div>
                <p className="type-app-body leading-6 font-bold text-cream-50">
                  {homeContent.bph.lockNotice}
                </p>
                <p className="mt-0.5 type-small leading-5 text-cream-100/80">
                  Data sensitif seperti NIM dan daftar anggota departemen dilindungi khusus untuk
                  anggota terverifikasi.
                </p>
              </div>
            </div>
            <Link to={memberDestination} className="shrink-0">
              <Button variant="gold" pill arrowRight>
                {user && status === 'active' ? 'Lihat di Ruang Anggota' : 'Masuk untuk melihat'}
              </Button>
            </Link>
          </div>

          {/* Kontak Kahim & Wakahim inside Maroon Block */}
          <div id="kontak" className="pt-12 md:pt-16 border-t border-white/15 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="max-w-xl">
                <p className="type-label font-bold uppercase tracking-[0.08em] text-gold-300">
                  Hubungi Kami
                </p>
                <h3 className="mt-2 type-h2 leading-[1.1] font-extrabold text-cream-50">
                  {homeContent.contact.title}
                </h3>
                <p className="mt-4 md:mt-6 type-app-body leading-6 text-cream-100/85">
                  {homeContent.contact.description}
                </p>
              </div>
              {settings.isSample && <SimulationNote variant="dark" />}
            </div>

            {hasAnyContact ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {hasKahimContact && kahim && (
                  <ContactCard
                    roleLabel={kahim.position || 'Ketua Himpunan'}
                    nama={kahim.nama}
                    jurusan={kahim.jurusan}
                    whatsapp={settings.kahimWhatsapp}
                    message={homeContent.contact.defaultWhatsappMessage}
                    photoUrl={kahim.photoUrl}
                  />
                )}
                {hasWakahimContact && wakahim && (
                  <ContactCard
                    roleLabel={wakahim.position || 'Wakil Ketua Himpunan'}
                    nama={wakahim.nama}
                    jurusan={wakahim.jurusan}
                    whatsapp={settings.wakahimWhatsapp}
                    message={homeContent.contact.defaultWhatsappMessage}
                    photoUrl={wakahim.photoUrl}
                  />
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-white/15 bg-maroon-950/55 px-6 py-8 text-center space-y-3">
                <p className="type-app-body font-semibold text-cream-50">
                  Kontak pengurus akan segera tersedia
                </p>
                <p className="type-small text-cream-100/80">
                  Anda tetap dapat menghubungi kami melalui email resmi {settings.email} atau Instagram {settings.instagram}.
                </p>
                {canEditSettings && (
                  <div className="pt-1">
                    <Link to="/admin/pengaturan">
                      <Button variant="gold" pill size="sm" arrowRight>
                        Atur kontak di panel
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Agenda Tahunan — Horizontal Annual Timeline (No Arbitrary Gold Card) */}
      <section id="agenda" className="g-cream border-b border-cream-200 py-16 md:py-24">
        <div className="public-container space-y-10">
          <Reveal className="max-w-2xl space-y-4">
            <p className="type-label font-bold uppercase tracking-[0.08em] text-maroon-700">
              {AGENDA_COPY.title}
            </p>
            <h2 className="type-h1 leading-[1.1] md:text-4xl md:leading-[1.12] font-extrabold tracking-[-0.02em] text-ink-900">
              {AGENDA_COPY.subtitle}
            </h2>
          </Reveal>

          {agendaItems.length > 0 ? (
            <div className="relative">
              {/* Horizontal connecting line on desktop */}
              <div
                aria-hidden="true"
                className="hidden lg:block absolute top-[18px] left-6 right-6 h-px bg-cream-300"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {agendaItems.map((item, idx) => {
                  const isHighlighted = item.highlight === true;
                  return (
                    <article key={item.id} className="relative flex flex-col gap-4">
                      {/* Timeline Node + Month/Time Label */}
                      <div className="relative z-10 flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className={[
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full type-caption font-bold tabular-nums border',
                            isHighlighted
                              ? 'bg-maroon-700 text-cream-50 border-maroon-700'
                              : 'bg-white text-maroon-700 border-cream-300',
                          ].join(' ')}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="type-label font-bold uppercase tracking-[0.06em] text-maroon-700">
                          {item.dateLabel || item.tag}
                        </span>
                      </div>

                      {/* Plain Clean Card (No glass, no random gold fill) */}
                      <div
                        className={[
                          'flex-1 rounded-xl bg-white border p-5 flex flex-col gap-3',
                          isHighlighted
                            ? 'border-maroon-700/40 ring-1 ring-maroon-700/15'
                            : 'border-cream-200',
                        ].join(' ')}
                      >
                        {item.imageUrl && (
                          <div className="aspect-[16/9] w-full overflow-hidden rounded-md bg-cream-100">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}

                        <div className="space-y-1.5">
                          {isHighlighted && (
                            <Badge variant="gold" className="mb-1">
                              <Star className="h-3 w-3" aria-hidden="true" />
                              Sorotan
                            </Badge>
                          )}
                          <h3 className="type-body-lg leading-6 font-extrabold text-ink-900">
                            {item.title}
                          </h3>
                        </div>

                        <p className="type-small leading-6 text-ink-600">{item.description}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-cream-200 bg-white px-6 py-10 text-center space-y-3">
              <p className="type-body-lg font-bold text-ink-900">
                Belum ada agenda tahunan yang dipublikasikan
              </p>
              <p className="type-small text-ink-600 max-w-lg mx-auto">
                Jadwal kegiatan dan agenda besar HIMASRI akan tampil di sini setelah ditambahkan oleh pengurus.
              </p>
              {canEditAgenda && (
                <div className="pt-2">
                  <Link to="/kelola/agenda">
                    <Button variant="primary" pill size="sm" arrowRight>
                      Tambahkan agenda di panel
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 6. Journey Mini Horizontal Pinned Gallery (4 Latest Moments) */}
      {(journeyItems.length > 0 || canEditJourney) && (
        <section id="journey" className="bg-cream-50 border-b border-cream-200">
          <div className="public-container pt-16 pb-8 md:pt-24 md:pb-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <Reveal className="max-w-2xl space-y-4 md:space-y-5">
                <p className="type-label font-bold uppercase tracking-[0.08em] text-maroon-700">
                  Sejak waktu HIMASRI
                </p>
                <h2 className="type-h1 leading-[1.1] md:text-4xl md:leading-[1.12] font-extrabold tracking-[-0.02em] text-ink-900">
                  Perjalanan HIMASRI dari masa ke masa
                </h2>
                <p className="type-body leading-7 md:type-body-lg text-ink-600">
                  Cuplikan momen terbaru kebersamaan, pengabdian, dan estafet kepengurusan mahasiswa
                  Sumatera Selatan di IT PLN.
                </p>
              </Reveal>

              {journeyItems.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <Link to="/journey">
                    <Button variant="primary" pill size="sm" arrowRight>
                      Lihat seluruh perjalanan
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {journeyItems.length > 0 ? (
            <>
              <JourneyHorizontalGallery
                items={journeyItems.slice(-4)}
                mini
                onImageClick={(idx) => setJourneyLightboxIndex(idx)}
              />

              <div className="public-container py-10 flex justify-center border-t border-cream-200">
                <Link to="/journey">
                  <Button variant="secondary" pill size="lg" arrowRight>
                    Lihat seluruh perjalanan ({journeyItems.length} momen)
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="public-container pb-16">
              <div className="rounded-xl border border-cream-200 bg-white px-6 py-10 text-center space-y-3">
                <p className="type-body-lg font-bold text-ink-900">
                  Belum ada momen perjalanan yang dipublikasikan
                </p>
                <p className="type-small text-ink-600 max-w-lg mx-auto">
                  Bagian ini tersembunyi dari pengunjung umum hingga setidaknya satu momen perjalanan ditambahkan.
                </p>
                <div className="pt-2">
                  <Link to="/kelola/journey">
                    <Button variant="primary" pill size="sm" arrowRight>
                      Tambahkan perjalanan di panel
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          <JourneyLightbox
            items={journeyItems.slice(-4)}
            activeIndex={journeyLightboxIndex}
            onClose={() => setJourneyLightboxIndex(null)}
            onSelect={setJourneyLightboxIndex}
          />
        </section>
      )}

      {/* 7. Pita CTA */}
      <section className="bg-cream-100 py-16 md:py-24">
        <div className="public-container">
          <div className="rounded-xl g-gold shadow-gold p-8 md:p-12 text-maroon-950 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <Reveal className="max-w-2xl space-y-4 md:space-y-5">
              <h2 className="text-2xl leading-[1.15] md:text-4xl md:leading-[1.1] font-extrabold text-maroon-950">
                {homeContent.ctaBand.title}
              </h2>
              <p className="type-body leading-7 text-maroon-900/90">
                {homeContent.ctaBand.description}
              </p>
            </Reveal>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link to="/masuk">
                <Button variant="primary" pill size="lg">
                  Masuk
                </Button>
              </Link>
              <Link to="/daftar">
                <Button variant="secondary" pill size="lg" arrowRight>
                  Daftar dengan kode referal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
