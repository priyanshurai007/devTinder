import axios from "../utils/axiosInstance";
import React, { useEffect, useState } from "react";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addFeed } from "../utils/feedSlice";
import UserCard from "./UserCard";
import { retryWithBackoff, shouldRetryAuth } from "../utils/retryUtils";

const Feed = () => {
  const dispatch = useDispatch();
  const sentinelRef = React.useRef(null);
  const feed = useSelector((store) => store.feed);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const getFeed = async (useFallback = false) => {
    setLoading(true);
    setError("");
    try {
      // If we had auth issues before, try without auth (public feed)
      if (useFallback) {
        const res = await axios.get(BASE_URL + "/search", {
          params: { limit, page },
          withCredentials: false, // Don't send auth cookie for public feed
        });
        const users = res.data?.data || res.data || [];
        if (page === 1) dispatch(addFeed(users));
        else dispatch(addFeed([...(feed || []), ...users]));
        setTotalPages(res.data.pages || 1);
        setAuthError(false);
        return;
      }

      // Try smart-feed with retry logic
      const result = await retryWithBackoff(
        async () => {
          return await axios.get(
            `${BASE_URL}/user/smart-feed?page=${page}&limit=${limit}`,
            { withCredentials: true }
          );
        },
        {
          maxRetries: 2,
          baseDelayMs: 800,
          shouldRetry: shouldRetryAuth,
        }
      );

      const users = result.data?.data || result.data || [];
      if (page === 1) dispatch(addFeed(users));
      else dispatch(addFeed([...(feed || []), ...users]));
      setTotalPages(result.data?.pages || 1);
      setAuthError(false);
    } catch (err) {
      console.error("Error fetching feed:", err);

      // If smart-feed fails with auth error, try public feed as fallback
      if (err?.response?.status === 401 && !useFallback) {
        console.log("Smart-feed auth failed, attempting fallback to public feed...");
        setAuthError(true);
        return getFeed(true);
      }

      const errorMsg =
        err?.response?.data?.message ||
        (err?.response?.status === 401
          ? "Authentication required. Please log in again."
          : "Failed to load feed. Please try again.");

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!feed || feed.length === 0) {
      getFeed();
    } else {
      setLoading(false);
    }
  }, []);
  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && page < totalPages) {
          setPage((p) => p + 1);
        }
      });
    }, { rootMargin: '200px' });

    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [sentinelRef.current, page, totalPages]);

  // Fetch additional pages when page increments
  useEffect(() => {
    if (page > 1) getFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Infinite scroll: observe sentinel to load next page
  useEffect(() => {
    const sentinel = document.getElementById("feed-sentinel");
    if (!sentinel) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isFetchingMore && page < totalPages) {
            setIsFetchingMore(true);
            setPage((p) => p + 1);
          }
        });
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );

    obs.observe(sentinel);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages, isFetchingMore, page]);

  // reset fetching flag after feed updates
  useEffect(() => {
    if (isFetchingMore) setIsFetchingMore(false);
  }, [feed]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 my-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 shadow-xl card bg-base-300 w-96 animate-pulse">
            <div className="h-64 bg-gray-600 rounded-lg"></div>
            <div className="card-body">
              <div className="h-6 bg-gray-600 rounded w-3/4"></div>
              <div className="h-4 bg-gray-600 rounded w-1/2 mt-2"></div>
              <div className="h-4 bg-gray-600 rounded w-full mt-3"></div>
              <div className="flex gap-2 mt-4">
                <div className="h-10 bg-gray-600 rounded w-1/3"></div>
                <div className="h-10 bg-gray-600 rounded w-1/3"></div>
                <div className="h-10 bg-gray-600 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-6 text-center bg-base-200 rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Feed</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          {authError && (
            <p className="text-sm text-yellow-400 mb-4">
              Showing public results. Log in again for personalized recommendations.
            </p>
          )}
          <div className="flex gap-2 justify-center">
            <button onClick={() => getFeed()} className="btn btn-primary">
              Try Again
            </button>
            {authError && (
              <button
                onClick={() => (window.location.href = "/login")}
                className="btn btn-secondary"
              >
                Log In
              </button>
            )}
          </div>
      <div ref={sentinelRef} />
        </div>
      </div>
    );
  }

  // Empty state
  if (!feed || feed.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 text-center bg-base-200 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-3">All Caught Up!</h1>
          <p className="text-gray-300 mb-6">
            You've reviewed all available profiles. Check back soon for new connections.
          </p>
          <button onClick={() => getFeed()} className="btn btn-primary">
            Refresh Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 my-5 pb-10">
      <div className="text-center text-sm text-gray-400 mb-4">
        <p>Browse developers and connect with your matches</p>
        {authError && (
          <p className="text-yellow-400 mt-2">Showing public profiles (some features limited)</p>
        )}
      </div>
      {feed.map((user) => (
        <UserCard key={user._id} user={user} />
      ))}
      <div id="feed-sentinel" className="w-full h-2"></div>
    </div>
  );
};

export default Feed;
