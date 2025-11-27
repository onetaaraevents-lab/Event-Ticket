import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

function buildUrl(queryKey: readonly unknown[]): string {
  const [base, ...rest] = queryKey;
  
  if (typeof base !== 'string') {
    throw new Error('First element of queryKey must be a string URL');
  }

  let url = base;
  const params = new URLSearchParams();

  for (const item of rest) {
    if (typeof item === 'string') {
      url = `${url}/${item}`;
    } else if (typeof item === 'number') {
      url = `${url}/${item}`;
    } else if (item && typeof item === 'object') {
      for (const [key, value] of Object.entries(item)) {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      }
    }
  }

  const queryString = params.toString();
  if (queryString) {
    url = `${url}?${queryString}`;
  }

  return url;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = buildUrl(queryKey);
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
