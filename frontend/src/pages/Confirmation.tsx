import React from "react";
import { Link } from "react-router-dom";

export default function Confirmation() {
	return (
		<div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-10">
			<h2 className="text-xl font-bold mb-4 text-green-700">
				Application Submitted
			</h2>
			<div className="mb-4 text-lg">
				Your application has been successfully submitted for verification.
			</div>
			<div className="mb-2 text-sm text-muted-foreground">
				AU officers will review your submission and notify you of the outcome.
			</div>
			<div className="mb-4 text-sm font-semibold">
				Application Status:{" "}
				<span className="text-blue-600">Pending Review</span>
			</div>
			<div className="mb-6">
				<Link to="/dashboard">
					<button className="btn btn-primary">Return to Dashboard</button>
				</Link>
			</div>
		</div>
	);
}
