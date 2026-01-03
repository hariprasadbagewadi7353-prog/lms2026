import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DollarSign, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { PaymentModal } from "@/components/payment-modal";
import { queryClient } from "@/lib/queryClient";

interface FeeWithDetails {
  id: string;
  studentId: string;
  studentName: string;
  amount: string;
  type: string;
  description: string;
  status: string;
  dueDate: string;
  paidDate: string | null;
}

interface PaymentHistory {
  id: string;
  studentName: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  status: string;
}

export default function Fees() {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeWithDetails | null>(null);

  const { data: fees, isLoading: feesLoading } = useQuery<FeeWithDetails[]>({
    queryKey: ["/api/fees"],
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<PaymentHistory[]>({
    queryKey: ["/api/payments"],
  });

  const handlePayFee = (fee: FeeWithDetails) => {
    setSelectedFee(fee);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
    queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    setSelectedFee(null);
  };

  const pendingFees = fees?.filter(f => f.status === "pending") || [];
  const overdueFees = fees?.filter(f => f.status === "overdue") || [];
  const paidFees = fees?.filter(f => f.status === "paid") || [];

  const totalPending = pendingFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
  const totalOverdue = overdueFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Fees & Payments</h1>
        <p className="text-muted-foreground">
          Track outstanding fees and payment history
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingFees.length} unpaid {pendingFees.length === 1 ? 'fee' : 'fees'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Fees</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">₹{totalOverdue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overdueFees.length} overdue {overdueFees.length === 1 ? 'fee' : 'fees'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {payments?.length || 0} {payments?.length === 1 ? 'payment' : 'payments'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outstanding Fees</CardTitle>
        </CardHeader>
        <CardContent>
          {feesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : fees && fees.filter(f => f.status !== "paid").length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.filter(f => f.status !== "paid").map((fee) => {
                  const isOverdue = new Date(fee.dueDate) < new Date() && fee.status === "pending";
                  return (
                    <TableRow key={fee.id} className="hover-elevate" data-testid={`row-fee-${fee.id}`}>
                      <TableCell className="font-medium">{fee.studentName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{fee.type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{fee.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="font-semibold">{fee.amount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={isOverdue ? "text-destructive font-medium" : ""}>
                          {new Date(fee.dueDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isOverdue ? "destructive" : "secondary"}>
                          {isOverdue ? "Overdue" : fee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePayFee(fee)}
                          data-testid={`button-pay-fee-${fee.id}`}
                        >
                          Process Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No outstanding fees</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : payments && payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} className="hover-elevate" data-testid={`row-payment-${payment.id}`}>
                    <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{payment.studentName}</TableCell>
                    <TableCell>
                      <span className="font-semibold">${payment.amount}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No payment history</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedFee && (
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          amount={parseFloat(selectedFee.amount)}
          feeId={selectedFee.id}
          studentId={selectedFee.studentId}
          onSuccess={handlePaymentSuccess}
          title="Pay Fee"
          description={`Process payment for ${selectedFee.type} - ${selectedFee.description}`}
        />
      )}
    </div>
  );
}
