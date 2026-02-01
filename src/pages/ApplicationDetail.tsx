import { useParams, useNavigate } from 'react-router-dom';
import { useApplications } from '@/hooks/useApplications';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getRiskBadgeColor } from '@/lib/riskScoring';
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
  User,
  FileWarning,
} from 'lucide-react';

const ApplicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getApplicationById, approveApplication, rejectApplication, flagApplication } =
    useApplications();

  const application = getApplicationById(id || '');

  if (!application) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Application not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/applications')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const { riskAssessment } = application;
  const isActionable = application.status === 'pending';

  const handleApprove = () => {
    approveApplication(application.id);
    navigate('/verified');
  };

  const handleReject = () => {
    rejectApplication(application.id);
    navigate('/applications');
  };

  const handleFlag = () => {
    flagApplication(application.id);
    navigate('/flagged');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Button variant="ghost" className="mb-2" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">{application.organizationName}</h1>
            <p className="text-muted-foreground mt-1">
              Application ID: {application.id} • Submitted:{' '}
              {new Date(application.submittedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getRiskBadgeColor(riskAssessment.level)}>
              {riskAssessment.level.toUpperCase()} RISK
            </Badge>
            <Badge variant="outline" className="text-lg px-3 py-1">
              Score: {riskAssessment.score}/100
            </Badge>
          </div>
        </div>

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
                    <p className="text-sm text-muted-foreground">Registration Number</p>
                    <p className="font-medium">
                      {application.registrationNumber || 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">
                      {application.city}, {application.country}
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
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{application.phone}</p>
                  </div>
                </div>
                {application.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <p className="font-medium">{application.website}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Member Count</p>
                    <p className="font-medium">{application.memberCount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Year Established</p>
                    <p className="font-medium">{application.yearEstablished}</p>
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
                <p className="text-muted-foreground">{application.missionStatement}</p>
              </CardContent>
            </Card>

            {/* Leadership */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Leadership Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {application.leadership.map((leader, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{leader.name}</p>
                          <p className="text-sm text-muted-foreground">{leader.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Age: {leader.age}</Badge>
                        <Badge variant={leader.hasId ? 'default' : 'destructive'}>
                          {leader.hasId ? 'ID Verified' : 'No ID'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Risk Assessment */}
          <div className="space-y-6">
            {/* Risk Score Breakdown */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-4xl font-bold">{riskAssessment.score}</p>
                  <p className="text-muted-foreground">Risk Score</p>
                  <Badge className={`mt-2 ${getRiskBadgeColor(riskAssessment.level)}`}>
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
                          riskAssessment.breakdown.sanctionsMatch > 0 ? 'text-destructive font-medium' : ''
                        }
                      >
                        +{riskAssessment.breakdown.sanctionsMatch}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Missing ID/Passport</span>
                      <span
                        className={
                          riskAssessment.breakdown.missingId > 0 ? 'text-yellow-600 font-medium' : ''
                        }
                      >
                        +{riskAssessment.breakdown.missingId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>No Recent Activity</span>
                      <span
                        className={
                          riskAssessment.breakdown.noRecentActivity > 0 ? 'text-yellow-600 font-medium' : ''
                        }
                      >
                        +{riskAssessment.breakdown.noRecentActivity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Non-Youth Leadership</span>
                      <span
                        className={
                          riskAssessment.breakdown.nonYouthLeadership > 0
                            ? 'text-orange-600 font-medium'
                            : ''
                        }
                      >
                        +{riskAssessment.breakdown.nonYouthLeadership}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Incomplete Fields</span>
                      <span
                        className={
                          riskAssessment.breakdown.incompleteFields > 0 ? 'text-yellow-600 font-medium' : ''
                        }
                      >
                        +{riskAssessment.breakdown.incompleteFields}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sanctions Check Results */}
            <Card
              className={
                riskAssessment.sanctionMatches.length > 0 ? 'border-destructive bg-destructive/5' : ''
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle
                    className={`w-5 h-5 ${
                      riskAssessment.sanctionMatches.length > 0 ? 'text-destructive' : ''
                    }`}
                  />
                  Sanctions Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                {riskAssessment.sanctionMatches.length > 0 ? (
                  <div className="space-y-3">
                    {riskAssessment.sanctionMatches.map((match, index) => (
                      <div key={index} className="p-3 bg-destructive/10 rounded-lg text-sm">
                        <p className="font-medium text-destructive">Potential Match Found</p>
                        <p>
                          <span className="text-muted-foreground">Input:</span> {match.inputName}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Match:</span> {match.sanctionedName}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Similarity:</span>{' '}
                          {(match.similarity * 100).toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span>No sanctions matches found</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {isActionable && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" variant="default" onClick={handleApprove}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Organization
                  </Button>
                  <Button className="w-full" variant="outline" onClick={handleFlag}>
                    <Flag className="w-4 h-4 mr-2" />
                    Flag for Investigation
                  </Button>
                  <Button className="w-full" variant="destructive" onClick={handleReject}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Application
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isActionable && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Badge
                      className={
                        application.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : application.status === 'flagged'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {application.status.toUpperCase()}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      This application has been processed
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApplicationDetail;
