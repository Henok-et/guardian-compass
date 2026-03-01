import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	LayoutDashboard,
	FileText,
	CheckCircle,
	Flag,
	LogOut,
	Shield,
	User,
} from "lucide-react";

interface DashboardLayoutProps {
	children: ReactNode;
}

const navItems = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/applications", label: "Applications", icon: FileText },
	{ href: "/verified", label: "Verified", icon: CheckCircle },
	{ href: "/flagged", label: "Flagged", icon: Flag },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
	const location = useLocation();
	const navigate = useNavigate();
	const { user, logout } = useAuthContext();

	const handleLogout = () => {
		logout();
		navigate("/");
	};

	return (
		<div className="min-h-screen bg-muted/30">
			{/* Top Navigation */}
			<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container flex h-16 items-center justify-between">
					<div className="flex items-center gap-4">
						<Link to="/dashboard" className="flex items-center gap-2">
							<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
								<Shield className="w-5 h-5 text-primary-foreground" />
							</div>
							<span className="font-bold text-lg hidden sm:inline">
								AU Youth Verification
							</span>
						</Link>
					</div>

					<nav className="hidden md:flex items-center gap-1">
						{navItems.map((item) => {
							const Icon = item.icon;
							const isActive =
								location.pathname === item.href ||
								(item.href !== "/dashboard" &&
									location.pathname.startsWith(item.href));
							return (
								<Link key={item.href} to={item.href}>
									<Button
										variant={isActive ? "secondary" : "ghost"}
										size="sm"
										className={cn("gap-2", isActive && "bg-secondary")}
									>
										<Icon className="w-4 h-4" />
										{item.label}
									</Button>
								</Link>
							);
						})}
					</nav>

					<div className="flex items-center gap-4">
						{user ? (
							<div className="flex items-center gap-3">
								<div className="hidden sm:flex items-center gap-2 text-sm">
									<User className="w-4 h-4 text-muted-foreground" />
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground">{user.name}</span>
										<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
											{user.role?.toUpperCase()}
										</span>
									</div>
								</div>

								<Button variant="outline" size="sm" onClick={handleLogout}>
									<LogOut className="w-4 h-4 mr-2" />
									Logout
								</Button>
							</div>
						) : (
							<div className="flex items-center gap-2">
								<Link to="/login">
									<Button variant="secondary" size="sm">
										<User className="w-4 h-4 mr-2" />
										Sign in
									</Button>
								</Link>
							</div>
						)}
					</div>
				</div>
			</header>

			{/* Mobile Navigation */}
			<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
				<div className="flex items-center justify-around py-2">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive =
							location.pathname === item.href ||
							(item.href !== "/dashboard" &&
								location.pathname.startsWith(item.href));
						return (
							<Link key={item.href} to={item.href}>
								<Button
									variant="ghost"
									size="sm"
									className={cn(
										"flex-col h-auto py-2 px-4",
										isActive && "text-primary",
									)}
								>
									<Icon className="w-5 h-5" />
									<span className="text-xs mt-1">{item.label}</span>
								</Button>
							</Link>
						);
					})}
				</div>
			</nav>

			{/* Main Content */}
			<main className="container py-6 pb-20 md:pb-6">{children}</main>
		</div>
	);
};

export default DashboardLayout;
