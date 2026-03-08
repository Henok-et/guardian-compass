import { useState, useMemo, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { useApplications } from "@/hooks/useApplications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	LineChart,
	Line,
} from "recharts";
import {
	Globe,
	Clock,
	Eye,
	Users,
	CheckCircle,
	XCircle,
	AlertCircle,
	Search,
	Download,
} from "lucide-react";
import {
	calculateStatusData,
	calculateCountryData,
	calculateTimelineData,
	filterApplications,
	getRecentApplications,
	getAvailableCountries,
} from "@/lib/dashboardUtils";

// African countries list (unchanged)
const AFRICAN_COUNTRIES = [
	"Algeria",
	"Angola",
	"Benin",
	"Botswana",
	"Burkina Faso",
	"Burundi",
	"Cabo Verde",
	"Cameroon",
	"Central African Republic",
	"Chad",
	"Comoros",
	"Congo",
	"Côte d'Ivoire",
	"Djibouti",
	"Egypt",
	"Equatorial Guinea",
	"Eritrea",
	"Eswatini",
	"Ethiopia",
	"Gabon",
	"Gambia",
	"Ghana",
	"Guinea",
	"Guinea-Bissau",
	"Kenya",
	"Lesotho",
	"Liberia",
	"Libya",
	"Madagascar",
	"Malawi",
	"Mali",
	"Mauritania",
	"Mauritius",
	"Morocco",
	"Mozambique",
	"Namibia",
	"Niger",
	"Nigeria",
	"Rwanda",
	"São Tomé and Príncipe",
	"Senegal",
	"Seychelles",
	"Sierra Leone",
	"Somalia",
	"South Africa",
	"South Sudan",
	"Sudan",
	"Tanzania",
	"Togo",
	"Tunisia",
	"Uganda",
	"Zambia",
	"Zimbabwe",
];

// Colors for charts
const COLORS = {
	approved: "#22c55e",
	pending: "#eab308",
	rejected: "#ef4444",
	flagged: "#f97316",
	country: "#3b82f6",
};

const Dashboard = memo(() => {
	// the hook returns both the full list (named `applications`) and a
	// statistics object; rename the list here so it's obvious this is the
	// complete dataset used for charts/filters.
	const { applications: allApplications, isLoading, stats } = useApplications();
	const [selectedCountry, setSelectedCountry] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState<string>("");

	// We now rely on stats returned by the hook, which already combines
	// pending/all/flagged/rejected and is kept in sync with localStorage.
	// The `allApplications` value still holds the full set for charting and
	// filtering purposes.

	// Data for status pie chart
	const statusData = useMemo(() => {
		return [
			{ name: "Approved", value: stats.approved, color: COLORS.approved },
			{ name: "Pending", value: stats.pending, color: COLORS.pending },
			{ name: "Rejected", value: stats.rejected, color: COLORS.rejected },
			{ name: "Flagged", value: stats.flagged, color: COLORS.flagged },
		].filter((item) => item.value > 0);
	}, [stats]);

	// Data for country bar chart
	const countryData = useMemo(
		() => calculateCountryData(allApplications),
		[allApplications],
	);

	// Data for line chart (registrations over time)
	const timelineData = useMemo(
		() => calculateTimelineData(allApplications),
		[allApplications],
	);

	// Filtered applications for recent list
	const filteredApplications = useMemo(
		() =>
			filterApplications(
				allApplications,
				selectedCountry,
				searchQuery,
				AFRICAN_COUNTRIES,
			),
		[allApplications, selectedCountry, searchQuery],
	);

	// Recent applications (last 5)
	const recentApplications = useMemo(
		() => getRecentApplications(filteredApplications),
		[filteredApplications],
	);

	// Unique African countries in data
	const availableCountries = useMemo(
		() => getAvailableCountries(allApplications, AFRICAN_COUNTRIES),
		[allApplications],
	);

	// Export to CSV
	const exportToCSV = () => {
		const headers = [
			"Organization Name",
			"Email",
			"Country",
			"Registration Number",
			"Status",
			"Submitted At",
		];
		const rows = filteredApplications.map((app) => [
			app.organizationName || "",
			app.email || "",
			app.country || "",
			app.registrationNumber || "",
			app.status || "",
			app.submittedAt || "",
		]);
		const csvContent = [headers, ...rows]
			.map((row) => row.map((cell) => `"${cell}"`).join(","))
			.join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);
		link.setAttribute("href", url);
		link.setAttribute(
			"download",
			`applications_${new Date().toISOString().split("T")[0]}.csv`,
		);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	if (isLoading) {
		return (
			<DashboardLayout>
				<div className="space-y-8">
					{/* Header Skeleton */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="flex flex-col sm:flex-row gap-4">
							<Skeleton className="h-10 w-80" />
							<Skeleton className="h-10 w-48" />
						</div>
					</div>
					{/* Stats Cards Skeleton */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<Card key={i}>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-4 w-4" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-8 w-16 mb-1" />
									<Skeleton className="h-3 w-32" />
								</CardContent>
							</Card>
						))}
					</div>
					{/* Charts Skeleton */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
						<Card className="col-span-4">
							<CardHeader>
								<Skeleton className="h-6 w-32" />
							</CardHeader>
							<CardContent className="pl-2">
								<Skeleton className="h-64 w-full" />
							</CardContent>
						</Card>
						<Card className="col-span-3">
							<CardHeader>
								<Skeleton className="h-6 w-24" />
								<Skeleton className="h-4 w-40" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-64 w-full" />
							</CardContent>
						</Card>
					</div>
					{/* Recent Apps Skeleton */}
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-40" />
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{Array.from({ length: 5 }).map((_, i) => (
									<div key={i} className="flex items-center space-x-4">
										<Skeleton className="h-12 w-12 rounded-full" />
										<div className="space-y-2 flex-1">
											<Skeleton className="h-4 w-48" />
											<Skeleton className="h-3 w-32" />
										</div>
										<Skeleton className="h-6 w-16" />
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className="space-y-8" role="main">
				{/* Header + Country Filter */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
							<Input
								placeholder="Search organizations, emails, countries..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10 w-full sm:w-80"
							/>
						</div>
						<Select value={selectedCountry} onValueChange={setSelectedCountry}>
							<SelectTrigger className="w-full sm:w-48">
								<SelectValue placeholder="Select country" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Countries</SelectItem>
								{availableCountries.map((country) => (
									<SelectItem key={country} value={country}>
										{country}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col items-end gap-2">
						<h1 className="text-3xl font-bold">Registration Dashboard</h1>
						<p className="text-muted-foreground mt-1">
							Youth‑Led Organizations Across Africa
							{selectedCountry !== "all" && selectedCountry && (
								<span className="ml-2 font-medium text-primary">
									• {selectedCountry}
								</span>
							)}
						</p>
						<Button onClick={exportToCSV} variant="outline" size="sm">
							<Download className="w-4 h-4 mr-2" />
							Export CSV
						</Button>
					</div>

					<Select value={selectedCountry} onValueChange={setSelectedCountry}>
						<SelectTrigger className="w-[220px]">
							<div className="flex items-center gap-2">
								<Globe className="h-4 w-4" />
								<SelectValue placeholder="Filter by country" />
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Countries ({stats.total})</SelectItem>
							{availableCountries.map((country) => (
								<SelectItem key={country} value={country}>
									{country}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Stats Cards */}
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Total Registrations
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.total}</div>
							<p className="text-xs text-muted-foreground">
								All submitted applications
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Approved</CardTitle>
							<CheckCircle className="h-4 w-4 text-green-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-green-600">
								{stats.approved}
							</div>
							<p className="text-xs text-muted-foreground">
								Verified organizations
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Pending Review
							</CardTitle>
							<AlertCircle className="h-4 w-4 text-yellow-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-yellow-600">
								{stats.pending}
							</div>
							<p className="text-xs text-muted-foreground">Awaiting decision</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Rejected / Flagged
							</CardTitle>
							<XCircle className="h-4 w-4 text-red-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-red-600">
								{stats.rejected + stats.flagged}
							</div>
							<p className="text-xs text-muted-foreground">
								{stats.rejected} rejected • {stats.flagged} flagged
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Charts Row */}
				<div className="grid gap-6 lg:grid-cols-2">
					{/* Bar Chart: Registrations by Country */}
					<Card className="col-span-1">
						<CardHeader>
							<CardTitle className="text-lg">
								Registrations by Country
							</CardTitle>
						</CardHeader>
						<CardContent>
							{countryData.length > 0 ? (
								<ResponsiveContainer
									width="100%"
									height={300}
									aria-label="Bar chart showing registrations by country"
								>
									<BarChart
										data={countryData}
										layout="vertical"
										margin={{ left: 40 }}
									>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis type="number" />
										<YAxis dataKey="country" type="category" width={100} />
										<Tooltip />
										<Legend />
										<Bar
											dataKey="count"
											fill={COLORS.country}
											name="Organizations"
										/>
									</BarChart>
								</ResponsiveContainer>
							) : (
								<div className="flex items-center justify-center h-[300px] text-muted-foreground">
									No data to display
								</div>
							)}
						</CardContent>
					</Card>

					{/* Pie Chart: Status Distribution */}
					<Card className="col-span-1">
						<CardHeader>
							<CardTitle className="text-lg">Registration Status</CardTitle>
						</CardHeader>
						<CardContent>
							{statusData.length > 0 ? (
								<ResponsiveContainer
									width="100%"
									height={300}
									aria-label="Pie chart showing registration status distribution"
								>
									<PieChart>
										<Pie
											data={statusData}
											cx="50%"
											cy="50%"
											outerRadius={100}
											fill="#8884d8"
											dataKey="value"
											label={({ name, percent }) =>
												`${name} ${(percent * 100).toFixed(0)}%`
											}
										>
											{statusData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Pie>
										<Tooltip />
									</PieChart>
								</ResponsiveContainer>
							) : (
								<div className="flex items-center justify-center h-[300px] text-muted-foreground">
									No data to display
								</div>
							)}
						</CardContent>
					</Card>

					{/* Line Chart: Registrations Over Time (full width) */}
					<Card className="lg:col-span-2">
						<CardHeader>
							<CardTitle className="text-lg">Registrations Over Time</CardTitle>
						</CardHeader>
						<CardContent>
							{timelineData.length > 0 ? (
								<ResponsiveContainer
									width="100%"
									height={300}
									aria-label="Line chart showing registrations over time"
								>
									<LineChart
										data={timelineData}
										margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
									>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="month" />
										<YAxis />
										<Tooltip />
										<Legend />
										<Line
											type="monotone"
											dataKey="count"
											stroke="#3b82f6"
											activeDot={{ r: 8 }}
										/>
									</LineChart>
								</ResponsiveContainer>
							) : (
								<div className="flex items-center justify-center h-[300px] text-muted-foreground">
									No data to display
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Recent Applications */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Clock className="w-5 h-5" />
							Recent Registrations
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{recentApplications.length > 0 ? (
								recentApplications.map((app) => (
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
												<Badge
													variant={
														app.status === "approved"
															? "default"
															: app.status === "rejected" ||
																  app.status === "flagged"
																? "destructive"
																: "outline"
													}
													className="text-xs"
												>
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
								))
							) : (
								<div className="text-center py-8 text-muted-foreground">
									No recent applications
								</div>
							)}
						</div>
						<Button className="w-full mt-4" variant="outline" asChild>
							<Link to="/applications">
								View All Applications <Clock className="ml-2 w-4 h-4" />
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
});

export default Dashboard;
