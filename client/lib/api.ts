import { LoginData, RegisterData, AuthResponse, User, UserRole } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    const errorMsg = Array.isArray(result.message)
      ? result.message.join(", ")
      : result.message || "Failed to login";
    throw new Error(errorMsg);
  }

  return result;
}

export async function registerUser(data: RegisterData | FormData): Promise<AuthResponse> {
  const isFormData = data instanceof FormData;
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: isFormData
      ? undefined
      : {
          "Content-Type": "application/json",
        },
    credentials: "include",
    body: isFormData ? data : JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    const errorMsg = Array.isArray(result.message)
      ? result.message.join(", ")
      : result.message || "Failed to register";
    throw new Error(errorMsg);
  }

  return result;
}

export async function updateUserRole(
  userId: string,
  role: "DEVELOPER" | "BUSINESS" | "USER"
): Promise<{ message: string; user: User }> {
  const res = await fetch(`${API_URL}/user/${userId}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ role }),
  });

  const result = await res.json();

  if (!res.ok) {
    const errorMsg = Array.isArray(result.message)
      ? result.message.join(", ")
      : result.message || "Failed to update role";
    throw new Error(errorMsg);
  }

  return result;
}

export async function getUserProfile(): Promise<User> {
  const res = await fetch(`${API_URL}/user/profile`, {
    method: "GET",
    credentials: "include",
  });

  const result = await res.json();

  if (!res.ok) {
    const errorMsg = Array.isArray(result.message)
      ? result.message.join(", ")
      : result.message || "Failed to get profile";
    throw new Error(errorMsg);
  }

  return result;
}

