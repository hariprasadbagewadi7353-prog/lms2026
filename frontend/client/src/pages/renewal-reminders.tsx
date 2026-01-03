import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Calendar, User, DollarSign } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RenewalReminder {
  id: string;
  studentName: string;
  email: string;
  planName: string;
  amount: string;
  renewalDate: string;
  daysUntilRenewal: number;
}

export default function RenewalReminders() {
  const { data: reminders, isLoading } = useQuery<RenewalReminder[]>({
    queryKey: ["/api/renewal-reminders"],
  });

  const urgentReminders = reminders?.filter(r => r.daysUntilRenewal <= 7) || [];
  const upcomingReminders = reminders?.filter(r => r.daysUntilRenewal > 7) || [];

  const StatTable = ({ title, icon: Icon, data, isEmpty }: any) => (
    <Card className="hover-elevate">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2 pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Icon className="h-5 w-5" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No students</p>
          </div>
        ) : data.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Renewal Date</TableHead>
                  <TableHead>Days Left</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((reminder: RenewalReminder) => (
                  <TableRow key={reminder.id} className="text-xs">
                    <TableCell className="font-medium">{reminder.studentName}</TableCell>
                    <TableCell className="truncate">{reminder.email}</TableCell>
                    <TableCell>₹{reminder.amount}</TableCell>
                    <TableCell>{new Date(reminder.renewalDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{reminder.daysUntilRenewal} days</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="animate-slide-down">
        <h1 className="text-3xl font-bold tracking-tight">Renewal Reminders</h1>
        <p className="text-muted-foreground mt-1">Track upcoming student subscription renewals</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="animate-stagger-1">
          <StatTable 
            title={`Total Renewals (${reminders?.length || 0})`}
            icon={Bell}
            data={reminders || []}
            isEmpty={!reminders || reminders.length === 0}
          />
        </div>

        <div className="animate-stagger-2">
          <StatTable 
            title={`Urgent - Next 7 Days (${urgentReminders.length})`}
            icon={Calendar}
            data={urgentReminders}
            isEmpty={urgentReminders.length === 0}
          />
        </div>

        <div className="animate-stagger-3">
          <StatTable 
            title={`Upcoming (${upcomingReminders.length})`}
            icon={DollarSign}
            data={upcomingReminders}
            isEmpty={upcomingReminders.length === 0}
          />
        </div>
      </div>

      {reminders && reminders.length > 0 && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex h-3 w-3 rounded-full bg-primary"></span>
              All Renewal Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Renewal Date</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.map((reminder) => (
                    <TableRow key={reminder.id} data-testid={`row-renewal-${reminder.id}`}>
                      <TableCell className="font-medium">{reminder.studentName}</TableCell>
                      <TableCell>{reminder.email}</TableCell>
                      <TableCell>{reminder.planName}</TableCell>
                      <TableCell>₹{reminder.amount}</TableCell>
                      <TableCell>{new Date(reminder.renewalDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={reminder.daysUntilRenewal <= 7 ? "destructive" : "secondary"}
                        >
                          {reminder.daysUntilRenewal} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={reminder.daysUntilRenewal <= 7 ? "destructive" : "default"}>
                          {reminder.daysUntilRenewal <= 7 ? "Urgent" : "Upcoming"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
