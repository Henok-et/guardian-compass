import React, { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { RegisterResult } from "@/hooks/useAuth";

interface User {
	id: string;
	email: string;
	name: string;
	role: "admin" | "officer" | "user";
}

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	error: string;
	login: (email: string, password: string) => Promise<boolean>;
	register: (
		username: string,
		email: string,
		password: string,
	) => Promise<RegisterResult>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const auth = useAuth();
	return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuthContext must be used within an AuthProvider");
	}
	return context;
};
