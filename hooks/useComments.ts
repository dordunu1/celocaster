import { useState, useCallback, useEffect } from 'react';
import { db } from '../lib/firebase/config';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { betService } from '../lib/services/betService';
import { Comment } from '../lib/types/bet';
import { useMiniAppContext } from './use-miniapp-context';
import toast from 'react-hot-toast';

interface UseCommentsOptions {
  user?: { fid?: string; username?: string; pfpUrl?: string };
  loadBets?: () => void;
}

export function useComments() {
  const [isPosting, setIsPosting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { context } = useMiniAppContext();

  const handleAddComment = async (betId: string) => {
    if (!commentText.trim()) return;
    if (!context?.user?.fid) {
      toast.error('Please log in to comment');
      return;
    }
    
    setIsPosting(true);
    try {
      const comment: Omit<Comment, 'id' | 'timestamp'> & { betId: string } = {
        betId,
        author: context.user.username || 'anonymous',
        content: commentText.trim(),
        pfpUrl: context.user.pfpUrl
      };
      
      await betService.addComment(comment);
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
      toast.error('Failed to add comment. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return {
    isPosting,
    commentText,
    setCommentText,
    handleAddComment
  };
} 