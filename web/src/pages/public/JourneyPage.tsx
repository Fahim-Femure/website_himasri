import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui/Button';
import {
  JourneyHighlightStack,
  JourneyHorizontalGallery,
  JourneyPinnedIntro,
  JourneyPinnedOutro,
} from '@/components/ui/JourneyLenisExperience';
import { JourneyLightbox, JourneyStorySkeleton } from '@/components/ui/JourneyStorySection';
import { useAuth } from '@/contexts/AuthContext';
import { useLenis } from '@/hooks/useLenis';
import { fetchAllActiveJourneyItems } from '@/services/publicService';
import type { JourneyItemDoc } from '@/types/models';
import { can } from '@/utils/permissions';

export default function JourneyPage() {
  const { user, status, role } = useAuth();
  const canEditJourney = Boolean(user && status === 'active' && can(role, 'journey:edit'));

  // Use the single shared Lenis instance from PublicLayout's LenisProvider
  const { scrollTo } = useLenis();

  const [items, setItems] = useState<JourneyItemDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Journey HIMASRI — Perjalanan dari Masa ke Masa';
    let mounted = true;
    void fetchAllActiveJourneyItems((batch) => {
      if (!mounted) return;
      setItems(batch);
      setLoading(false);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const years = useMemo(() => {
    const set = new Set<number>();
    items.forEach((i) => {
      if (typeof i.year === 'number' && !Number.isNaN(i.year)) set.add(i.year);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [items]);

  return (
    <div className="bg-cream-50 min-h-dvh">
      {/* 1. Pinned Editorial Intro (±200vh) */}
      <JourneyPinnedIntro
        totalCount={items.length}
        years={years}
        canEditJourney={canEditJourney}
      />

      {/* 2. Horizontal Pinned Gallery (Desktop) / Full-Bleed Vertical List (Mobile/PRM) */}
      {loading ? (
        <JourneyStorySkeleton index={0} />
      ) : items.length > 0 ? (
        <>
          <JourneyHorizontalGallery
            items={items}
            onImageClick={(idx) => setLightboxIndex(idx)}
            onScrollTo={scrollTo}
          />

          {/* 3. Pinned Stacked Highlight Cards */}
          <JourneyHighlightStack
            items={items}
            onSelectItem={(id) => {
              const idx = items.findIndex((i) => i.id === id);
              if (idx >= 0) setLightboxIndex(idx);
            }}
          />

          {/* 4. Giant Editorial Outro */}
          <JourneyPinnedOutro />
        </>
      ) : (
        <div className="public-container py-20">
          <EmptyState
            icon={<Compass className="h-6 w-6" />}
            title="Belum ada dokumentasi perjalanan"
            description="Foto momen perjalanan HIMASRI akan tampil di sini setelah ditambahkan oleh pengurus."
            action={
              canEditJourney ? (
                <Link to="/kelola/journey">
                  <Button variant="primary" pill size="sm" arrowRight>
                    Tambahkan perjalanan di panel
                  </Button>
                </Link>
              ) : undefined
            }
          />
        </div>
      )}

      <JourneyLightbox
        items={items}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onSelect={setLightboxIndex}
      />
    </div>
  );
}
