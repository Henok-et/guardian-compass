import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const Register = () => {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [successMsg, setSuccessMsg] = useState("");
	const { register } = useAuthContext();
	const navigate = useNavigate();

	// Password validation rules
	const passwordRules = [
		{
			label: "At least 1 lowercase letter",
			test: (pw: string) => /[a-z]/.test(pw),
		},
		{
			label: "At least 1 uppercase letter",
			test: (pw: string) => /[A-Z]/.test(pw),
		},
		{
			label: "At least 1 number",
			test: (pw: string) => /[0-9]/.test(pw),
		},
		{
			label: "At least 1 special character",
			test: (pw: string) => /[^A-Za-z0-9]/.test(pw),
		},
		{
			label: "Between 8 and 50 characters",
			test: (pw: string) => pw.length >= 8 && pw.length <= 50,
		},
	];
	const passwordValid = passwordRules.every((r) => r.test(password));
	const passwordsMatch = password === confirmPassword && password.length > 0;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		const success = await register(username, email, password);
		setIsLoading(false);

		if (success) {
			setSuccessMsg(
				"Registration successful. Please check your email to verify your account.",
			);
			setTimeout(() => {
				navigate("/login");
			}, 2000);
		} else {
			setError("Registration failed. Please try again.");
		}
	};

	return (
		<div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[hsl(var(--primary)/0.35)] via-[hsl(var(--primary)/0.2)] to-[hsl(var(--background)/0.85)] px-4 py-10">
			{successMsg && (
				<div className="mb-4 p-4 rounded-lg bg-green-100 text-green-800 border border-green-300 text-center">
					{successMsg}
				</div>
			)}
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
								Register a new account
							</CardTitle>
							<CardDescription className="mt-2 text-sm text-muted-foreground">
								Create your AU Youth account.
							</CardDescription>
						</CardHeader>
						<CardContent className="px-8 pb-10">
							<form onSubmit={handleSubmit} className="space-y-5">
								{error && (
									<div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
										<AlertCircle className="w-4 h-4" />
										{error}
									</div>
								)}

								<div className="space-y-2">
									<Label htmlFor="username">Username</Label>
									<Input
										id="username"
										placeholder="Your name"
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										placeholder="you@au.int"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="password">Password</Label>
									<Input
										id="password"
										type="password"
										placeholder="Create a password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
									/>
									<div className="mt-2 text-xs">
										{passwordRules.map((rule, idx) => (
											<div key={idx} className="flex items-center gap-2">
												{rule.test(password) ? (
													<span className="text-orange-600">✔</span>
												) : (
													<span className="text-red-600">✘</span>
												)}
												<span
													className={
														rule.test(password)
															? "text-orange-600"
															: "text-red-600"
													}
												>
													{rule.label}
												</span>
											</div>
										))}
									</div>
									{!passwordValid && password.length > 0 && (
										<div className="mt-2 text-xs text-red-600">
											Password must meet all requirements above.
										</div>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="confirmPassword">Confirm Password</Label>
									<Input
										id="confirmPassword"
										type="password"
										placeholder="Re-enter your password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										required
									/>
									{confirmPassword.length > 0 && !passwordsMatch && (
										<div className="mt-2 text-xs text-red-600">
											Passwords do not match.
										</div>
									)}
									{confirmPassword.length > 0 && passwordsMatch && (
										<div className="mt-2 text-xs text-orange-600">
											Passwords match.
										</div>
									)}
								</div>

								<Button
									type="submit"
									className="w-full"
									disabled={isLoading || !passwordValid || !passwordsMatch}
								>
									{isLoading ? "Registering..." : "Register"}
								</Button>
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

export default Register;
