import { Link, useNavigate } from "react-router-dom";
import { useApplications } from "@/hooks/useApplications";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRiskBadgeColor } from "@/lib/riskScoring";
import {
	Flag,
	XCircle,
	Building2,
	MapPin,
	Eye,
	AlertTriangle,
	Download,
	CheckCircle,
	ArrowLeft,
} from "lucide-react";
import { applicationTracker } from "@/services/applicationTracker";
import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const FlaggedApplications = () => {
	const {
		flaggedApps: hookFlaggedApps,
		rejectedApps: hookRejectedApps,
		approveApplication,
		refetch,
		isLoading,
	} = useApplications();
	const navigate = useNavigate();
	const [processingId, setProcessingId] = useState<string | null>(null);

	// Primary source of truth is the backend-driven hook state.
	// The local tracker is kept only for backwards compatibility and export.
	const flaggedApps = hookFlaggedApps;
	const rejectedApps = hookRejectedApps;

	// Remove duplicates (same app might be in both hook and tracker)
	const uniqueFlaggedApps = Array.from(
		new Map(flaggedApps.map((app) => [app.id, app])).values(),
	);
	const uniqueRejectedApps = Array.from(
		new Map(rejectedApps.map((app) => [app.id, app])).values(),
	);

	const handleExport = (type: "flagged" | "rejected" | "all") => {
		applicationTracker.exportToExcel(type);
	};

	const handleApproveFromFlagged = async (appId: string) => {
		setProcessingId(appId);
		try {
			await approveApplication(appId);
			// Optionally keep local tracker data for backward compatibility
			const app = uniqueFlaggedApps.find((a) => a.id === appId);
			if (app) {
				applicationTracker.trackAction(
					app,
					"approved",
					"Approved after investigation",
				);
				applicationTracker.removeFromFlagged(appId);
			}
			// Refresh latest data from backend
			refetch();
			alert("Organization approved successfully!");
		} catch (err) {
			console.error(err);
			alert("Failed to approve application.");
		} finally {
			setProcessingId(null);
		}
	};

	if (isLoading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				</div>
			</DashboardLayout>
		);
	}

	const renderApplicationList = (
		apps: typeof uniqueFlaggedApps,
		emptyMessage: string,
		icon: React.ReactNode,
		type: "flagged" | "rejected",
	) => {
		if (apps.length === 0) {
			return (
				<Card>
					<CardContent className="text-center py-12">
						{icon}
						<p className="text-muted-foreground mt-4">{emptyMessage}</p>
					</CardContent>
				</Card>
			);
		}

		return (
			<div className="space-y-4">
				{apps.map((app) => (
					<Card
						key={app.id}
						className={`hover:border-primary/50 transition-colors ${
							type === "flagged"
								? "border-l-4 border-l-yellow-500"
								: "border-l-4 border-l-red-500"
						}`}
					>
						<CardContent className="pt-6">
							<div className="flex items-start justify-between">
								<div className="space-y-3">
									<div className="flex items-center gap-3">
										<div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
											<Building2 className="w-6 h-6 text-muted-foreground" />
										</div>
										<div>
											<h3 className="text-lg font-semibold">
												{app.organizationName}
											</h3>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<MapPin className="w-4 h-4" />
												{app.city}, {app.country}
											</div>
											<p className="text-sm text-muted-foreground mt-1">
												ID: {app.id} • Submitted:{" "}
												{new Date(app.submittedAt).toLocaleDateString()}
											</p>
											{app.actionDate && type === "flagged" && (
												<p className="text-sm text-yellow-600 mt-1">
													⚠️ Flagged on{" "}
													{new Date(app.actionDate).toLocaleDateString()}
												</p>
											)}
											{app.actionDate && type === "rejected" && (
												<p className="text-sm text-red-600 mt-1">
													❌ Rejected on{" "}
													{new Date(app.actionDate).toLocaleDateString()}
												</p>
											)}
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Badge
											className={getRiskBadgeColor(app.riskAssessment.level)}
										>
											{app.riskAssessment.level.toUpperCase()} RISK
										</Badge>
										<Badge variant="outline">
											Score: {app.riskAssessment.score}
										</Badge>
										{app.riskAssessment.sanctionMatches.length > 0 && (
											<Badge variant="destructive">
												<AlertTriangle className="w-3 h-3 mr-1" />
												Sanctions Match
											</Badge>
										)}
									</div>

									{/* Notes if available */}
									{(app as any).notes && (
										<div
											className={`mt-2 p-2 rounded text-sm ${
												type === "flagged"
													? "bg-yellow-50 text-yellow-700"
													: "bg-red-50 text-red-700"
											}`}
										>
											<span className="font-medium">Note: </span>
											{(app as any).notes}
										</div>
									)}
								</div>
								<div className="flex flex-col gap-2">
									<Badge
										className={
											type === "flagged"
												? "bg-yellow-100 text-yellow-800 border-yellow-200"
												: "bg-red-100 text-red-800 border-red-200"
										}
									>
										{type === "flagged" ? "FLAGGED" : "REJECTED"}
									</Badge>
									<div className="flex flex-col gap-2">
										<Link to={`/applications/${app.id}`}>
											<Button variant="outline" size="sm" className="w-full">
												<Eye className="w-4 h-4 mr-2" />
												View Details
											</Button>
										</Link>

										{/* Approve button for flagged applications */}
										{type === "flagged" && (
											<Button
												size="sm"
												className="w-full gap-2"
												onClick={() => handleApproveFromFlagged(app.id)}
												disabled={processingId === app.id}
											>
												{processingId === app.id ? (
													"Processing..."
												) : (
													<>
														<CheckCircle className="w-4 h-4" />
														Approve
													</>
												)}
											</Button>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	};

	return (
		<DashboardLayout>
			<div className="space-y-6">
				<div className="flex items-start justify-between">
					<div>
						<Button
							variant="ghost"
							className="mb-2"
							onClick={() => navigate("/applications")}
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Applications
						</Button>
						<h1 className="text-3xl font-bold">
							Flagged & Rejected Applications
						</h1>
						<p className="text-muted-foreground mt-1">
							Applications requiring investigation or archived rejections
						</p>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleExport("flagged")}
							className="gap-2"
						>
							<Download className="w-4 h-4" />
							Export Flagged
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleExport("rejected")}
							className="gap-2"
						>
							<Download className="w-4 h-4" />
							Export Rejected
						</Button>
					</div>
				</div>

				<Tabs defaultValue="flagged" className="space-y-6">
					<TabsList>
						<TabsTrigger value="flagged" className="flex items-center gap-2">
							<Flag className="w-4 h-4" />
							Flagged ({uniqueFlaggedApps.length})
						</TabsTrigger>
						<TabsTrigger value="rejected" className="flex items-center gap-2">
							<XCircle className="w-4 h-4" />
							Rejected ({uniqueRejectedApps.length})
						</TabsTrigger>
					</TabsList>

					<TabsContent value="flagged">
						{renderApplicationList(
							uniqueFlaggedApps,
							"No flagged applications requiring investigation.",
							<Flag className="w-12 h-12 text-muted-foreground mx-auto" />,
							"flagged",
						)}
					</TabsContent>

					<TabsContent value="rejected">
						{renderApplicationList(
							uniqueRejectedApps,
							"No rejected applications.",
							<XCircle className="w-12 h-12 text-muted-foreground mx-auto" />,
							"rejected",
						)}
					</TabsContent>
				</Tabs>

				{/* Export All button at bottom */}
				<div className="flex justify-center pt-4">
					<Button
						variant="outline"
						onClick={() => handleExport("all")}
						className="gap-2"
					>
						<Download className="w-4 h-4" />
						Export All Flagged & Rejected Applications
					</Button>
				</div>
			</div>
		</DashboardLayout>
	);
};

export default FlaggedApplications;
