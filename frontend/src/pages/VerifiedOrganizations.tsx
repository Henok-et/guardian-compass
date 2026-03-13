import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApplications } from "@/hooks/useApplications";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Search,
	CheckCircle,
	Building2,
	MapPin,
	Users,
	Eye,
	Download,
	ArrowLeft,
	Calendar,
	Shield,
	FileText,
} from "lucide-react";
import { applicationTracker } from "@/services/applicationTracker";
import { getRiskBadgeColor } from "@/lib/riskScoring";

/* eslint-disable @typescript-eslint/no-explicit-any */

const VerifiedOrganizations = () => {
	const { verifiedOrgs, isLoading } = useApplications();
	const navigate = useNavigate();
	const [search, setSearch] = useState("");

	// Get tracked approved applications
	const trackedApprovedApps = applicationTracker.getApprovedApplications();

	// Combine both sources and remove duplicates
	const allVerifiedOrgs = [...verifiedOrgs, ...trackedApprovedApps];

	// Remove duplicates based on ID
	const uniqueOrgs = Array.from(
		new Map(allVerifiedOrgs.map((org) => [org.id, org])).values(),
	);

	const filteredOrgs = uniqueOrgs.filter(
		(org) =>
			org.organizationName.toLowerCase().includes(search.toLowerCase()) ||
			org.country.toLowerCase().includes(search.toLowerCase()) ||
			org.city?.toLowerCase().includes(search.toLowerCase()),
	);

	const handleExport = () => {
		applicationTracker.exportToExcel("approved");
	};

	const handleBack = () => {
		navigate("/applications");
	};

	if (isLoading && verifiedOrgs.length === 0) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-start justify-between">
					<div>
						<Button variant="ghost" className="mb-2" onClick={handleBack}>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Applications
						</Button>
						<h1 className="text-3xl font-bold flex items-center gap-3">
							<CheckCircle className="w-8 h-8 text-success" />
							Verified Organizations
						</h1>
						<p className="text-muted-foreground mt-1">
							Approved and verified youth organizations • {uniqueOrgs.length}{" "}
							total
						</p>
					</div>
					{uniqueOrgs.length > 0 && (
						<Button onClick={handleExport} variant="outline" className="gap-2">
							<Download className="w-4 h-4" />
							Export to Excel
						</Button>
					)}
				</div>

				{/* Search */}
				<div className="relative max-w-md">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
					<Input
						placeholder="Search organizations by name, country, or city..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-10"
					/>
				</div>

				{/* Verified Organizations List */}
				{filteredOrgs.length === 0 ? (
					<Card>
						<CardContent className="text-center py-12">
							<CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
							<h3 className="text-lg font-semibold mb-2">
								No verified organizations
							</h3>
							<p className="text-muted-foreground mb-4">
								{uniqueOrgs.length === 0
									? "No organizations have been approved yet. Approve applications to see them here."
									: "No organizations match your search"}
							</p>
							<Button onClick={handleBack}>Review Applications</Button>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4">
						{filteredOrgs.map((org) => (
							<Card
								key={org.id}
								className="hover:shadow-lg transition-all border-l-4 border-l-success"
							>
								<CardContent className="pt-6">
									<div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
										{/* Left Column - Organization Info */}
										<div className="space-y-4 flex-1">
											<div className="flex items-start gap-3">
												<div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
													<Building2 className="w-6 h-6 text-success" />
												</div>
												<div className="flex-1">
													<div className="flex flex-wrap items-center gap-2 mb-1">
														<h3 className="text-lg font-semibold">
															{org.organizationName}
														</h3>
														<Badge className="bg-success/10 text-success border-success/30">
															VERIFIED
														</Badge>
														{(org as any).actionDate && (
															<Badge variant="outline" className="text-xs">
																Approved:{" "}
																{new Date(
																	(org as any).actionDate,
																).toLocaleDateString()}
															</Badge>
														)}
													</div>
													<div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
														<MapPin className="w-4 h-4" />
														<span>
															{org.city}, {org.country}
														</span>
													</div>

													{/* Organization Details */}
													<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
														<div className="flex items-center gap-2">
															<Users className="w-4 h-4 text-muted-foreground" />
															<div>
																<p className="text-xs text-muted-foreground">
																	Members
																</p>
																<p className="font-medium">
																	{org.memberCount.toLocaleString()}
																</p>
															</div>
														</div>
														<div className="flex items-center gap-2">
															<Calendar className="w-4 h-4 text-muted-foreground" />
															<div>
																<p className="text-xs text-muted-foreground">
																	Established
																</p>
																<p className="font-medium">
																	{org.yearEstablished}
																</p>
															</div>
														</div>
														<div className="flex items-center gap-2">
															<Shield className="w-4 h-4 text-muted-foreground" />
															<div>
																<p className="text-xs text-muted-foreground">
																	Risk Score
																</p>
																<Badge
																	className={getRiskBadgeColor(
																		org.riskAssessment.level,
																	)}
																>
																	{org.riskAssessment.score}
																</Badge>
															</div>
														</div>
														<div className="flex items-center gap-2">
															<FileText className="w-4 h-4 text-muted-foreground" />
															<div>
																<p className="text-xs text-muted-foreground">
																	Leaders
																</p>
																<p className="font-medium">
																	{org.leadership?.length || 0}
																</p>
															</div>
														</div>
													</div>

													{/* Notes if available */}
													{(org as any).notes && (
														<div className="mt-3 p-2 bg-success/10 rounded-md border border-success/30">
															<p className="text-sm text-success">
																<span className="font-medium">
																	Approval Notes:{" "}
																</span>
																{(org as any).notes}
															</p>
														</div>
													)}
												</div>
											</div>
										</div>

										{/* Right Column - Actions */}
										<div className="flex flex-col gap-2 lg:w-auto w-full">
											<Link to={`/applications/${org.id}`}>
												<Button variant="outline" className="w-full gap-2">
													<Eye className="w-4 h-4" />
													View Full Details
												</Button>
											</Link>

											{/* Additional info for tracked apps */}
											{(org as any).registrationNumber && (
												<div className="text-sm text-muted-foreground mt-2">
													<p className="font-medium">
														Reg. No: {(org as any).registrationNumber}
													</p>
													<p className="text-xs">ID: {org.id}</p>
												</div>
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}

				{/* Stats */}
				{uniqueOrgs.length > 0 && (
					<Card className="bg-gradient-to-r from-success/10 to-primary/10 border-success/30">
						<CardContent className="pt-6">
							<h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
								<CheckCircle className="w-5 h-5" />
								Verification Statistics
							</h3>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
								<div className="text-center">
									<p className="text-3xl font-bold text-success">
										{uniqueOrgs.length}
									</p>
									<p className="text-sm text-success">Total Verified</p>
								</div>
								<div className="text-center">
									<p className="text-3xl font-bold text-green-700">
										{uniqueOrgs
											.reduce((acc, org) => acc + org.memberCount, 0)
											.toLocaleString()}
									</p>
									<p className="text-sm text-success">Total Members</p>
								</div>
								<div className="text-center">
									<p className="text-3xl font-bold text-green-700">
										{new Set(uniqueOrgs.map((org) => org.country)).size}
									</p>
									<p className="text-sm text-success">Countries</p>
								</div>
								<div className="text-center">
									<p className="text-3xl font-bold text-green-700">
										{
											uniqueOrgs.filter(
												(org) => org.riskAssessment.level === "low",
											).length
										}
									</p>
									<p className="text-sm text-green-600">Low Risk</p>
								</div>
							</div>

							{/* Average risk score */}
							{uniqueOrgs.length > 0 && (
								<div className="mt-4 pt-4 border-t border-green-200">
									<div className="flex items-center justify-between">
										<span className="text-sm text-green-700">
											Average Risk Score:
										</span>
										<span className="font-bold text-green-800">
											{Math.round(
												uniqueOrgs.reduce(
													(acc, org) => acc + org.riskAssessment.score,
													0,
												) / uniqueOrgs.length,
											)}
										</span>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				)}
			</div>
		</DashboardLayout>
	);
};

export default VerifiedOrganizations;
