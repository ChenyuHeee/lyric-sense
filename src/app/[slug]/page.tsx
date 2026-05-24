import artists from '@/data/artists.json';
import ArtistSearch from './ArtistSearch';

export function generateStaticParams() {
  return (artists as { slug: string }[]).map((a) => ({ slug: a.slug }));
}

export default function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  // Server component - just passes slug to client component
  return <ArtistPageInner params={params} />;
}

// Separate async wrapper to unwrap params
async function ArtistPageInner({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ArtistSearch slug={slug} />;
}
