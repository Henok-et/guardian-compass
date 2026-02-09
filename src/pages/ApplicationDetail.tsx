import { AnimatePresence, motion } from "framer-motion";
import {
	LoadingSpinner,
	SkeletonCard,
	PageLoader,
	ActionLoadingOverlay,
} from "@/components/animation";
import { toast } from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { useApplications } from "@/hooks/useApplications";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getRiskBadgeColor, parseDOBToDate } from "@/lib/riskScoring";
import {
	ArrowLeft,
	Building2,
	MapPin,
	Mail,
	Phone,
	Globe,
	Users,
	Calendar,
	Shield,
	AlertTriangle,
	CheckCircle,
	XCircle,
	Flag,
	FileWarning,
	Download,
	AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { applicationTracker } from "@/services/applicationTracker";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/* eslint-disable @typescript-eslint/no-explicit-any */
const ApplicationDetail = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const {
		getApplicationById,
		approveApplication,
		rejectApplication,
		flagApplication,
		refetch,
		isLoading: hookIsLoading,
	} = useApplications();

	// Loading states
	const [isPageLoading, setIsPageLoading] = useState(true);
	const [isActionLoading, setIsActionLoading] = useState(false);
	const [isSanctionsLoading, setIsSanctionsLoading] = useState(true);
	const [progress, setProgress] = useState(0);

	// Dialog states
	const [showFlagDialog, setShowFlagDialog] = useState(false);
	const [showRejectDialog, setShowRejectDialog] = useState(false);
	const [flagNotes, setFlagNotes] = useState("");
	const [rejectReason, setRejectReason] = useState("");

	// Duplicate alert
	const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
	const [duplicateInfo, setDuplicateInfo] = useState<{
		isDuplicate: boolean;
		previousStatus?: "approved" | "flagged" | "rejected";
		previousDate?: string;
		matchingRecord?: any;
		reason?: string;
	} | null>(null);

	// Simulate loading delays (replace with your actual API calls)
	useEffect(() => {
		// Simulate initial page loading
		const pageTimer = setTimeout(() => {
			setIsPageLoading(false);
		}, 800);

		return () => {
			clearTimeout(pageTimer);
		};
	}, []);

	// Progress bar animation for sanctions check
	useEffect(() => {
		if (isPageLoading) return;

		let animationFrame: number;
		let startTime: number;
		const duration = 3000; // 3 seconds

		const animateProgress = (timestamp: number) => {
			if (!startTime) startTime = timestamp;
			const elapsed = timestamp - startTime;
			const newProgress = Math.min((elapsed / duration) * 100, 100);

			setProgress(newProgress);

			if (elapsed < duration) {
				animationFrame = requestAnimationFrame(animateProgress);
			} else {
				// Progress complete, show results after a small delay
				setTimeout(() => {
					setIsSanctionsLoading(false);
				}, 300);
			}
		};

		// Start the progress animation
		animationFrame = requestAnimationFrame(animateProgress);

		return () => {
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
			}
		};
	}, [isPageLoading]);

	const application = getApplicationById(id || "");

	// Check for duplicates on load
	useEffect(() => {
		if (application) {
			const duplicateCheck = applicationTracker.checkForDuplicates(application);
			if (duplicateCheck.isDuplicate) {
				// Non-blocking warning toast (generic call - no TS error)
				toast(
					<div className="text-sm">
						<strong>⚠️ Potential Duplicate Detected</strong>
						<br />
						Similar to a previously{" "}
						{duplicateCheck.previousStatus?.toUpperCase()} application
						<br />
						Date:{" "}
						{duplicateCheck.previousDate
							? new Date(duplicateCheck.previousDate).toLocaleDateString()
							: "Unknown"}
						<br />
						<small>
							{duplicateCheck.reason ||
								"Please review carefully before taking action."}
						</small>
					</div>,
					{
						icon: "⚠️",
						style: {
							border: "1px solid #fbbf24",
							background: "#fef3c7",
							color: "#92400e",
						},
						duration: 10000,
						position: "top-center",
					},
				);

				// Keep state for inline banner
				setDuplicateInfo(duplicateCheck);
			}
		}
	}, [application]);

	if (hookIsLoading || isPageLoading) {
		return (
			<DashboardLayout>
				<PageLoader message="Loading application details..." />
			</DashboardLayout>
		);
	}

	if (!application) {
		return (
			<DashboardLayout>
				<div className="text-center py-12">
					<p className="text-muted-foreground">Application not found</p>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => navigate("/applications")}
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Applications
					</Button>
				</div>
			</DashboardLayout>
		);
	}

	const { riskAssessment } = application;
	const isActionable = application.status === "pending";

	// Filter out invalid leadership entries
	const validLeadership = application.leadership.filter((leader) =>
		leader.name?.trim(),
	);

	// Format leader age and label
	const formatLeaderAgeLabel = (leader: { age?: number; dob?: string }) => {
		let ageNumber: number | null = null;
		if (typeof leader.age === "number" && Number.isFinite(leader.age)) {
			ageNumber = leader.age;
		} else if (leader.dob) {
			const d = parseDOBToDate(leader.dob);
			if (d) {
				const today = new Date();
				let age = today.getFullYear() - d.getFullYear();
				const m = today.getMonth() - d.getMonth();
				if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
				ageNumber = age;
			}
		}
		let label = "Unknown";
		if (ageNumber === null) {
			label = "Unknown";
		} else if (ageNumber < 0 || ageNumber > 120) {
			label = "Invalid Age";
		} else if (ageNumber >= 15 && ageNumber <= 35) {
			label = "Youth";
		} else {
			label = "Not Youth";
		}
		return `Age: ${ageNumber !== null ? ageNumber : leader.dob || "Unknown"} (${label})`;
	};

	// Enhanced action handlers with tracking
	const handleApprove = async () => {
		setIsActionLoading(true);
		try {
			// Update in your main applications hook
			approveApplication(application.id);

			// Track the approval
			applicationTracker.trackAction(
				application,
				"approved",
				"Application approved",
			);

			// Refresh all lists (this makes approved item disappear from pending)
			refetch();

			// Show success message (using toast instead of alert - better UX)
			toast.success("Organization approved successfully!");

			// Navigate to approved page
			navigate("/verified");
		} catch (err) {
			console.error(err);
			toast.error("Error approving application");
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleFlag = async () => {
		setIsActionLoading(true);
		try {
			// Update in your main applications hook
			flagApplication(application.id);

			// Track the flagging
			applicationTracker.trackAction(
				application,
				"flagged",
				flagNotes || "Flagged for investigation",
			);

			// Refresh lists
			refetch();

			// Success message
			toast.success("Application flagged for investigation!");

			// Navigate to flagged page
			navigate("/flagged");
		} catch (err) {
			console.error(err);
			toast.error("Error flagging application");
		} finally {
			setIsActionLoading(false);
			setShowFlagDialog(false);
			setFlagNotes("");
		}
	};

	const handleReject = async () => {
		setIsActionLoading(true);
		try {
			// Update in your main applications hook
			rejectApplication(application.id);

			// Track the rejection
			applicationTracker.trackAction(
				application,
				"rejected",
				rejectReason || "Application rejected",
			);

			// Refresh lists
			refetch();

			// Success message
			toast.success("Application rejected!");

			// Navigate back to applications
			navigate("/applications");
		} catch (err) {
			console.error(err);
			toast.error("Error rejecting application");
		} finally {
			setIsActionLoading(false);
			setShowRejectDialog(false);
			setRejectReason("");
		}
	};

	// Export function
	const handleExport = (type: "approved" | "flagged" | "rejected" | "all") => {
		applicationTracker.exportToExcel(type);
	};

	return (
		<DashboardLayout>
			{/* Flag Dialog */}
			<AlertDialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Flag for Investigation</AlertDialogTitle>
						<AlertDialogDescription>
							Please provide details about why this application needs
							investigation.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="space-y-3">
						<Label htmlFor="flag-notes">Investigation Notes</Label>
						<Textarea
							id="flag-notes"
							placeholder="Enter details about suspicious activity, missing information, or concerns..."
							value={flagNotes}
							onChange={(e) => setFlagNotes(e.target.value)}
							rows={4}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleFlag}
							disabled={!flagNotes.trim()}
						>
							Flag Application
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Reject Dialog */}
			<AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Reject Application</AlertDialogTitle>
						<AlertDialogDescription>
							Please provide the reason for rejection. This will help with
							future reference.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="space-y-3">
						<Label htmlFor="reject-reason">Rejection Reason</Label>
						<Textarea
							id="reject-reason"
							placeholder="Enter reason for rejection (e.g., incomplete information, high risk, sanctions match...)"
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							rows={4}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleReject}
							disabled={!rejectReason.trim()}
						>
							Reject Application
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AnimatePresence mode="wait">
				{isPageLoading ? (
					<PageLoader message="Loading application details..." />
				) : (
					<motion.div
						key="content"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4 }}
						className="space-y-6"
					>
						{/* Header */}
						<div className="flex items-start justify-between">
							<div>
								<Button
									variant="ghost"
									className="mb-2"
									onClick={() => navigate(-1)}
								>
									<ArrowLeft className="w-4 h-4 mr-2" />
									Back
								</Button>
								<h1 className="text-3xl md:text-4xl font-bold">
									{application.organizationName}
								</h1>
								<p className="text-muted-foreground mt-1">
									Application ID: {application.id} • Submitted:{" "}
									{new Date(application.submittedAt).toLocaleDateString()}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<Badge className={getRiskBadgeColor(riskAssessment.level)}>
									{riskAssessment.level.toUpperCase()} RISK
								</Badge>
								<Badge
									variant="outline"
									className="text-lg px-3 py-1 font-bold"
								>
									Score: {riskAssessment.score}/100
								</Badge>
							</div>
						</div>

						{duplicateInfo?.isDuplicate && (
							<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
								<div className="flex items-start gap-3">
									<AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
									<div>
										<p className="font-medium text-amber-800">
											Potential Duplicate Detected
										</p>
										<p className="text-sm text-amber-700 mt-1">
											Similar to a previously{" "}
											{duplicateInfo.previousStatus?.toUpperCase()} application
											on{" "}
											{duplicateInfo.previousDate
												? new Date(
														duplicateInfo.previousDate,
													).toLocaleDateString()
												: "unknown date"}
											.
										</p>
										{duplicateInfo.reason && (
											<p className="text-sm text-amber-700 mt-1">
												{duplicateInfo.reason}
											</p>
										)}
										<p className="text-sm text-amber-700 mt-2">
											Please review carefully before taking action.
										</p>
									</div>
								</div>
							</div>
						)}

						<div className="grid gap-6 lg:grid-cols-3">
							{/* Main Info */}
							<div className="lg:col-span-2 space-y-6">
								{/* Organization Details */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Building2 className="w-5 h-5" />
											Organization Details
										</CardTitle>
									</CardHeader>
									<CardContent className="grid gap-4 sm:grid-cols-2">
										<div className="flex items-center gap-3">
											<FileWarning className="w-4 h-4 text-muted-foreground" />
											<div>
												<p className="text-sm text-muted-foreground">
													Registration Number
												</p>
												<p className="font-medium">
													{application.registrationNumber || "Not provided"}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<MapPin className="w-4 h-4 text-muted-foreground" />
											<div>
												<p className="text-sm text-muted-foreground">
													Location
												</p>
												<p>
													{application.city === application.country
														? application.country
														: `${application.city}, ${application.country}`}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<Mail className="w-4 h-4 text-muted-foreground" />
											<div>
												<p className="text-sm text-muted-foreground">Email</p>
												<p className="font-medium">{application.email}</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<Phone className="w-4 h-4 text-muted-foreground" />
											<div>
												{application.phone && (
													<>
														<p className="text-sm text-muted-foreground">
															Phone
														</p>
														<p>{application.phone}</p>
													</>
												)}
											</div>
										</div>
										{application.website && (
											<div className="flex items-center gap-3">
												<Globe className="w-4 h-4 text-muted-foreground" />
												<div>
													<p className="text-sm text-muted-foreground">
														Website
													</p>
													<p className="font-medium">{application.website}</p>
												</div>
											</div>
										)}
										<div className="flex items-center gap-3">
											<Users className="w-4 h-4 text-muted-foreground" />
											<div>
												<p className="text-sm text-muted-foreground">
													Member Count
												</p>
												<p className="font-medium">
													{application.memberCount.toLocaleString()}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<Calendar className="w-4 h-4 text-muted-foreground" />
											<div>
												<p className="text-sm text-muted-foreground">
													Year Established
												</p>
												<p className="font-medium">
													{application.yearEstablished
														? new Date(
																application.yearEstablished,
															).getFullYear() || application.yearEstablished
														: "Not provided"}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Mission Statement */}
								<Card>
									<CardHeader>
										<CardTitle>Mission Statement</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-muted-foreground">
											{application.missionStatement || "Not provided"}
										</p>
									</CardContent>
								</Card>

								{/* Leadership Team */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Users className="w-5 h-5" />
											Leadership Team
										</CardTitle>
									</CardHeader>
									<CardContent>
										{validLeadership.length === 0 ? (
											<p className="text-muted-foreground text-center py-4">
												No leadership information available
											</p>
										) : (
											<div className="space-y-4">
												{validLeadership.map((leader, index) => (
													<motion.div
														key={index}
														initial={{ opacity: 0, y: 10 }}
														animate={{ opacity: 1, y: 0 }}
														transition={{ delay: index * 0.08 }}
														className={`border rounded-lg p-5 bg-muted/30 space-y-2 shadow-sm ${
															leader.isFinalDecisionMaker
																? "border-blue-500 bg-blue-50/70"
																: ""
														}`}
													>
														<div className="flex items-center gap-3 flex-wrap">
															<p className="font-semibold text-lg">
																{leader.name}
															</p>
															{leader.isFinalDecisionMaker && (
																<span className="text-sm text-blue-700 font-medium bg-blue-100 px-2.5 py-1 rounded-full">
																	Final Decision Maker
																</span>
															)}
														</div>

														{leader.role && (
															<p className="text-sm font-medium text-gray-700">
																{leader.role}
															</p>
														)}

														<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
															<span>{formatLeaderAgeLabel(leader)}</span>
															{leader.hasId && (
																<span className="text-green-600 font-medium">
																	✓ ID Verified
																</span>
															)}
														</div>
													</motion.div>
												))}
											</div>
										)}
									</CardContent>
								</Card>
							</div>

							{/* Sidebar - Risk Assessment */}
							<div className="space-y-6">
								{/* Risk Score */}
								<Card className="border-2 border-primary/20">
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Shield className="w-5 h-5" />
											Risk Assessment
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="text-center p-6 bg-muted rounded-lg">
											<p className="text-5xl font-bold">
												{riskAssessment.score}
											</p>
											<p className="text-muted-foreground mt-1">Risk Score</p>
											<Badge
												className={`mt-3 text-base ${getRiskBadgeColor(
													riskAssessment.level,
												)}`}
											>
												{riskAssessment.level.toUpperCase()} RISK
											</Badge>
										</div>

										<Separator />

										<div className="space-y-3">
											<h4 className="font-medium">Score Breakdown</h4>
											<div className="space-y-2 text-sm">
												<div className="flex justify-between">
													<span>Sanctions Match</span>
													<span
														className={
															riskAssessment.breakdown.sanctionsMatch > 0
																? "text-destructive font-medium"
																: ""
														}
													>
														+{riskAssessment.breakdown.sanctionsMatch}
													</span>
												</div>
												{/* ... other breakdown items ... */}
												<div className="flex justify-between">
													<span>Missing ID/Passport</span>
													<span
														className={
															riskAssessment.breakdown.missingId > 0
																? "text-yellow-600 font-medium"
																: ""
														}
													>
														+{riskAssessment.breakdown.missingId}
													</span>
												</div>
												{/* Add the rest of your breakdown items here */}
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Sanctions Check */}
								<Card
									className={
										riskAssessment.sanctionMatches.length > 0
											? "border-destructive bg-destructive/5"
											: ""
									}
								>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<AlertTriangle
												className={`w-5 h-5 ${
													riskAssessment.sanctionMatches.length > 0
														? "text-destructive"
														: ""
												}`}
											/>
											Sanctions Check
										</CardTitle>
									</CardHeader>
									<CardContent>
										<AnimatePresence mode="wait">
											{isSanctionsLoading ? (
												<motion.div
													key="loading"
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													className="space-y-4"
												>
													{/* Progress Bar Container */}
													<div className="space-y-2">
														<div className="flex justify-between text-sm">
															<span className="font-medium text-muted-foreground">
																Scanning UN Sanctions Databases...
															</span>
															<span className="font-semibold text-blue-600">
																{Math.round(progress)}%
															</span>
														</div>
														<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
															<motion.div
																className="h-full bg-blue-600 rounded-full"
																initial={{ width: "0%" }}
																animate={{ width: `${progress}%` }}
																transition={{ type: "tween", duration: 0.1 }}
															/>
														</div>
														<div className="flex justify-between text-xs text-muted-foreground">
															<span>Initializing scan</span>
															<span>Comparing against global watchlists</span>
														</div>
													</div>

													{/* Scanning Steps */}
													<div className="space-y-3 pt-2">
														<div className="flex items-center gap-2 text-sm">
															<div
																className={`w-2 h-2 rounded-full ${
																	progress > 20 ? "bg-green-500" : "bg-gray-300"
																}`}
															/>
															<span
																className={
																	progress > 20
																		? "text-gray-800"
																		: "text-gray-400"
																}
															>
																Querying UN Security Council lists
															</span>
														</div>
														<div className="flex items-center gap-2 text-sm">
															<div
																className={`w-2 h-2 rounded-full ${
																	progress > 50 ? "bg-green-500" : "bg-gray-300"
																}`}
															/>
															<span
																className={
																	progress > 50
																		? "text-gray-800"
																		: "text-gray-400"
																}
															>
																Checking OFAC and EU sanctions
															</span>
														</div>
														<div className="flex items-center gap-2 text-sm">
															<div
																className={`w-2 h-2 rounded-full ${
																	progress > 80 ? "bg-green-500" : "bg-gray-300"
																}`}
															/>
															<span
																className={
																	progress > 80
																		? "text-gray-800"
																		: "text-gray-400"
																}
															>
																Verifying name similarity matches
															</span>
														</div>
														<div className="flex items-center gap-2 text-sm">
															<div
																className={`w-2 h-2 rounded-full ${
																	progress === 100
																		? "bg-green-500"
																		: "bg-gray-300"
																}`}
															/>
															<span
																className={
																	progress === 100
																		? "text-gray-800"
																		: "text-gray-400"
																}
															>
																Finalizing results...
															</span>
														</div>
													</div>
												</motion.div>
											) : (
												<motion.div
													key="content"
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ duration: 0.5 }}
												>
													{riskAssessment.sanctionMatches.some(
														(m) =>
															m.inputName &&
															m.sanctionedName &&
															Number.isFinite(m.similarity),
													) ? (
														<div className="space-y-3">
															<div className="flex items-center gap-2 text-destructive mb-2">
																<AlertTriangle className="w-5 h-5" />
																<span className="font-semibold">
																	Sanctions Match Detected
																</span>
															</div>
															{riskAssessment.sanctionMatches
																.filter(
																	(m) =>
																		m.inputName &&
																		m.sanctionedName &&
																		Number.isFinite(m.similarity),
																)
																.map((match, index) => (
																	<motion.div
																		key={index}
																		initial={{ opacity: 0, scale: 0.95 }}
																		animate={{ opacity: 1, scale: 1 }}
																		transition={{ delay: index * 0.1 }}
																		className="p-4 bg-destructive/10 rounded-lg border border-destructive/20"
																	>
																		<p className="font-medium text-destructive mb-2">
																			⚠️ Match Found: {match.inputName}
																		</p>
																		<div className="grid grid-cols-1 gap-2 text-sm">
																			<div className="flex justify-between">
																				<span className="text-muted-foreground">
																					Input Name:
																				</span>
																				<span className="font-medium">
																					{match.inputName}
																				</span>
																			</div>
																			<div className="flex justify-between">
																				<span className="text-muted-foreground">
																					Sanctioned Name:
																				</span>
																				<span className="font-medium text-destructive">
																					{match.sanctionedName}
																				</span>
																			</div>
																			<div className="flex justify-between">
																				<span className="text-muted-foreground">
																					Match Confidence:
																				</span>
																				<span className="font-semibold">
																					{(match.similarity * 100).toFixed(1)}%
																				</span>
																			</div>
																		</div>
																	</motion.div>
																))}
														</div>
													) : (
														<motion.div
															initial={{ opacity: 0, scale: 0.95 }}
															animate={{ opacity: 1, scale: 1 }}
															transition={{ duration: 0.5 }}
															className="flex flex-col items-center gap-4 p-6"
														>
															<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
																<CheckCircle className="w-10 h-10 text-green-600" />
															</div>
															<div className="text-center space-y-1">
																<h3 className="font-semibold text-green-700 text-lg">
																	Clear
																</h3>
																<p className="text-sm text-muted-foreground">
																	No sanctions matches found across all
																	databases
																</p>
																<p className="text-xs text-muted-foreground">
																	Verified against UN, OFAC, EU, and 12+ global
																	watchlists
																</p>
															</div>
														</motion.div>
													)}
												</motion.div>
											)}
										</AnimatePresence>
									</CardContent>
								</Card>

								{/* Actions */}
								{isActionable ? (
									<Card className="relative">
										<CardHeader className="flex flex-row items-center justify-between">
											<CardTitle>Actions</CardTitle>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleExport("all")}
												className="gap-2"
											>
												<Download className="w-4 h-4" />
												Export All
											</Button>
										</CardHeader>
										<CardContent className="space-y-3">
											{/* Buttons */}
											<div
												className={`${
													isActionLoading
														? "opacity-60 pointer-events-none"
														: ""
												}`}
											>
												<Button className="w-full" onClick={handleApprove}>
													<CheckCircle className="w-4 h-4 mr-2" />
													Approve Organization
												</Button>
												<Button
													className="w-full mt-3"
													variant="outline"
													onClick={() => setShowFlagDialog(true)}
												>
													<Flag className="w-4 h-4 mr-2" />
													Flag for Investigation
												</Button>
												<Button
													className="w-full mt-3"
													variant="destructive"
													onClick={() => setShowRejectDialog(true)}
												>
													<XCircle className="w-4 h-4 mr-2" />
													Reject Application
												</Button>
											</div>

											{/* Loading overlay */}
											<AnimatePresence>
												{isActionLoading && <ActionLoadingOverlay />}
											</AnimatePresence>
										</CardContent>
									</Card>
								) : (
									<Card>
										<CardContent className="pt-6">
											<div className="text-center">
												<Badge
													className={
														application.status === "approved"
															? "bg-green-100 text-green-800"
															: application.status === "flagged"
																? "bg-yellow-100 text-yellow-800"
																: "bg-red-100 text-red-800"
													}
												>
													{application.status.toUpperCase()}
												</Badge>
												<p className="text-sm text-muted-foreground mt-2">
													This application has been processed
												</p>
												<Button
													variant="outline"
													size="sm"
													className="mt-3 gap-2"
													onClick={() =>
														handleExport(
															application.status as
																| "approved"
																| "flagged"
																| "rejected",
														)
													}
												>
													<Download className="w-4 h-4" />
													Export{" "}
													{application.status.charAt(0).toUpperCase() +
														application.status.slice(1)}{" "}
													Applications
												</Button>
											</div>
										</CardContent>
									</Card>
								)}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</DashboardLayout>
	);
};

export default ApplicationDetail;
