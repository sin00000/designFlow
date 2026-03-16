import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { getInitials } from '@/lib/utils';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Globe, Sparkles } from 'lucide-react';
import { TagList } from '@/components/ui/Badge';

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
    description: user.bio || `View ${user.name}'s design portfolio on DesignFlow`,
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
    orderBy: { updatedAt: 'desc' },
  });

  const avatarUrl = user.avatar || user.image;
  const initials = getInitials(user.name);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] bg-[#0f0f0f]/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">DesignFlow</span>
          </Link>
          <Link
            href="/register"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Get started →
          </Link>
        </div>
      </div>

      {/* Hero - User bio */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center mb-12">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user.name || user.username || ''}
              className="w-24 h-24 rounded-3xl object-cover border-4 border-[#2a2a2a] mb-4 shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-xl shadow-indigo-500/20">
              {initials}
            </div>
          )}
          <h1 className="text-3xl font-bold text-white mb-1">{user.name || user.username}</h1>
          {user.username && (
            <p className="text-gray-500 text-sm mb-3">@{user.username}</p>
          )}
          {user.bio && (
            <p className="text-gray-300 text-base max-w-[480px] leading-relaxed">{user.bio}</p>
          )}
        </div>

        {/* Portfolio items */}
        {portfolioItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Globe size={28} className="text-gray-500" />
            </div>
            <p className="text-gray-500">No public portfolio items yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {portfolioItems.map((item) => (
              <div
                key={item.id}
                className="group bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-white/10 transition-all hover:-translate-y-1 hover:shadow-card-hover"
              >
                {/* Cover */}
                {item.imageUrl ? (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : item.project?.coverImage ? (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={item.project.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div
                    className="aspect-video flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${item.coverColor}44 0%, ${item.coverColor}22 100%)`,
                    }}
                  >
                    <span
                      className="text-5xl font-bold opacity-20"
                      style={{ color: item.coverColor }}
                    >
                      {item.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-white mb-2 leading-snug">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-400 leading-relaxed line-clamp-3 mb-3">
                      {item.description}
                    </p>
                  )}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 bg-white/5 text-gray-400 text-xs rounded-lg border border-white/5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] mt-16">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Sparkles size={10} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-400">Powered by DesignFlow</span>
          </div>
          <p className="text-xs text-gray-600">
            Your complete design workflow from inspiration to portfolio
          </p>
          <Link
            href="/register"
            className="inline-block mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
          >
            Create your own portfolio →
          </Link>
        </div>
      </footer>
    </div>
  );
}
