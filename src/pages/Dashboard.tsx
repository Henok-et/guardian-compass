import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useApplications } from "@/hooks/useApplications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
	FileText,
	Clock,
	CheckCircle,
	AlertTriangle,
	ArrowRight,
	Globe,
	Eye,
} from "lucide-react";

// African countries list
const AFRICAN_COUNTRIES = [
	"Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
	"Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros",
	"Congo", "Côte d'Ivoire", "Djibouti", "Egypt", "Equatorial Guinea",
	"Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea",
	"Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar",
	"Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique",
	"Namibia", "Niger", "Nigeria", "Rwanda", "São Tomé and Príncipe", "Senegal",
	"Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan",
	"Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
];

const Dashboard = () => {
	const { applications, isLoading } = useApplications();
	const [selectedCountry, setSelectedCountry] = useState<string>("all");
	
	// Local stats calculation - MORE RELIABLE
	const [localStats, setLocalStats] = useState({
		total: 0,
		pending: 0,
		approved: 0,
		flagged: 0,
		rejected: 0,
		highRisk: 0,
	});

	// Calculate stats whenever applications change
	useEffect(() => {
		if (applications.length > 0) {
			// Debug: Log what we're working with
			console.log("Dashboard applications:", applications);
			console.log("Application statuses:", applications.map(app => ({
				id: app.id,
				name: app.organizationName,
				status: app.status,
				riskLevel: app.riskAssessment?.level
			})));
			
			const stats = {
				total: applications.length,
				pending: applications.filter(app => app.status === "pending").length,
				approved: applications.filter(app => app.status === "approved").length,
				flagged: applications.filter(app => app.status === "flagged").length,
				rejected: applications.filter(app => app.status === "rejected").length,
				highRisk: applications.filter(app => 
					app.riskAssessment?.level === "high" || 
					app.riskAssessment?.level === "critical"
				).length,
			};
			
			console.log("Calculated local stats:", stats);
			setLocalStats(stats);
		} else {
			setLocalStats({
				total: 0,
				pending: 0,
				approved: 0,
				flagged: 0,
				rejected: 0,
				highRisk: 0,
			});
		}
	}, [applications]);

	// Filter applications based on selected country
	const filteredApplications = useMemo(() => {
		if (selectedCountry === "all" || !selectedCountry) {
			return applications;
		}
		return applications.filter(app => app.country === selectedCountry);
	}, [applications, selectedCountry]);

	// Unique African countries from applications
	const availableCountries = useMemo(() => {
		const countries = [
			...new Set(applications.map((app) => app.country).filter(Boolean)),
		];
		return countries
			.filter((c) =>
				AFRICAN_COUNTRIES.some((a) => a.toLowerCase() === c.toLowerCase()),
			)
			.sort();
	}, [applications]);

	// High-risk apps
	const highRiskApps = useMemo(
		() =>
			filteredApplications.filter(
				(app) =>
					app.riskAssessment?.level === "high" ||
					app.riskAssessment?.level === "critical",
			),
		[filteredApplications],
	);

	// Recent applications (last 5)
	const recentApplications = useMemo(
		() =>
			[...filteredApplications]
				.sort(
					(a, b) =>
						new Date(b.submittedAt).getTime() -
						new Date(a.submittedAt).getTime(),
				)
				.slice(0, 5),
		[filteredApplications],
	);

	if (isLoading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				</div>
			</DashboardLayout>
		);
	}

	// Show debug info in development
	const showDebug = process.env.NODE_ENV === 'development';

	return (
		<DashboardLayout>
			<div className="space-y-8">
				{/* Debug Info - Only in development */}
				{showDebug && (
					<Card className="bg-yellow-50 border-yellow-200">
						<CardContent className="pt-6">
							<details>
								<summary className="cursor-pointer font-medium text-yellow-800">
									Debug Info: {applications.length} applications loaded
								</summary>
								<pre className="text-xs mt-2 overflow-auto max-h-40">
									{JSON.stringify(
										applications.map(app => ({
											id: app.id.substring(0, 8),
											name: app.organizationName.substring(0, 30),
											status: app.status,
											country: app.country,
											risk: app.riskAssessment?.level,
										})), 
										null, 
										2
									)}
								</pre>
							</details>
						</CardContent>
					</Card>
				)}

				{/* Header + Country Filter */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold">Dashboard</h1>
						<p className="text-muted-foreground mt-1">
							Youth Organization Verification Overview
							{selectedCountry !== "all" && selectedCountry && (
								<span className="ml-2 font-medium text-primary">
									• {selectedCountry}
								</span>
							)}
						</p>
					</div>

					<Select value={selectedCountry} onValueChange={setSelectedCountry}>
						<SelectTrigger className="w-[220px]">
							<div className="flex items-center gap-2">
								<Globe className="h-4 w-4" />
								<SelectValue placeholder="Filter by country" />
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								All African Countries ({localStats.total})
							</SelectItem>
							{availableCountries.map((country) => (
								<SelectItem key={country} value={country}>
									{country}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Main Stats Grid - Using localStats */}
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					<Card className="border-l-4 border-l-blue-500">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">
								Total Applications
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{localStats.total}</div>
							<p className="text-xs text-muted-foreground">
								All submitted applications
							</p>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-amber-500">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">
								Pending Review
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{localStats.pending}</div>
							<p className="text-xs text-muted-foreground">Awaiting review</p>
							{localStats.total > 0 && (
								<Badge variant="outline" className="mt-1">
									{Math.round((localStats.pending / localStats.total) * 100)}% of total
								</Badge>
							)}
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-green-500">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">Approved</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{localStats.approved}</div>
							<p className="text-xs text-muted-foreground">
								Verified organizations
							</p>
						</CardContent>
					</Card>

					<Card className="border-l-4 border-l-red-500">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">
								Flagged / Rejected
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{localStats.flagged + localStats.rejected}
							</div>
							<p className="text-xs text-muted-foreground">
								{localStats.flagged} flagged • {localStats.rejected} rejected
							</p>
							{showDebug && (
								<div className="mt-1 text-xs text-gray-500">
									Debug: F={localStats.flagged} R={localStats.rejected}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* High Risk Alert */}
				{highRiskApps.length > 0 && (
					<Card className="border-red-500/50 bg-red-50">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-red-700">
								<AlertTriangle className="w-5 h-5" />
								High Risk Applications Detected ({highRiskApps.length})
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{highRiskApps.slice(0, 3).map((app) => (
									<div
										key={app.id}
										className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
									>
										<div>
											<p className="font-medium text-red-800">
												{app.organizationName}
											</p>
											<p className="text-sm text-red-600">
												{app.country} • Score: {app.riskAssessment?.score}/100 •
												Status: {app.status}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<Badge variant="destructive">
												{app.riskAssessment?.level.toUpperCase()} RISK
											</Badge>
											<Button size="sm" variant="destructive" asChild>
												<Link to={`/applications/${app.id}`}>
													Review <ArrowRight className="w-4 h-4 ml-1" />
												</Link>
											</Button>
										</div>
									</div>
								))}
								{highRiskApps.length > 3 && (
									<div className="text-center pt-2">
										<Button variant="link" className="text-red-600" asChild>
											<Link to="/applications?risk=high">
												View all {highRiskApps.length} high risk applications
												<ArrowRight className="ml-1 w-4 h-4" />
											</Link>
										</Button>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Recent Applications */}
				{recentApplications.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="w-5 h-5" />
								Recent Applications
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{recentApplications.map((app) => (
									<div
										key={app.id}
										className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
									>
										<div className="space-y-1">
											<p className="font-medium truncate max-w-[240px]">
												{app.organizationName}
											</p>
											<div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
												<span>{app.country}</span>
												<span>•</span>
												<Badge variant="outline" className="text-xs">
													{app.riskAssessment?.level} risk
												</Badge>
												<span>•</span>
												<Badge variant={
													app.status === "approved" ? "default" :
													app.status === "flagged" ? "destructive" :
													app.status === "rejected" ? "destructive" :
													"outline"
												} className="text-xs">
													{app.status}
												</Badge>
												<span>•</span>
												<span>
													{new Date(app.submittedAt).toLocaleDateString()}
												</span>
											</div>
										</div>
										<Button size="sm" variant="ghost" asChild>
											<Link to={`/applications/${app.id}`}>
												<Eye className="h-4 w-4" />
											</Link>
										</Button>
									</div>
								))}
							</div>
							<Button className="w-full mt-4" variant="outline" asChild>
								<Link to="/applications">
									View All Applications <ArrowRight className="ml-2 w-4 h-4" />
								</Link>
							</Button>
						</CardContent>
					</Card>
				)}
			</div>
		</DashboardLayout>
	);
};

export default Dashboard;