import { Link } from "react-router-dom";
import { useApplications } from "@/hooks/useApplications";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowRight, MapPin, Users, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/animation"; // adjust path

const Applications = () => {
	// the hook exposes both the full list (`applications`) and a derived
	// `pendingApplications` slice. use the latter for the review pool so we
	// don't have to repeatedly filter here.
	const { pendingApplications, isLoading, refetch } = useApplications();
	const [searchQuery, setSearchQuery] = useState("");
	const [riskFilter, setRiskFilter] = useState<
		"all" | "low" | "medium" | "high" | "critical"
	>("all");

	// Refetch fresh data when entering this page (fixes stale list after approval)
	useEffect(() => {
		refetch();
		console.log("[Applications Page] Refetched data on mount");
	}, [refetch]);

	// Debug: log what the hook provides (pending slice only)
	useEffect(() => {
		console.log(
			"[LIST PAGE] Total pending apps from hook:",
			pendingApplications.length,
		);
		console.log(
			"[LIST PAGE] Org names:",
			pendingApplications.map((a) => a.organizationName || "Unnamed"),
		);
		console.log(
			"[LIST PAGE] Statuses:",
			pendingApplications.map((a) => a.status),
		);
		console.log(
			"[LIST PAGE] Risk levels:",
			pendingApplications.map((a) => a.riskAssessment?.level || "none"),
		);
	}, [pendingApplications]);

	// pendingApplications already contains only pending items
	const filteredApplications = pendingApplications.filter((app) => {
		const matchesSearch =
			app.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			app.country.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesRisk =
			riskFilter === "all" ? true : app.riskAssessment?.level === riskFilter;

		return matchesSearch && matchesRisk;
	});

	if (isLoading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-64">
					<LoadingSpinner size="lg" />
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className="space-y-6">
				<h1 className="text-3xl font-bold">Pending Applications</h1>
				<p className="text-muted-foreground">
					Review and process youth organization applications
				</p>

				{/* Search */}
				<div className="flex items-center gap-2 mt-4">
					<Search className="w-4 h-4 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search by organization name or country..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="flex-1 border rounded px-3 py-2 text-sm"
					/>
				</div>

				{/* Risk Filter */}
				<div className="flex gap-2 mt-2">
					{(["all", "low", "medium", "high", "critical"] as const).map(
						(level) => (
							<button
								key={level}
								onClick={() => setRiskFilter(level)}
								className={`px-3 py-1 rounded text-sm font-medium border ${
									riskFilter === level
										? "bg-primary text-white border-primary"
										: "bg-white text-muted-foreground border-gray-300"
								}`}
							>
								{level === "all"
									? "All"
									: level.charAt(0).toUpperCase() + level.slice(1) + " Risk"}
							</button>
						),
					)}
				</div>

				{/* Applications Grid */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
					{filteredApplications.length === 0 ? (
						<p className="text-center text-muted-foreground col-span-full py-8">
							No pending applications found
						</p>
					) : (
						filteredApplications.map((app) => (
							<Card
								key={app.id}
								className="border hover:border-primary transition-colors cursor-pointer relative"
							>
								<CardHeader className="flex justify-between items-start relative">
									<div className="flex-1 space-y-2">
										{/* Organization Name */}
										<CardTitle className="text-2xl md:text-3xl font-bold">
											{app.organizationName}
										</CardTitle>

										{/* Location */}
										<div className="flex items-center text-sm text-muted-foreground gap-1">
											<MapPin className="w-4 h-4" />
											<p>
												{app.city && app.city !== app.country
													? `${app.city}, ${app.country}`
													: app.country}
											</p>
										</div>

										{/* Leaders */}
										<div className="flex items-center text-sm text-muted-foreground gap-1">
											<Users size={14} /> {app.leadership?.length || 0} leader
											{app.leadership?.length !== 1 ? "s" : ""}
										</div>

										{/* Status Badge */}
										<Badge
											className={`mt-2 ${
												app.status === "pending"
													? "bg-primary/10 text-primary"
													: app.status === "approved"
														? "bg-success/10 text-success"
														: app.status === "flagged"
															? "bg-warning/10 text-warning"
															: "bg-error/10 text-error"
											}`}
										>
											{app.status.toUpperCase()}
										</Badge>

										{/* Full-width separator */}
										<hr className="my-2 border-t border-gray-200 w-full" />

										{/* Risk Score */}
										<p className="text-sm font-bold text-muted-foreground">
											Risk Score: {app.riskAssessment?.score ?? 0}
										</p>
									</div>

									{/* Risk Badge top-right */}
									{app.riskAssessment && (
										<Badge
											className={`text-xs py-1 px-2 absolute top-3 right-3 ${
												app.riskAssessment.level === "high"
													? "bg-error/10 text-error border border-error"
													: app.riskAssessment.level === "medium"
														? "bg-warning/10 text-warning border border-warning"
														: app.riskAssessment.level === "critical"
															? "bg-error text-white border border-error"
															: "bg-success/10 text-success border border-success"
											}`}
										>
											{app.riskAssessment.level.toUpperCase()}
										</Badge>
									)}
								</CardHeader>

								{/* Review Button */}
								<CardContent className="flex justify-end mt-2">
									<Link to={`/applications/${app.id}`}>
										<Button size="sm" variant="outline">
											Review <ArrowRight className="w-4 h-4 ml-1" />
										</Button>
									</Link>
								</CardContent>
							</Card>
						))
					)}
				</div>
			</div>
		</DashboardLayout>
	);
};

export default Applications;
