import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { getInitials } from '@/lib/utils';
import type { Metadata } from 'next';
import PortfolioCard from './PortfolioCard';
import NetworkView from './NetworkView';

export const dynamic = 'force-dynamic';

// link: external stylesheet URL (loaded via <link rel="stylesheet">)
// style: inline @font-face CSS (injected via <style>)
const FONT_DEFS: Record<string, { link?: string; style?: string; family: string }> = {
  'nanum-myeongjo':   { link: '//fonts.googleapis.com/earlyaccess/nanummyeongjo.css',                          family: "'Nanum Myeongjo', serif" },
  'mona12':           { link: 'https://cdn.jsdelivr.net/gh/MonadABXY/mona-font/web/mona.css',                  family: "'Mona12', sans-serif" },
  'school-safety':    { style: "@font-face{font-family:'SchoolSafetyHalfMoon';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2508-2@1.0/HakgyoansimBandalL.woff2') format('woff2');font-weight:normal;}",              family: "'SchoolSafetyHalfMoon', sans-serif" },
  'yoon-cho-woo-san': { style: "@font-face{font-family:'YoonChoWooSan';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408@1.0/YoonChildfundkoreaManSeh.woff2') format('woff2');font-weight:normal;font-display:swap;}", family: "'YoonChoWooSan', sans-serif" },
  'yangjin':          { style: "@font-face{font-family:'Yangjin';src:url('https://cdn.jsdelivr.net/gh/supernovice-lab/font@0.9/yangjin.woff') format('woff');font-weight:normal;font-display:swap;}",                     family: "'Yangjin', sans-serif" },
};

interface PublicPortfolioPageProps {
  params: { username: string };
}

export async function generateMetadata({ params }: PublicPortfolioPageProps): Promise<Metadata> {
  const user = await db.user.findUnique({
    where: { username: params.username },
    select: { name: true, bio: true },
  });

  if (!user) return { title: 'Portfolio Not Found' };

  return {
    title: `${user.name || params.username}'s Portfolio`,
    description: user.bio || `View ${user.name}'s portfolio`,
  };
}

export default async function PublicPortfolioPage({ params }: PublicPortfolioPageProps) {
  const user = await db.user.findUnique({
    where: { username: params.username },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      image: true,
      avatar: true,
      email: true,
      portfolioLayout: true,
      portfolioBgColor: true,
      portfolioFont: true,
      portfolioNetworkPositions: true,
    },
  });

  if (!user) notFound();

  const portfolioItems = await db.portfolio.findMany({
    where: { userId: user.id, isPublic: true },
    include: {
      project: {
        select: { id: true, title: true, description: true, coverImage: true },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  const avatarUrl = user.avatar || user.image;
  const initials = getInitials(user.name);

  const bgColor = user.portfolioBgColor || '#f9fafb';
  const fontDef = FONT_DEFS[user.portfolioFont || ''];
  const fontFamily = fontDef?.family || 'inherit';

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor, fontFamily }}>
      <style dangerouslySetInnerHTML={{ __html: `html, body { background-color: ${bgColor} !important; font-family: ${fontFamily}; }${fontDef?.style ?? ''}` }} />
      {fontDef?.link && <link rel="stylesheet" href={fontDef.link} />}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Profile hero */}
        <div className="flex flex-col items-center text-center mb-10">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user.name || user.username || ''}
              className="w-20 h-20 rounded-2xl object-cover mb-4"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4"
              style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
            >
              {initials}
            </div>
          )}
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>
            {user.name || user.username}
          </h1>
          {user.bio && (
            <p className="text-sm max-w-sm leading-relaxed" style={{ color: '#374151' }}>{user.bio}</p>
          )}
        </div>

        {/* Portfolio grid */}
        {portfolioItems.length === 0 ? (
          <div className="text-center py-16">
            <p style={{ color: '#9ca3af' }}>No public portfolio items yet</p>
          </div>
        ) : user.portfolioLayout === 'network' ? (
          <NetworkView
            lineColor={bgColor === '#f9fafb' ? '#111827' : '#ffffff'}
            savedPositions={(() => { try { return JSON.parse(user.portfolioNetworkPositions || '{}'); } catch { return {}; } })()}
            items={portfolioItems.map((item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              imageUrl: item.imageUrl,
              linkUrl: item.linkUrl,
              videoUrl: item.videoUrl,
              coverColor: item.coverColor || '#16a34a',
              tags: (() => { try { return typeof item.tags === 'string' ? JSON.parse(item.tags) : (item.tags || []); } catch { return []; } })(),
              project: item.project,
            }))}
          />
        ) : (
          <div className={
            user.portfolioLayout === 'editorial' ? 'flex flex-col gap-4' :
            user.portfolioLayout === 'book' ? 'grid grid-cols-2 gap-1' :
            'columns-2 gap-3'
          }>
            {portfolioItems.map((item, i) => (
              <PortfolioCard
                key={item.id}
                colSpan={user.portfolioLayout === 'mosaic' && (i % 7 === 0) ? 'col-span-2' : undefined}
                item={{
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  imageUrl: item.imageUrl,
                  linkUrl: item.linkUrl,
                  videoUrl: item.videoUrl,
                  coverColor: item.coverColor || '#16a34a',
                  tags: (() => { try { return typeof item.tags === 'string' ? JSON.parse(item.tags) : (item.tags || []); } catch { return []; } })(),
                  project: item.project,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-16 pb-10 text-center">
        <a
          href={`mailto:${user.email}`}
          className="text-base hover:opacity-70 transition-opacity"
          style={{ color: '#9ca3af' }}
        >
          {user.email}
        </a>
      </div>
    </div>
  );
}
