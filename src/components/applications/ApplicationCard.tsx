import { ApplicationWithRisk } from '@/hooks/useApplications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRiskBadgeColor } from '@/lib/riskScoring';
import { Building2, MapPin, Users, AlertTriangle } from 'lucide-react';

interface ApplicationCardProps {
  application: ApplicationWithRisk;
}

const ApplicationCard = ({ application }: ApplicationCardProps) => {
  const { riskAssessment } = application;

  return (
    <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2">{application.organizationName}</CardTitle>
          <Badge className={getRiskBadgeColor(riskAssessment.level)}>
            {riskAssessment.level.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {application.city}, {application.country}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4 flex-shrink-0" />
          <span>{application.leadership.length} leaders</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-medium">Risk Score: {riskAssessment.score}</span>
          {riskAssessment.sanctionMatches.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Match
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard;
