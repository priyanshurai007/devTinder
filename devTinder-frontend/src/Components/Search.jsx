import axios from "../utils/axiosInstance";
import { useState, useEffect } from "react";
import { BASE_URL } from "../utils/constants";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const Search = () => {
  const user = useSelector((store) => store.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [popularSkills, setPopularSkills] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const navigate = useNavigate();
  const [showRaw, setShowRaw] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dev_show_raw')) === true } catch(e){ return false }
  });
  const [lastRawResponse, setLastRawResponse] = useState(null);

  // Fetch popular skills on mount
  useEffect(() => {
    fetchPopularSkills();
  }, []);

  // Fetch suggestions while typing (debounced)
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 250); // 250ms debounce
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const fetchPopularSkills = async () => {
    try {
      const response = await axios.get(
        BASE_URL + "/search/skills/popular"
      );
      setPopularSkills(response.data.data || []);
    } catch (error) {
      console.error("Error fetching popular skills:", error);
    }
  };

  const fetchSuggestions = async (query) => {
    try {
      const response = await axios.get(
        BASE_URL + "/search/suggestions",
        {
          params: { query },
          // public endpoint — no credentials needed
        }
      );
      setSuggestions(response.data.data || {});
      if (showRaw) setLastRawResponse(response.data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const performSearch = async (page = 1) => {
    if (!searchQuery.trim()) {
      setError("Please enter a search term");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(BASE_URL + "/search", {
        params: {
          query: searchQuery,
          page,
          limit: 12,
        },
        // main search is now public-friendly; credentials optional
      });

      setResults(response.data.data || []);
      setTotalPages(response.data.pages || 0);
      setTotalResults(response.data.total || 0);
      setCurrentPage(page);
      setSuggestions([]);
  if (showRaw) setLastRawResponse(response.data);
    } catch (error) {
      const resp = error?.response?.data || {};
      const errorMsg = resp.message || "Search failed";
      const details = resp.error || resp.details || null;
      setError(details ? `${errorMsg} — ${details}` : errorMsg);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    performSearch(1);
  };

  const handleSuggestionClick = (item) => {
    // If backend returned an object with _id, open that user's profile
    if (item && typeof item === "object" && item._id) {
      navigate(`/profile/${item._id}`);
      return;
    }
    // Skill or plain text fallback: populate search box
    setSearchQuery(item);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setResults([]);
    setError("");
  };

  if (!user || !user._id) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base-100 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            🔍 Search Professionals
          </h1>
          <p className="text-gray-400">
            Find people with skills, experience, and interests matching yours
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or skills (React, Python, etc.)..."
                className="input input-bordered input-lg flex-1 bg-base-200"
              />
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Searching...
                  </>
                ) : (
                  "🔍 Search"
                )}
              </button>
            </div>

            {/* Autocomplete Suggestions */}
            {suggestions && (suggestions.names?.length > 0 || suggestions.skills?.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-base-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                    {suggestions.names && suggestions.names.length > 0 && (
                  <div className="p-3 border-b border-gray-600">
                    <p className="text-xs font-semibold text-gray-400 mb-2">
                      👤 PEOPLE
                    </p>
                    {suggestions.names.map((nameObj, idx) => (
                      <button
                        key={nameObj._id || idx}
                        type="button"
                        onClick={() => handleSuggestionClick(nameObj)}
                        className="block w-full text-left px-3 py-2 hover:bg-gray-700 rounded transition"
                      >
                        {nameObj.name || (typeof nameObj === 'string' ? nameObj : '')}
                      </button>
                    ))}
                  </div>
                )}
                {suggestions.skills && suggestions.skills.length > 0 && (
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-400 mb-2">
                      💻 SKILLS
                    </p>
                    {suggestions.skills.map((skill, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSuggestionClick(skill)}
                        className="block w-full text-left px-3 py-2 hover:bg-gray-700 rounded transition"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="alert alert-error mb-6">
            <span>❌ {error}</span>
          </div>
        )}

        {/* Results Info */}
        {results.length > 0 && (
          <div className="text-center mb-4 text-gray-400">
            Found <span className="font-bold text-primary">{totalResults}</span>{" "}
            results
          </div>
        )}

        {/* Results Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
              <p className="text-gray-400">Searching for professionals...</p>
            </div>
          </div>
        ) : results.length === 0 && !error ? (
          <div className="text-center py-12">
            <h3 className="text-2xl font-bold text-gray-400 mb-2">
              No Results Found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search terms or filters
            </p>

            {/* Popular Skills Suggestion */}
            <div className="mt-8">
              <p className="text-gray-400 mb-3">Popular Skills:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {popularSkills.slice(0, 8).map((skill) => (
                  <button
                    key={skill.name}
                    onClick={() => {
                      setSearchQuery(skill.name);
                      setCurrentPage(1);
                    }}
                    className="badge badge-primary gap-2 cursor-pointer hover:badge-secondary transition"
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((person) => (
                <div
                  key={person._id}
                  className="card bg-base-300 shadow-lg hover:shadow-xl transition"
                >
                  {/* Image */}
                  <figure className="px-4 pt-4">
                    <img
                      src={person.photoURL}
                      alt={person.firstName}
                      className="rounded-lg w-full h-48 object-cover"
                    />
                  </figure>

                  <div className="card-body">
                    {/* Name & Age */}
                    <h2 className="card-title">
                      {person.firstName} {person.lastName}
                    </h2>
                    {person.age && person.gender && (
                      <p className="text-sm text-gray-400">
                        {person.age} • {person.gender}
                      </p>
                    )}

                    {/* About */}
                    {person.about && (
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {person.about}
                      </p>
                    )}

                    {/* Skills */}
                    {person.skills && person.skills.length > 0 && (
                      <div className="my-2">
                        <p className="text-xs font-semibold text-gray-400 mb-1">
                          Skills:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {person.skills.slice(0, 4).map((skill, idx) => (
                            <span
                              key={idx}
                              className="badge badge-sm badge-primary"
                            >
                              {skill}
                            </span>
                          ))}
                          {person.skills.length > 4 && (
                            <span className="badge badge-sm badge-ghost">
                              +{person.skills.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* View Profile Button */}
                    <div className="card-actions justify-end mt-4">
                      <button
                        onClick={() => navigate(`/profile/${person._id}`)}
                        className="btn btn-sm btn-primary"
                      >
                        👁️ View Profile
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8 flex-wrap">
                <button
                  onClick={() => performSearch(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-sm"
                >
                  ← Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => performSearch(page)}
                      className={`btn btn-sm ${
                        currentPage === page ? "btn-primary" : ""
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    performSearch(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="btn btn-sm"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

          {/* Dev: Raw server response (toggle) */}
          <div className="mt-6 text-right">
            <label className="label cursor-pointer">
              <span className="label-text">Show raw server response</span>
              <input
                type="checkbox"
                className="toggle toggle-sm"
                checked={showRaw}
                onChange={(e) => {
                  setShowRaw(e.target.checked);
                  localStorage.setItem('dev_show_raw', JSON.stringify(e.target.checked));
                }}
              />
            </label>
            {showRaw && lastRawResponse && (
              <pre className="bg-base-200 p-3 rounded text-xs max-h-48 overflow-auto mt-2">{JSON.stringify(lastRawResponse, null, 2)}</pre>
            )}
          </div>
      </div>
    </div>
  );
};

export default Search;
