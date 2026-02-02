import { Link } from "react-router-dom";
import { useApplications } from "@/hooks/useApplications";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowRight, MapPin, Users, Search } from "lucide-react";
import React, { useEffect } from "react";

const Applications = () => {
	const { applications, isLoading } = useApplications();
	const [searchQuery, setSearchQuery] = React.useState("");
	const [riskFilter, setRiskFilter] = React.useState<
		"all" | "low" | "medium" | "high"
	>("all");

	// Debug: log what the hook is really providing
	useEffect(() => {
		console.log("[LIST PAGE] Received from hook - total:", applications.length);
		console.log(
			"[LIST PAGE] Org names:",
			applications.map((a) => a.organizationName || "Unnamed"),
		);
		console.log(
			"[LIST PAGE] Leader counts:",
			applications.map((a) => a.leadership?.length || 0),
		);
		console.log(
			"[LIST PAGE] Risk levels:",
			applications.map((a) => a.riskAssessment?.level || "none"),
		);
	}, [applications]);

	if (isLoading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				</div>
			</DashboardLayout>
		);
	}

	const filteredApplications = applications.filter((app) => {
		const matchesSearch =
			app.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			app.country.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesRisk =
			riskFilter === "all" ? true : app.riskAssessment?.level === riskFilter;
		return matchesSearch && matchesRisk;
	});

	return (
		<DashboardLayout>
			<div className="space-y-6">
				<h1 className="text-3xl font-bold">Applications</h1>
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
					{(["all", "low", "medium", "high"] as const).map((level) => (
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
								: level === "low"
									? "Low Risk"
									: level === "medium"
										? "Medium Risk"
										: "High Risk"}
						</button>
					))}
				</div>

				{/* Applications Grid */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
					{filteredApplications.length === 0 ? (
						<p className="text-center text-muted-foreground col-span-full py-8">
							No applications found
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

										{/* Full-width separator line */}
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
													? "bg-red-100 text-red-800 border border-red-200"
													: app.riskAssessment.level === "medium"
														? "bg-yellow-100 text-yellow-800 border border-yellow-200"
														: "bg-green-100 text-green-800 border border-green-200"
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
