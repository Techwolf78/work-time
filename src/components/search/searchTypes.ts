import React from "react";
import { UserRole } from "../../types/hrms";

export type SearchCategory =
  | "ALL"
  | "PEOPLE"
  | "ATTENDANCE"
  | "LEAVE"
  | "ORGANIZATION"
  | "PAGES";

export type ResultType =
  | "employee"
  | "attendance"
  | "regularization"
  | "leave"
  | "department"
  | "branch"
  | "page"
  | "action";

export interface SearchResultItem {
  id: string;
  type: ResultType;
  category: SearchCategory;
  title: string;
  subtitle: string;
  badge?: string;
  badgeVariant?: "primary" | "success" | "warning" | "danger" | "neutral" | "info";
  path?: string;
  action?: () => void;
  icon?: React.ReactNode;
  avatar?: string;
  initials?: string;
  highlightText?: string;
  score?: number;
}

export interface SearchCategoryGroup {
  category: SearchCategory;
  label: string;
  items: SearchResultItem[];
}

export interface QuickActionItem {
  id: string;
  title: string;
  subtitle: string;
  action: () => void;
  path?: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
}

export interface SearchRequest {
  query: string;
  category?: SearchCategory;
  role: UserRole;
  tenantId?: string;
  userId?: string;
  employeeId?: string;
  limit?: number;
}

export interface SearchResponse {
  query: string;
  category: SearchCategory;
  groups: SearchCategoryGroup[];
  totalResults: number;
  executionTimeMs?: number;
}

/**
 * Pluggable Search Service contract for Spring Boot backend integration.
 * In production without backend, uses the in-memory context adapter.
 */
export interface ISearchService {
  search(request: SearchRequest, signal?: AbortSignal): Promise<SearchResponse>;
  getQuickActions(role: UserRole, callbacks: SearchActionCallbacks): QuickActionItem[];
}

export interface SearchActionCallbacks {
  onOpenAddEmployee?: () => void;
  onOpenApplyLeave?: () => void;
  onOpenAttendanceCorrection?: () => void;
  onCloseSearch: () => void;
  navigate: (path: string) => void;
}
