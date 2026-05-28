import { useState, useMemo, useEffect, useCallback } from 'react';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { confirmToast } from '../lib/confirmToast';
import { useErrorHandler } from './useErrorHandler';

const mapReview = (r) => ({
  _id: r._id,
  user: { name: r.user?.name || r.user?.email || 'Khách' },
  product: { 
    name: r.product?.name || 'Sản phẩm', 
    _id: r.product?._id,
    slug: r.product?.slug,
    slugToken: r.product?.slugToken 
  },
  rating: r.rating,
  comment: r.comment,
  images: r.images || [],
  status: r.status,
  createdAt: r.createdAt,
});

const mapQuestion = (q) => ({
  _id: q._id,
  user: { name: q.user?.name || 'Khách' },
  product: { 
    name: q.product?.name || 'Sản phẩm', 
    _id: q.product?._id,
    slug: q.product?.slug,
    slugToken: q.product?.slugToken 
  },
  question: q.question,
  answer: q.answer,
  isAnswered: Boolean(q.isAnswered || q.answer),
  createdAt: q.createdAt,
});

export const useReviewsManagement = () => {
  const [activeSection, setActiveSection] = useState('reviews');
  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState('all');
  const [reviewRating, setReviewRating] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);
  const [qaFilter, setQaFilter] = useState('all');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const { handleError } = useErrorHandler();

  const fetchReviews = useCallback(async () => {
    const params = {};
    if (reviewFilter !== 'all') params.status = reviewFilter;
    const res = await axios.get('/reviews', { params: { limit: 100, ...params } });
    setReviews((res.data?.reviews || []).map(mapReview));
  }, [reviewFilter]);

  const fetchQuestions = useCallback(async () => {
    const params = { limit: 100 };
    if (qaFilter === 'answered') params.answered = 'true';
    if (qaFilter === 'unanswered') params.answered = 'false';
    const res = await axios.get('/questions', { params });
    setQuestions((res.data?.questions || []).map(mapQuestion));
  }, [qaFilter]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchReviews(), fetchQuestions()]);
    } catch (error) {
      handleError(error, { context: 'useReviewsManagement.refresh', showToast: true });
    } finally {
      setLoading(false);
    }
  }, [fetchReviews, fetchQuestions, handleError]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (reviewRating !== 'all' && r.rating !== Number(reviewRating)) return false;
      return true;
    });
  }, [reviews, reviewRating]);

  const reviewStats = useMemo(() => {
    const total = reviews.length;
    const avg = total > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / total).toFixed(1) : 0;
    const pending = reviews.filter((r) => r.status === 'pending').length;
    const hidden = reviews.filter((r) => r.status === 'hidden').length;
    return { total, avg, pending, hidden };
  }, [reviews]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (qaFilter === 'answered' && !q.isAnswered) return false;
      if (qaFilter === 'unanswered' && q.isAnswered) return false;
      return true;
    });
  }, [questions, qaFilter]);

  const updateReviewStatus = async (id, newStatus) => {
    try {
      await axios.patch(`/reviews/${id}/status`, { status: newStatus });
      setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r)));
      toast.success(`Đã chuyển trạng thái thành: ${newStatus}`);
      if (selectedReview?._id === id) setSelectedReview(null);
    } catch (error) {
      handleError(error, { context: 'useReviewsManagement.updateStatus', showToast: true });
    }
  };

  const deleteReview = (id) => {
    confirmToast('Xóa vĩnh viễn đánh giá này?', async () => {
      try {
        await axios.delete(`/reviews/${id}`);
        setReviews((prev) => prev.filter((r) => r._id !== id));
        toast.success('Đã xóa đánh giá');
        if (selectedReview?._id === id) setSelectedReview(null);
      } catch (error) {
        handleError(error, { context: 'useReviewsManagement.delete', showToast: true });
      }
    });
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedQuestion) return;
    try {
      const res = await axios.patch(`/questions/${selectedQuestion._id}/answer`, {
        answer: replyContent.trim(),
      });
      const updated = mapQuestion(res.data);
      setQuestions((prev) => prev.map((q) => (q._id === updated._id ? updated : q)));
      toast.success('Đã gửi câu trả lời');
      setSelectedQuestion(null);
      setReplyContent('');
    } catch (error) {
      handleError(error, { context: 'useReviewsManagement.submitReply', showToast: true });
    }
  };

  return {
    activeSection,
    setActiveSection,
    loading,
    reviews,
    questions,
    reviewFilter,
    setReviewFilter,
    reviewRating,
    setReviewRating,
    selectedReview,
    setSelectedReview,
    qaFilter,
    setQaFilter,
    selectedQuestion,
    setSelectedQuestion,
    replyContent,
    setReplyContent,
    filteredReviews,
    filteredQuestions,
    reviewStats,
    updateReviewStatus,
    deleteReview,
    submitReply,
    refresh,
  };
};

export default useReviewsManagement;
