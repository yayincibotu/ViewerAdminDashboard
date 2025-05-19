import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Try to parse as JSON first
    const contentType = res.headers.get('Content-Type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await res.clone().json();
        const errorMessage = errorData.message || res.statusText;
        const error: any = new Error(`${res.status}: ${errorMessage}`);
        error.response = res;
        error.data = errorData;
        throw error;
      } catch (parseError) {
        // If JSON parsing fails, fall back to text
        const text = await res.clone().text();
        const error: any = new Error(`${res.status}: ${text || res.statusText}`);
        error.response = res;
        throw error;
      }
    } else {
      // Handle as text
      const text = await res.clone().text();
      const error: any = new Error(`${res.status}: ${text || res.statusText}`);
      error.response = res;
      throw error;
    }
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

  // Copy the response to check if it's ok without consuming the body
  const clonedRes = res.clone();
  await throwIfResNotOk(clonedRes);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
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
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      // Sessiz bir şekilde 401 hatalarını işle
      onError: (error: any) => {
        // Kimlik doğrulama hatalarını konsola yazdırma
        if (error?.response?.status === 401) {
          // Sessizce işle, konsola hata yazdırma
          return;
        }
        // Diğer hataları konsola yazdır
        console.error('Query error:', error);
      }
    },
    mutations: {
      retry: false,
    },
  },
});
