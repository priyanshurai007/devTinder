import axios from "../utils/axiosInstance";
import { useEffect, useState } from "react";
import { BASE_URL } from "../utils/constants";
import { useNavigate } from "react-router-dom";

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [suggestions, setSuggestions] = useState({
    names: [],
    skills: [],
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularSkills, setPopularSkills] = useState([]);

  const LIMIT = 12;
  const navigate = useNavigate();

  // Fetch popular skills on mount
  useEffect(() => {
    fetchPopularSkills();
  }, []);

  const fetchPopularSkills = async () => {
    try {
      const response = await axios.get(BASE_URL + "/search/skills/popular");
      setPopularSkills(response.data.data || []);
    } catch (error) {
      console.error("Error fetching popular skills:", error);
    }
  };

  // Fetch suggestions while typing
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        fetchSuggestions();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions({ names: [], skills: [] });
    }
  }, [searchQuery]);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(BASE_URL + "/search/suggestions", {
        params: { query: searchQuery },
      });
      // Backend returns { data: { names: [], skills: [] } }
      setSuggestions(response.data.data || { names: [], skills: [] });
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const performSearch = async (pageNum = 1) => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(BASE_URL + "/search", {
        params: {
          query: searchQuery,
          page: pageNum,
          limit: LIMIT,
        },
      });

      setResults(response.data.data);
      setTotalPages(response.data.pages);
      setPage(pageNum);
    } catch (error) {
      const resp = error?.response?.data || {};
      const errorMsg = resp.message || "Search failed";
      const details = resp.error || resp.details || null;
      setError(details ? `${errorMsg} — ${details}` : errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    performSearch(1);
    setShowSuggestions(false);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setResults([]);
    setPage(1);
  };

  const handleSuggestionClick = (suggestion, type) => {
    // If name suggestion includes an _id, navigate to that profile
    if (type === "name") {
      if (suggestion && typeof suggestion === "object" && suggestion._id) {
        navigate(`/profile/${suggestion._id}`);
        return;
      }
      setSearchQuery(suggestion);
    } else if (type === "skill") {
      setSelectedSkill(suggestion);
    }
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pink-400 mb-2">
            🔍 Search Users
          </h1>
          <p className="text-gray-400">
            Find meaningful connections by skills, name, or interests
          </p>
        </div>

        {/* Search & Filters Section */}
        <div className="bg-base-300 rounded-lg p-6 shadow-lg mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered w-full"
              />

              {/* Suggestions Dropdown */}
              {showSuggestions &&
                (suggestions.names.length > 0 ||
                  suggestions.skills.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-gray-600 rounded-lg shadow-lg z-10">
                    {suggestions.names.length > 0 && (
                      <div className="p-3 border-b border-gray-700">
                        <p className="text-xs text-gray-500 font-semibold mb-2">
                          PEOPLE
                        </p>
                        {suggestions.names.map((nameObj, idx) => (
                          <button
                            key={nameObj._id || idx}
                            onClick={() =>
                              handleSuggestionClick(nameObj, "name")
                            }
                            className="block w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm"
                          >
                            👤 {nameObj.name || (typeof nameObj === 'string' ? nameObj : '')}
                          </button>
                        ))}
                      </div>
                    )}

                    {suggestions.skills.length > 0 && (
                      <div className="p-3">
                        <p className="text-xs text-gray-500 font-semibold mb-2">
                          SKILLS
                        </p>
                        {suggestions.skills.map((skill, idx) => (
                          <button
                            key={idx}
                            onClick={() =>
                              handleSuggestionClick(skill, "skill")
                            }
                            className="block w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm"
                          >
                            💡 {skill}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Filters Grid */}
              <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="btn btn-primary flex-1"
              >
                🔍 Search
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-ghost flex-1"
              >
                ✕ Clear
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {error && (
          <div className="alert alert-error mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m2-2l2 2m-2-2l-2-2m0 0l2-2m-2 2l2 2"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            {/* Results Count */}
            <div className="mb-4 text-center">
              <p className="text-gray-400">
                Found <span className="font-bold text-pink-400">{results.length}</span> users on page{" "}
                <span className="font-bold text-pink-400">{page}</span>
              </p>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {results.map((user) => (
                <div
                  key={user._id}
                  className="card bg-base-300 shadow-lg hover:shadow-xl transition"
                >
                  <figure className="px-4 pt-4">
                    <img
                      alt={`${user.firstName}'s profile`}
                      src={user.photoURL}
                      className="rounded-lg w-full h-48 object-cover"
                    />
                  </figure>
                  <div className="card-body">
                    <h2 className="card-title text-lg">
                      {user.firstName} {user.lastName}
                    </h2>

                    {user.age && user.gender && (
                      <p className="text-sm text-gray-400">
                        {user.age} • {user.gender}
                      </p>
                    )}

                    {user.about && (
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {user.about}
                      </p>
                    )}

                    {user.skills && user.skills.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 font-semibold mb-2">
                          Skills:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {user.skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="badge badge-sm badge-primary"
                            >
                              {skill}
                            </span>
                          ))}
                          {user.skills.length > 3 && (
                            <span className="badge badge-sm badge-ghost">
                              +{user.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="card-actions justify-end mt-4">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/profile/${user._id}`)}
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
              <div className="flex justify-center gap-2 mb-8">
                <button
                  disabled={page === 1}
                  onClick={() => performSearch(page - 1)}
                  className="btn btn-sm"
                >
                  ← Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => performSearch(pageNum)}
                      className={`btn btn-sm ${
                        page === pageNum ? "btn-primary" : ""
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                )}

                <button
                  disabled={page === totalPages}
                  onClick={() => performSearch(page + 1)}
                  className="btn btn-sm"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {!loading && results.length === 0 && searchQuery === "" && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-300 mb-4">
              🔍 Start Searching
            </h2>
            <p className="text-gray-400 mb-6">
              Use the search bar above to find people by name, skills, or interests
            </p>

            {popularSkills.length > 0 && (
              <div className="mt-8 text-left max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-pink-400 mb-4">
                  💡 Popular Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularSkills.slice(0, 10).map((skill) => (
                  <button
                    key={skill.name || skill.skill || skill._id}
                    onClick={() => {
                      // support both shapes returned by different endpoints
                      const name = skill.name || skill.skill || skill._id;
                      setSelectedSkill(name);
                      performSearch(1);
                    }}
                    className="badge badge-lg badge-primary cursor-pointer hover:badge-secondary"
                  >
                    {skill.name || skill.skill || skill._id} ({skill.count})
                  </button>
                ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && results.length === 0 && searchQuery !== "" && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-300 mb-4">
              😕 No Results Found
            </h2>
            <p className="text-gray-400">
              Try adjusting your filters or search terms
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
