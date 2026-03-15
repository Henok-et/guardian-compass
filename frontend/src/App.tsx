import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import ApplicationDetail from "./pages/ApplicationDetail";
import VerifiedOrganizations from "./pages/VerifiedOrganizations";
import FlaggedApplications from "./pages/FlaggedApplications";
import NotFound from "./pages/NotFound";
import Confirmation from "./pages/Confirmation";
import RegistrationForm from "./pages/RegistrationForm";
import SuccessPage from "./pages/SuccessPage";

const queryClient = new QueryClient();

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<Toaster />
			<Sonner />
			<BrowserRouter>
				<AuthProvider>
					<Routes>
						<Route path="/" element={<Login />} />
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route path="/register/confirmation" element={<Confirmation />} />
						<Route path="/registration-form" element={<RegistrationForm />} />
						<Route path="/success" element={<SuccessPage />} />
						<Route
							path="/dashboard"
							element={
								<ProtectedRoute>
									<Dashboard />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/applications"
							element={
								<ProtectedRoute>
									<Applications />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/applications/:id"
							element={
								<ProtectedRoute>
									<ApplicationDetail />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/verified"
							element={
								<ProtectedRoute>
									<VerifiedOrganizations />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/flagged"
							element={
								<ProtectedRoute>
									<FlaggedApplications />
								</ProtectedRoute>
							}
						/>
						<Route path="*" element={<NotFound />} />
					</Routes>
				</AuthProvider>
			</BrowserRouter>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;
