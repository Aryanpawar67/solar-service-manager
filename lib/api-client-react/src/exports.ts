import { customFetch, type CustomFetchOptions } from "./custom-fetch";

export async function uploadFile(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return customFetch<{ url: string }>("/api/upload", {
    method: "POST",
    body: formData,
  } as CustomFetchOptions);
}

export async function downloadServiceReport(serviceId: number): Promise<void> {
  const blob = await customFetch<Blob>(`/api/services/${serviceId}/report`, {
    method: "GET",
    responseType: "blob",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `service-report-${serviceId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

function triggerCsvDownload(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportCustomers(search?: string): Promise<void> {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  const csv = await customFetch<string>(`/api/customers/export${params}`, {
    method: "GET",
    responseType: "text",
  });
  triggerCsvDownload(csv, "customers.csv");
}

export async function exportPayments(params?: {
  customerId?: number;
  status?: string;
}): Promise<void> {
  const qs = new URLSearchParams();
  if (params?.customerId) qs.append("customerId", String(params.customerId));
  if (params?.status) qs.append("status", params.status);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  const csv = await customFetch<string>(`/api/payments/export${query}`, {
    method: "GET",
    responseType: "text",
  });
  triggerCsvDownload(csv, "payments.csv");
}
