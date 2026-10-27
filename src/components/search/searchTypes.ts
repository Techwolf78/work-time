import React from "react";
import { UserRole } from "../../types/hrms";

export type SearchCategory =
  | "ALL"
  | "ACTIVITY"
  | "DEVICES"
  | "PEOPLE"
  | "REPORTS"
  | "PAGES";

export type ResultType =
  | "employee"
  | "activity"
  | "device"
  | "report"
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

export interface ISearchService {
  search(request: SearchRequest, signal?: AbortSignal): Promise<SearchResponse>;
  getQuickActions(role: UserRole, callbacks: SearchActionCallbacks): QuickActionItem[];
}

export interface SearchActionCallbacks {
  onOpenAddEmployee?: () => void;
  onOpenApplyLeave?: () => void;
  onOpenAttendanceCorrection?: () => void;
  onOpenPrivacyCharter?: () => void;
  onOpenDownloadAgent?: () => void;
  onCloseSearch: () => void;
  navigate: (path: string) => void;
}
