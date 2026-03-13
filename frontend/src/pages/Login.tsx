import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Shield, AlertCircle } from "lucide-react";

const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { login } = useAuthContext();
	const navigate = useNavigate();

	const handleInputChange = () => {
		if (verifiedMessage) setVerifiedMessage("");
		if (error) setError("");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		const success = await login(email, password);
		setIsLoading(false);

		if (success) {
			// Get user role from localStorage
			const authData = localStorage.getItem("au_verification_auth");
			let role = "user";
			if (authData) {
				try {
					const parsed = JSON.parse(authData);
					role = parsed?.user?.role || "user";
				} catch {}
			}
			if (role === "admin" || role === "officer") {
				navigate("/dashboard");
			} else {
				navigate("/register");
			}
		} else {
			setError("Invalid email or password");
		}
	};
	const location = useLocation();
	const [verifiedMessage, setVerifiedMessage] = useState("");
	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const verified = params.get("verified");

		if (verified === "true") {
			setVerifiedMessage("Your email has been verified. You can now log in.");
		} else if (verified === "false") {
			setVerifiedMessage("Verification failed or link expired.");
		}
	}, [location.search]);
	return (
		<div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[hsl(var(--primary)/0.35)] via-[hsl(var(--primary)/0.2)] to-[hsl(var(--background)/0.85)] px-4 py-10">
			<div className="w-full max-w-6xl">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<div className="relative overflow-hidden rounded-[12px] border border-border bg-card shadow-lg min-h-[420px]">
						<img
							src="/LoginImage.png"
							alt="AU youth organizations illustration"
							className="h-full w-full object-cover"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />

						<div className="absolute inset-0 flex items-start justify-start p-6">
							<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/90 shadow-lg">
								<Shield className="h-6 w-6 text-primary-foreground" />
								<span className="sr-only">AU Youth Verification</span>
							</div>
						</div>
					</div>

					<Card className="rounded-[12px] border border-border bg-card shadow-lg">
						<CardHeader className="text-center px-8 pt-10">
							<CardTitle className="text-xl font-semibold text-foreground">
								Sign in to your account
							</CardTitle>
							<CardDescription className="mt-2 text-sm text-muted-foreground">
								Enter your AU credentials to continue.
							</CardDescription>
						</CardHeader>
						<CardContent className="px-8 pb-10">
							<form onSubmit={handleSubmit} className="space-y-5">
								{verifiedMessage && (
									<div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
										{verifiedMessage}
									</div>
								)}
								{error && (
									<div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
										<AlertCircle className="w-4 h-4" />
										{error}
									</div>
								)}

								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										placeholder="officer@au.int"
										value={email}
										onChange={(e) => {
											setEmail(e.target.value);
											handleInputChange();
										}}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="password">Password</Label>
									<Input
										id="password"
										type="password"
										placeholder="Enter your password"
										value={password}
										onChange={(e) => {
											setPassword(e.target.value);
											handleInputChange();
										}}
										required
									/>
								</div>

								<Button type="submit" className="w-full" disabled={isLoading}>
									{isLoading ? "Signing in..." : "Sign in"}
								</Button>

								<div className="rounded-lg border border-border bg-muted p-4 text-sm">
									<p className="font-medium text-muted-foreground mb-1">
										Demo Credentials
									</p>
									<p className="text-muted-foreground">Email: admin@au.int</p>
									<p className="text-muted-foreground">Password: admin123</p>
								</div>

								<div className="mt-4 text-center text-sm">
									<span className="text-muted-foreground">
										Don't have an account?
									</span>
									<a
										href="/register"
										className="ml-2 text-primary underline hover:text-primary-dark"
									>
										Register here
									</a>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>

				<footer className="mt-10 text-center text-xs text-muted-foreground">
					<p>© African Union – Women, Gender &amp; Youth Directorate</p>
					<p>Secure Internal Platform</p>
				</footer>
			</div>
		</div>
	);
};

export default Login;
