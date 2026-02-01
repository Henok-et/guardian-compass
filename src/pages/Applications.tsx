import { Link } from 'react-router-dom';
import { useApplications } from '@/hooks/useApplications';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ApplicationCard from '@/components/applications/ApplicationCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Search, Filter } from 'lucide-react';

const Applications = () => {
  const { applications, isLoading } = useApplications();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.organizationName.toLowerCase().includes(search.toLowerCase()) ||
      app.country.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = riskFilter === 'all' || app.riskAssessment.level === riskFilter;
    return matchesSearch && matchesRisk;
  });

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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-muted-foreground mt-1">
            Review and process youth organization applications
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by organization name or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-2">
              {(['all', 'low', 'medium', 'high'] as const).map((level) => (
                <Badge
                  key={level}
                  variant={riskFilter === level ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setRiskFilter(level)}
                >
                  {level === 'all' ? 'All' : `${level.charAt(0).toUpperCase() + level.slice(1)} Risk`}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        {filteredApps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No applications found</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredApps.map((app) => (
              <Link key={app.id} to={`/applications/${app.id}`}>
                <ApplicationCard application={app} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Applications;
