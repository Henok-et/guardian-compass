import { Link } from 'react-router-dom';
import { useApplications } from '@/hooks/useApplications';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getRiskBadgeColor } from '@/lib/riskScoring';
import { Flag, XCircle, Building2, MapPin, Eye, AlertTriangle } from 'lucide-react';

const FlaggedApplications = () => {
  const { flaggedApps, rejectedApps, isLoading } = useApplications();

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
    apps: typeof flaggedApps,
    emptyMessage: string,
    icon: React.ReactNode
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
          <Card key={app.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{app.organizationName}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {app.city}, {app.country}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRiskBadgeColor(app.riskAssessment.level)}>
                      {app.riskAssessment.level.toUpperCase()} RISK
                    </Badge>
                    <Badge variant="outline">Score: {app.riskAssessment.score}</Badge>
                    {app.riskAssessment.sanctionMatches.length > 0 && (
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Sanctions Match
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={
                      app.status === 'flagged'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }
                  >
                    {app.status === 'flagged' ? 'Flagged' : 'Rejected'}
                  </Badge>
                  <Link to={`/applications/${app.id}`}>
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
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Flagged & Rejected</h1>
          <p className="text-muted-foreground mt-1">
            Applications requiring investigation or archived rejections
          </p>
        </div>

        <Tabs defaultValue="flagged" className="space-y-6">
          <TabsList>
            <TabsTrigger value="flagged" className="flex items-center gap-2">
              <Flag className="w-4 h-4" />
              Flagged ({flaggedApps.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejected ({rejectedApps.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flagged">
            {renderApplicationList(
              flaggedApps,
              'No flagged applications',
              <Flag className="w-12 h-12 text-muted-foreground mx-auto" />
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {renderApplicationList(
              rejectedApps,
              'No rejected applications',
              <XCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default FlaggedApplications;
