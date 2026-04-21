/**
 * Custom React Query hooks for the /api/me/* customer-scoped endpoints.
 * These are not code-generated because /me routes are authenticated and
 * were added manually after the OpenAPI spec was frozen.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { Customer, Service, Subscription, Payment } from "./generated/api.schemas";

// ── Types ──────────────────────────────────────────────────────────────────

export interface MyServicesParams {
  limit?: number;
  page?: number;
}

export interface MyPaymentsParams {
  limit?: number;
  page?: number;
}

export interface UpdateMyProfileBody {
  phone?: string;
  address?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ── Query keys ──────────────────────────────────────────────────────────────

export const myProfileKey = () => ["me", "profile"] as const;
export const myServicesKey = (params?: MyServicesParams) => ["me", "services", params] as const;
export const myServiceKey = (id: number) => ["me", "services", id] as const;
export const mySubscriptionKey = () => ["me", "subscription"] as const;
export const myPaymentsKey = (params?: MyPaymentsParams) => ["me", "payments", params] as const;

// ── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Fetch the current customer's profile (linked Customer record).
 */
export function useGetMyProfile() {
  return useQuery({
    queryKey: myProfileKey(),
    queryFn: () => customFetch<Customer>("/api/me/profile"),
  });
}

/**
 * Update the current customer's editable profile fields (phone, address).
 */
export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMyProfileBody) =>
      customFetch<Customer>("/api/me/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myProfileKey() });
    },
  });
}

/**
 * Fetch the current customer's service history.
 */
export function useGetMyServices(params?: MyServicesParams) {
  return useQuery({
    queryKey: myServicesKey(params),
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.limit != null) qs.append("limit", String(params.limit));
      if (params?.page != null) qs.append("page", String(params.page));
      const query = qs.toString() ? `?${qs.toString()}` : "";
      return customFetch<PaginatedResponse<Service>>(`/api/me/services${query}`);
    },
  });
}

/**
 * Fetch a single service by ID (must belong to the current customer).
 */
export function useGetMyService(id: number) {
  return useQuery({
    queryKey: myServiceKey(id),
    queryFn: () => customFetch<Service>(`/api/me/services/${id}`),
    enabled: !!id,
  });
}

/**
 * Fetch the current customer's active subscription.
 */
export function useGetMySubscription() {
  return useQuery({
    queryKey: mySubscriptionKey(),
    queryFn: () => customFetch<Subscription | null>("/api/me/subscription"),
  });
}

/**
 * Fetch the current customer's payment history.
 */
export function useGetMyPayments(params?: MyPaymentsParams) {
  return useQuery({
    queryKey: myPaymentsKey(params),
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.limit != null) qs.append("limit", String(params.limit));
      if (params?.page != null) qs.append("page", String(params.page));
      const query = qs.toString() ? `?${qs.toString()}` : "";
      return customFetch<PaginatedResponse<Payment>>(`/api/me/payments${query}`);
    },
  });
}

/**
 * Submit a subscription renewal request.
 */
export function useRequestRenewal() {
  return useMutation({
    mutationFn: () =>
      customFetch<{ success: boolean; message: string }>("/api/me/renewal-request", {
        method: "POST",
        body: JSON.stringify({}),
      }),
  });
}

/**
 * Register or update the customer's Expo push token.
 * Uses PUT /api/me/push-token (customer-scoped, spec §6).
 */
export function useRegisterMyPushToken() {
  return useMutation({
    mutationFn: (token: string) =>
      customFetch<{ ok: boolean }>("/api/me/push-token", {
        method: "PUT",
        body: JSON.stringify({ token }),
      }),
  });
}

/**
 * Toggle push notification opt-in/out for the current customer.
 */
export function useUpdateNotificationPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pushEnabled: boolean) =>
      customFetch<{ ok: boolean; pushEnabled: boolean }>("/api/me/notifications", {
        method: "PUT",
        body: JSON.stringify({ pushEnabled }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myProfileKey() });
    },
  });
}
