'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CommunityCard from '@/components/cards/CommunityCard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { CommunityPost } from '@/types';

const FILTER_TABS = ['All', 'UI Design', 'Branding', 'Illustration', 'Poster', 'Motion', 'Typography'];

export default function CommunityPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchPosts = async ({ pageParam = 1 }) => {
    const params = new URLSearchParams({
      page: String(pageParam),
      limit: '12',
    });
    if (activeFilter !== 'All') {
      params.set('tag', activeFilter.toLowerCase().replace(' ', '-'));
    }
    const res = await fetch(`/api/community?${params}`);
    return res.json();
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['community', activeFilter],
    queryFn: fetchPosts,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
  });

  const posts: CommunityPost[] = data?.pages.flatMap((p) => p.data) || [];

  return (
    <div className="py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Community</h1>
          <p className="text-xs text-gray-500 mt-0.5">Explore design work &amp; share feedback</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all',
              activeFilter !== tab && 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            )}
            style={activeFilter === tab ? { background: 'var(--accent-primary)', color: '#fff', boxShadow: '0 0 12px rgba(var(--accent-primary-rgb),0.3)' } : undefined}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton rounded-2xl aspect-[4/5]" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
            <Users size={28} className="text-blue-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">No posts yet</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-[220px]">
            Be the first to share your design work and get feedback.
          </p>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {posts.map((post, i) => (
                <CommunityCard
                  key={post.id}
                  post={post}
                  onClick={() => router.push(`/community/${post.id}`)}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="secondary"
                loading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
