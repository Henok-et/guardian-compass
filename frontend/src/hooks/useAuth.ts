import { useState, useEffect, useCallback } from "react";

interface User {
	id: string;
	email: string;
	name: string;
	role: "admin" | "officer" | "user";
}

export interface RegisterResult {
	success: boolean;
	message?: string;
	duplicate?: boolean;
}

const AUTH_KEY = "au_verification_auth";

export function useAuth() {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string>("");

	useEffect(() => {
		try {
			const stored = localStorage.getItem(AUTH_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				if (parsed && parsed.user) {
					setUser(parsed.user as User);
				}
			}
		} catch {
			// ignore
		}
		setIsLoading(false);
	}, []);

	const login = useCallback(
		async (email: string, password: string): Promise<boolean> => {
			// Try server login first
			try {
				const res = await fetch("/api/auth/login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, password }),
				});
				if (res.ok) {
					const data = await res.json();
					const token = data?.token;
					const userObj: User = {
						id: data?.user?.id || "server-user",
						email: data?.user?.email || email,
						name: data?.user?.username || email,
						role: data?.user?.role || "user",
					};
					setUser(userObj);
					localStorage.setItem(
						AUTH_KEY,
						JSON.stringify({ user: userObj, token }),
					);
					return true;
				}
			} catch (e) {
				console.warn("Server login failed, falling back to demo auth");
			}

			// Fallback: allow demo credentials for offline/demo mode
			const demoOk =
				(email === "admin@au.int" && password === "admin123") ||
				(email === "officer@au.int" && password === "officer123");
			if (demoOk) {
				const userObj: User = {
					id: email === "admin@au.int" ? "user-001" : "user-002",
					email,
					name:
						email === "admin@au.int"
							? "AU Administrator"
							: "Verification Officer",
					role: email === "admin@au.int" ? "admin" : "officer",
				};
				setUser(userObj);
				localStorage.setItem(
					AUTH_KEY,
					JSON.stringify({ user: userObj, token: null }),
				);
				return true;
			}

			return false;
		},
		[],
	);

	const register = useCallback(
		async (
			username: string,
			email: string,
			password: string,
		): Promise<RegisterResult> => {
			try {
				const res = await fetch("/api/auth/register", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ username, email, password }),
				});

				if (res.ok) {
					const data = await res.json();
					const token = data?.token;
					const userObj: User = {
						id: data?.user?.id || "server-user",
						email: data?.user?.email || email,
						name: data?.user?.username || username,
						role: data?.user?.role || "user",
					};
					setUser(userObj);
					localStorage.setItem(
						AUTH_KEY,
						JSON.stringify({ user: userObj, token }),
					);
					setError("");
					return { success: true };
				}

				if (res.status === 409) {
					const errorData = await res.json().catch(() => ({}));
					const msg =
						errorData.message ||
						"This email or username is already registered. Please log in instead.";
					setError(msg);
					return { success: false, duplicate: true, message: msg };
				}

				const errorData = await res.json().catch(() => ({}));
				const msg =
					errorData.message || "Registration failed. Please try again.";
				setError(msg);
				return { success: false, message: msg };
			} catch (e) {
				console.error("Registration error:", e);
				const msg = "Network error. Please check your connection.";
				setError(msg);
				return { success: false, message: msg };
			}
		},
		[setError],
	);

	const logout = useCallback(() => {
		setUser(null);
		localStorage.removeItem(AUTH_KEY);
	}, []);

	return {
		user,
		isLoading,
		isAuthenticated: !!user,
		error,
		login,
		register,
		logout,
	};
}
