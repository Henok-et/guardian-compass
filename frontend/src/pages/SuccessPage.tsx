import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SuccessPage() {
	return (
		<DashboardLayout>
			<div className="min-h-[60vh] flex items-center justify-center p-4">
				<Card className="max-w-md w-full text-center border-success/20 shadow-lg mt-8">
					<CardHeader className="pt-8 pb-4">
						<div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
							<CheckCircle className="w-8 h-8 text-success" />
						</div>
						<CardTitle className="text-2xl font-bold">Application Submitted!</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6 pb-8">
						<p className="text-muted-foreground leading-relaxed">
							Thank you for registering with the African Union Women, Gender & Youth Directorate. 
							Your application is now under review. 
						</p>
						
						<div className="bg-muted/50 p-4 rounded-lg text-sm text-left border border-border/50">
							<h4 className="font-semibold text-foreground mb-2">What happens next?</h4>
							<ul className="space-y-2 text-muted-foreground">
								<li className="flex gap-2">
									<div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
									<span>Our team will verify your organization details and uploaded documents.</span>
								</li>
								<li className="flex gap-2">
									<div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
									<span>This process typically takes 3-5 business days.</span>
								</li>
								<li className="flex gap-2">
									<div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
									<span>You will receive an email notification once a decision is made.</span>
								</li>
							</ul>
						</div>

						<div className="pt-4">
							<Button asChild className="w-full">
								<Link to="/">
									Return to Homepage <ArrowRight className="w-4 h-4 ml-2" />
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}
