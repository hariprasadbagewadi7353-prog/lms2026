import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, CreditCard, AlertCircle, CheckCircle, Download, Clock, Trash2, Search } from "lucide-react";
import { Search as SearchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalStudents: number;
  pendingPayments: number;
  paidPayments: number;
  totalReceived: number;
}

interface StudentWithFees {
  id: string;
  name: string;
  email: string;
  phone: string;
  aadharNumber?: string;
  seatNumber?: string;
  planName: string;
  amount: string;
  paymentStatus: "pending" | "paid";
  paymentDate: string | null;
  enrollmentDate: string;
}

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: students, isLoading: studentsLoading } = useQuery<StudentWithFees[]>({
    queryKey: ["/api/dashboard/students-with-fees"],
  });

  const filteredStudents = students?.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.seatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  ) || [];

  const markPendingMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await apiRequest("PATCH", `/api/payments/${studentId}/mark-pending`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/students-with-fees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Payment marked as pending",
        description: "Awaiting payment from student",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await apiRequest("DELETE", `/api/students/${studentId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/students-with-fees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Student removed",
        description: "Student has been successfully removed from the system",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExportExcel = async () => {
    try {
      const response = await fetch("/api/export-excel");
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "library-students.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Excel file downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export Excel file",
        variant: "destructive",
      });
    }
  };

  const statCards = [
    {
      title: "Total Students",
      value: stats?.totalStudents || 0,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Pending Payments",
      value: `₹${stats?.pendingPayments || 0}`,
      icon: AlertCircle,
      color: "text-orange-600",
    },
    {
      title: "Paid Payments",
      value: `₹${stats?.paidPayments || 0}`,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Total Received",
      value: `₹${stats?.totalReceived || 0}`,
      icon: CreditCard,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-slide-down">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Library management overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel} data-testid="button-export-excel">
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Link href="/enroll">
            <Button data-testid="button-add-new-student">
              Add Student
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <Card key={index} className={`hover-elevate animate-stagger-${index + 1}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{card.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Students & Payment Status</CardTitle>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or seat number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-dashboard"
            />
          </div>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : students && students.length > 0 && filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No students found matching your search</p>
            </div>
          ) : students && students.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Seat</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="font-mono text-sm">{student.seatNumber || "-"}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell>{student.planName}</TableCell>
                    <TableCell>₹{student.amount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={student.paymentStatus === "paid" ? "default" : "secondary"}
                          data-testid={`badge-status-${student.id}`}
                        >
                          {student.paymentStatus === "paid" ? "Paid" : "Pending"}
                        </Badge>
                        {student.paymentStatus === "pending" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markPendingMutation.mutate(student.id)}
                            disabled={markPendingMutation.isPending}
                            data-testid={`button-mark-pending-${student.id}`}
                            title="Mark as pending to wait for payment"
                          >
                            <Clock className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.paymentStatus === "paid" && student.paymentDate
                        ? new Date(student.paymentDate).toLocaleDateString()
                        : new Date(student.enrollmentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteStudentMutation.mutate(student.id)}
                        disabled={deleteStudentMutation.isPending}
                        data-testid={`button-delete-student-${student.id}`}
                        title="Remove student from system"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No students yet</p>
              <Link href="/enroll">
                <Button variant="outline" size="sm" className="mt-4" data-testid="button-add-first-student">
                  Add First Student
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
