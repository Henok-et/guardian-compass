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
import { Globe, Clock, Eye, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";

// African countries list (unchanged)
const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros",
  "Congo", "Côte d'Ivoire", "Djibouti", "Egypt", "Equatorial Guinea",
  "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana",
  "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya",
  "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco",
  "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda",
  "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone",
  "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo",
  "Tunisia", "Uganda", "Zambia", "Zimbabwe",
];

// Colors for charts
const COLORS = {
  approved: "#22c55e",
  pending: "#eab308",
  rejected: "#ef4444",
  flagged: "#f97316",
  country: "#3b82f6",
};

const Dashboard = () => {
  const { applications, isLoading } = useApplications();
  const [selectedCountry, setSelectedCountry] = useState<string>("all");

  // Calculate stats
  const stats = useMemo(() => {
    const total = applications.length;
    const approved = applications.filter((a) => a.status === "approved").length;
    const pending = applications.filter((a) => a.status === "pending").length;
    const rejected = applications.filter((a) => a.status === "rejected").length;
    const flagged = applications.filter((a) => a.status === "flagged").length;

    return { total, approved, pending, rejected, flagged };
  }, [applications]);

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
  const countryData = useMemo(() => {
    const countryMap = new Map<string, number>();
    applications.forEach((app) => {
      if (app.country) {
        const count = countryMap.get(app.country) || 0;
        countryMap.set(app.country, count + 1);
      }
    });
    // Convert to array, sort by count descending, take top 10
    return Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [applications]);

  // Data for line chart (registrations over time)
  const timelineData = useMemo(() => {
    const months: { [key: string]: number } = {};
    applications.forEach((app) => {
      const date = new Date(app.submittedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months[monthKey] = (months[monthKey] || 0) + 1;
    });
    return Object.entries(months)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // last 12 months
  }, [applications]);

  // Filtered applications for recent list
  const filteredApplications = useMemo(() => {
    if (selectedCountry === "all") return applications;
    return applications.filter((app) => app.country === selectedCountry);
  }, [applications, selectedCountry]);

  // Recent applications (last 5)
  const recentApplications = useMemo(() => {
    return [...filteredApplications]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5);
  }, [filteredApplications]);

  // Unique African countries in data
  const availableCountries = useMemo(() => {
    const countries = new Set(applications.map((app) => app.country).filter(Boolean));
    return Array.from(countries)
      .filter((c) => AFRICAN_COUNTRIES.some((ac) => ac.toLowerCase() === c.toLowerCase()))
      .sort();
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header + Country Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Registration Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Youth‑Led Organizations Across Africa
              {selectedCountry !== "all" && selectedCountry && (
                <span className="ml-2 font-medium text-primary">• {selectedCountry}</span>
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
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All submitted applications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Verified organizations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting decision</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected / Flagged</CardTitle>
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
              <CardTitle className="text-lg">Registrations by Country</CardTitle>
            </CardHeader>
            <CardContent>
              {countryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={countryData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="country" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill={COLORS.country} name="Organizations" />
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
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" activeDot={{ r: 8 }} />
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
                              : app.status === "rejected" || app.status === "flagged"
                              ? "destructive"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {app.status}
                        </Badge>
                        <span>•</span>
                        <span>{new Date(app.submittedAt).toLocaleDateString()}</span>
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
};

export default Dashboard;