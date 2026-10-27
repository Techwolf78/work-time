import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  History,
  CornerDownLeft,
  Loader2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../../lib/authContext";
import { useHrms } from "../../lib/hrmsContext";
import {
  SearchCategory,
  SearchResultItem,
  SearchCategoryGroup,
  QuickActionItem,
} from "./searchTypes";
import { ClientSearchService } from "./searchService";
import { SearchHighlight } from "./SearchHighlight";

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddEmployee?: () => void;
  onOpenApplyLeave?: () => void;
  onOpenAttendanceCorrection?: () => void;
}

const RECENT_SEARCHES_KEY = "ga_hrms_recent_searches";
const MAX_RECENT_SEARCHES = 4;

export function GlobalSearchModal({
  isOpen,
  onClose,
  onOpenAddEmployee,
  onOpenApplyLeave,
  onOpenAttendanceCorrection,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("ALL");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [results, setResults] = useState<SearchCategoryGroup[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    employees = [],
    departments = [],
    designations = [],
    branches = [],
    leaveRequests = [],
    leaveTypes = [],
    attendance = [],
    regularizations = [],
  } = useHrms();

  const role = user?.role || "EMPLOYEE";
  const employeeId = user?.employeeId;

  // Initialize Search Service with active HRMS data
  const searchService = useMemo(() => {
    return new ClientSearchService({
      employees,
      departments,
      designations,
      branches,
      leaveRequests,
      leaveTypes,
      attendance,
      regularizations,
    });
  }, [
    employees,
    departments,
    designations,
    branches,
    leaveRequests,
    leaveTypes,
    attendance,
    regularizations,
  ]);

  // Permitted Quick Actions for current role
  const quickActions = useMemo(() => {
    return searchService.getQuickActions(role, {
      onOpenAddEmployee,
      onOpenApplyLeave,
      onOpenAttendanceCorrection,
      onCloseSearch: onClose,
      navigate,
    });
  }, [
    searchService,
    role,
    onOpenAddEmployee,
    onOpenApplyLeave,
    onOpenAttendanceCorrection,
    onClose,
    navigate,
  ]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveCategory("ALL");
      setSelectedIndex(0);
      setHasError(false);
      const timer = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Save to recent searches
  const saveRecentSearch = useCallback((searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== term.toLowerCase());
      const updated = [term, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage quota errors
      }
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // Execute Search with 200ms debounce
  const executeSearch = useCallback(
    async (searchTerm: string, category: SearchCategory) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (!searchTerm.trim()) {
        setIsLoading(false);
        setResults([]);
        setHasError(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await searchService.search(
          {
            query: searchTerm,
            category,
            role,
            employeeId,
          },
          controller.signal
        );

        setResults(response.groups);
        setSelectedIndex(0);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setHasError(true);
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [searchService, role, employeeId]
  );

  // Debounce input changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = window.setTimeout(() => {
      executeSearch(query, activeCategory);
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, activeCategory, executeSearch]);

  // Flattened array for keyboard navigation
  const flatItems = useMemo<SearchResultItem[]>(() => {
    return results.flatMap((g) => g.items);
  }, [results]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (flatItems.length > 0 ? (prev + 1) % flatItems.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (flatItems.length > 0 ? (prev - 1 + flatItems.length) % flatItems.length : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatItems.length > 0 && flatItems[selectedIndex]) {
          handleSelectItem(flatItems[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatItems, selectedIndex]);

  const handleSelectItem = (item: SearchResultItem) => {
    saveRecentSearch(query || item.title);
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
      onClose();
    }
  };

  const handleSelectQuickAction = (action: QuickActionItem) => {
    action.action();
  };

  const handleSelectRecentSearch = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  // Category filter tabs
  const categories: { id: SearchCategory; label: string }[] = [
    { id: "ALL", label: "All" },
    { id: "ACTIVITY", label: "Time & Activity" },
    { id: "DEVICES", label: "Workstations" },
    { id: "PEOPLE", label: "Team" },
    { id: "REPORTS", label: "Reports" },
    { id: "PAGES", label: "Navigation" },
  ];

  const isIdle = !query.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-2 sm:pt-4 pb-2 sm:pb-4 px-2 sm:px-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Global search command palette"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-10 flex flex-col h-[min(560px,calc(100vh-2rem))] max-h-[calc(100vh-2rem)]">
        {/* Search Header */}
        <div className="px-3.5 sm:px-4 py-3 border-b border-gray-100 flex items-center gap-3 shrink-0 bg-white">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything..."
            aria-label="Search anything"
            className="w-full text-sm bg-transparent border-none text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />

          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
              title="Clear search"
              aria-label="Clear query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <kbd className="hidden sm:inline-block text-[10px] font-mono text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Category Filters (Segmented Tabs) */}
        <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-white text-gray-950 shadow-2xs font-semibold border border-gray-200/80"
                    : "text-gray-600 hover:text-gray-950 hover:bg-white/60"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Results / Idle Body */}
        <div
          ref={listRef}
          className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-3"
          role="listbox"
        >
          {/* STATE 2: Open and Idle (Recent Searches & Quick Actions) */}
          {isIdle && (
            <div className="p-2 space-y-4">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                      Recent Searches
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[11px] text-gray-400 hover:text-gray-600 hover:underline"
                    >
                      Clear history
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSelectRecentSearch(term)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-2.5">
                          <History className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
                          <span>{term}</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions Permitted for Current Role */}
              <div>
                <div className="px-2 pt-1 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Quick Actions
                </div>
                <div className="space-y-0.5">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleSelectQuickAction(action)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0">
                          {action.icon}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-gray-900 block truncate">
                            {action.title}
                          </span>
                          <span className="text-[11px] text-gray-400 block truncate">
                            {action.subtitle}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] text-gray-400 group-hover:text-gray-900 transition-colors shrink-0 font-medium">
                        Open →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STATE 8: Network / Search Error */}
          {hasError && (
            <div className="py-12 px-4 text-center">
              <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-900">
                Search couldn't be completed. Please try again.
              </p>
              <button
                onClick={() => executeSearch(query, activeCategory)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
              >
                <RotateCcw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {/* STATE 7: No Results Found */}
          {!isIdle && !isLoading && !hasError && flatItems.length === 0 && (
            <div className="py-12 px-4 text-center">
              <p className="text-sm font-semibold text-gray-950">No results found</p>
              <p className="text-xs text-gray-500 mt-1">
                Try a different keyword or search using an employee ID.
              </p>
              <div className="mt-3">
                <button
                  onClick={() => {
                    setQuery("");
                    setActiveCategory("ALL");
                    inputRef.current?.focus();
                  }}
                  className="px-2.5 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  Clear search query
                </button>
              </div>
            </div>
          )}

          {/* STATE 5 & 6: Results Available */}
          {!isIdle && !hasError && results.length > 0 && (
            <div className="space-y-3">
              {results.map((group) => {
                if (group.items.length === 0) return null;
                return (
                  <div key={group.category} className="space-y-0.5">
                    <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                      {group.label}
                    </div>

                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const itemIndex = flatItems.indexOf(item);
                        const isSelected = selectedIndex === itemIndex;

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            onMouseEnter={() => setSelectedIndex(itemIndex)}
                            role="option"
                            aria-selected={isSelected}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors text-xs ${
                              isSelected
                                ? "bg-gray-100 text-gray-950 font-medium"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {item.avatar ? (
                                <img
                                  src={item.avatar}
                                  alt=""
                                  className="w-5 h-5 rounded-full object-cover shrink-0"
                                />
                              ) : item.initials ? (
                                <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {item.initials}
                                </div>
                              ) : (
                                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                  {item.icon}
                                </div>
                              )}

                              <div className="truncate">
                                <SearchHighlight
                                  text={item.title}
                                  query={query}
                                  className="text-gray-900 font-medium"
                                />
                                {item.subtitle && (
                                  <span className="text-gray-400 font-normal ml-2 hidden sm:inline">
                                    <SearchHighlight
                                      text={item.subtitle}
                                      query={query}
                                      className="text-gray-400"
                                    />
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              {item.badge && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                                    item.badgeVariant === "success"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                      : item.badgeVariant === "warning"
                                      ? "bg-amber-50 text-amber-700 border-amber-200/80"
                                      : item.badgeVariant === "danger"
                                      ? "bg-rose-50 text-rose-700 border-rose-200/80"
                                      : "bg-gray-100 text-gray-600 border-gray-200/60"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                              {isSelected && (
                                <CornerDownLeft className="w-3 h-3 text-gray-400 shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quiet Footer */}
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-[11px] text-gray-400 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="border border-gray-200 bg-white px-1 rounded text-[10px]">↑</kbd>
              <kbd className="border border-gray-200 bg-white px-1 rounded text-[10px]">↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="border border-gray-200 bg-white px-1 rounded text-[10px]">↵</kbd>
              <span>select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="border border-gray-200 bg-white px-1 rounded text-[10px]">esc</kbd>
              <span>close</span>
            </span>
          </div>
          <span>Command Palette</span>
        </div>
      </div>
    </div>
  );
}
