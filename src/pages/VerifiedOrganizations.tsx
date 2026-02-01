import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApplications } from '@/hooks/useApplications';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, CheckCircle, Building2, MapPin, Users, Eye } from 'lucide-react';

const VerifiedOrganizations = () => {
  const { verifiedOrgs, isLoading } = useApplications();
  const [search, setSearch] = useState('');

  const filteredOrgs = verifiedOrgs.filter(
    (org) =>
      org.organizationName.toLowerCase().includes(search.toLowerCase()) ||
      org.country.toLowerCase().includes(search.toLowerCase()) ||
      org.city.toLowerCase().includes(search.toLowerCase())
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            Verified Organizations
          </h1>
          <p className="text-muted-foreground mt-1">
            Approved and verified youth organizations
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Verified Organizations List */}
        {filteredOrgs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {verifiedOrgs.length === 0
                  ? 'No verified organizations yet'
                  : 'No organizations match your search'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrgs.map((org) => (
              <Card key={org.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{org.organizationName}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {org.city}, {org.country}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{org.memberCount.toLocaleString()} members</span>
                        </div>
                        <span className="text-muted-foreground">•</span>
                        <span>Est. {org.yearEstablished}</span>
                        <span className="text-muted-foreground">•</span>
                        <span>{org.leadership.length} leaders</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Verified
                      </Badge>
                      <Link to={`/applications/${org.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {verifiedOrgs.length > 0 && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-700">{verifiedOrgs.length}</p>
                  <p className="text-sm text-green-600">Total Verified</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {verifiedOrgs.reduce((acc, org) => acc + org.memberCount, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600">Total Members</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {new Set(verifiedOrgs.map((org) => org.country)).size}
                  </p>
                  <p className="text-sm text-green-600">Countries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VerifiedOrganizations;
