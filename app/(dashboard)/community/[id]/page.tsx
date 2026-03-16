'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, MessageCircle, FolderKanban, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import StarRating, { StarDisplay } from '@/components/ui/StarRating';
import { TagList } from '@/components/ui/Badge';
import useToast from '@/lib/hooks/use-toast';
import { cn, getInitials, formatRelativeDate } from '@/lib/utils';

export default function CommunityPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: session } = useSession();

  const [comment, setComment] = useState('');
  const [anonymousComment, setAnonymousComment] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['community-post', id],
    queryFn: () => fetch(`/api/community/${id}`).then((r) => r.json()),
  });

  const post = data?.data;

  const rateMutation = useMutation({
    mutationFn: (value: number) =>
      fetch(`/api/community/${id}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      queryClient.invalidateQueries({ queryKey: ['community-post', id] });
      queryClient.invalidateQueries({ queryKey: ['community'] });
      toast.success('Rating submitted!');
    },
  });

  const commentMutation = useMutation({
    mutationFn: (body: any) =>
      fetch(`/api/community/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      queryClient.invalidateQueries({ queryKey: ['community-post', id] });
      setComment('');
      toast.success('Comment added!');
    },
  });

  const handleComment = () => {
    if (!comment.trim()) return;
    commentMutation.mutate({ content: comment, isAnonymous: anonymousComment });
  };

  if (isLoading) {
    return (
      <div className="py-4 flex justify-center items-center min-h-[300px]">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-4 text-center">
        <p className="text-gray-400">Post not found</p>
        <Button variant="ghost" onClick={() => router.push('/community')} className="mt-4">
          Back
        </Button>
      </div>
    );
  }

  const authorName = post.isAnonymous && !post.isOwner ? 'Anonymous' : post.user?.name || 'Unknown';
  const authorAvatar = post.isAnonymous && !post.isOwner ? null : (post.user?.avatar || post.user?.image);

  return (
    <div className="py-4 space-y-4">
      {/* Back */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/community')}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-white truncate flex-1">{post.title}</h1>
      </div>

      {/* Main image */}
      <div className="rounded-2xl overflow-hidden bg-[var(--bg-secondary)]">
        <img
          src={post.imageUrl}
          alt={post.title}
          className="w-full object-cover"
          style={{ maxHeight: '400px' }}
        />
      </div>

      {/* Author + meta */}
      <div className="flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-4">
        {authorAvatar ? (
          <img src={authorAvatar} alt={authorName} className="w-10 h-10 rounded-xl object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
            {getInitials(authorName)}
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{authorName}</p>
          {post.user?.username && !post.isAnonymous && (
            <p className="text-xs text-gray-500">@{post.user.username}</p>
          )}
        </div>
        <span className="text-xs text-gray-500">{formatRelativeDate(post.createdAt)}</span>
      </div>

      {/* Description */}
      {post.description && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-4">
          <p className="text-sm text-gray-300 leading-relaxed">{post.description}</p>
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <TagList tags={post.tags} maxVisible={10} />
      )}

      {/* Project link (if viewer owns it) */}
      {post.isOwner && post.project && (
        <Link href={`/projects/${post.project.id}`}>
          <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3">
            <FolderKanban size={16} className="text-indigo-400" />
            <div>
              <p className="text-xs text-indigo-400">Based on your project</p>
              <p className="text-sm font-medium text-white">{post.project.title}</p>
            </div>
          </div>
        </Link>
      )}

      {/* Rating section */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Rating</h3>
          <StarDisplay value={post.averageRating} count={post.ratingCount} size="md" />
        </div>

        {session?.user?.id && post.userId !== session.user.id && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Rate this work</p>
            <div className="flex items-center gap-2">
              <StarRating
                value={post.userRating || 0}
                interactive
                size="lg"
                onChange={(v) => rateMutation.mutate(v)}
              />
              {post.userRating && (
                <span className="text-sm text-gray-400">You rated {post.userRating}/5</span>
              )}
            </div>
          </div>
        )}

        {!session && (
          <p className="text-xs text-gray-500">
            <Link href="/login" className="text-indigo-400">Sign in</Link> to rate this work
          </p>
        )}
      </div>

      {/* Comments */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <MessageCircle size={14} className="text-gray-400" />
          Comments ({post.comments?.length || 0})
        </h3>

        {/* Add comment */}
        {session?.user?.id ? (
          <div className="space-y-2">
            <Input
              placeholder="Share your thoughts..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
              rightIcon={
                <button onClick={handleComment} disabled={!comment.trim()}>
                  <Send
                    size={16}
                    className={cn(
                      'transition-colors',
                      comment.trim() ? 'text-indigo-400 hover:text-indigo-300' : 'text-gray-600'
                    )}
                  />
                </button>
              }
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymousComment}
                onChange={(e) => setAnonymousComment(e.target.checked)}
                className="w-3.5 h-3.5 accent-indigo-500 rounded"
              />
              <span className="text-xs text-gray-500">Comment anonymously</span>
            </label>
          </div>
        ) : (
          <Link href="/login">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] border-dashed rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">
                <span className="text-indigo-400">Sign in</span> to leave a comment
              </p>
            </div>
          </Link>
        )}

        {/* Comments list */}
        <div className="space-y-3">
          {post.comments?.map((c: any) => {
            const cAuthorName = c.isAnonymous && c.userId !== session?.user?.id
              ? 'Anonymous'
              : c.user?.name || 'Unknown';
            const cAvatar = c.isAnonymous && c.userId !== session?.user?.id ? null : (c.user?.avatar || c.user?.image);

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                {cAvatar ? (
                  <img src={cAvatar} alt={cAuthorName} className="w-7 h-7 rounded-lg object-cover flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/40 to-violet-500/40 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {getInitials(cAuthorName)}
                  </div>
                )}
                <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white">{cAuthorName}</span>
                    <span className="text-2xs text-gray-600">{formatRelativeDate(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{c.content}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
