import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
  studentId: string;
  feeId?: string;
}

function PaymentForm({ amount, onSuccess, onCancel, studentId, feeId }: PaymentFormProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi">("cash");
  const [upiId, setUpiId] = useState("");

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      await apiRequest("POST", "/api/payments", {
        studentId,
        feeId,
        amount: amount.toFixed(2),
        paymentMethod,
        upiId: paymentMethod === "upi" ? upiId : undefined,
        status: "completed",
      });

      toast({
        title: "Payment Successful",
        description: `₹${amount.toFixed(2)} received via ${paymentMethod === "cash" ? "Cash" : "UPI"}`,
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePaymentSubmit} className="space-y-4">
      <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "cash" | "upi")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cash" data-testid="tab-cash-payment">Cash</TabsTrigger>
          <TabsTrigger value="upi" data-testid="tab-upi-payment">UPI</TabsTrigger>
        </TabsList>

        <TabsContent value="cash" className="space-y-4">
          <Card className="p-4 bg-muted">
            <p className="text-sm font-medium mb-2">Cash Payment</p>
            <p className="text-xs text-muted-foreground">
              Amount to be collected: <span className="font-bold">₹{amount.toFixed(2)}</span>
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="upi" className="space-y-4">
          <div>
            <Label htmlFor="upi-id" className="text-sm">UPI ID (Optional)</Label>
            <Input
              id="upi-id"
              placeholder="student@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              data-testid="input-upi-id"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Amount: <span className="font-bold">₹{amount.toFixed(2)}</span>
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          data-testid="button-cancel-payment"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isProcessing}
          data-testid="button-submit-payment"
        >
          {isProcessing ? "Processing..." : "Confirm Payment"}
        </Button>
      </div>
    </form>
  );
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  feeId?: string;
  studentId: string;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function PaymentModal({
  open,
  onOpenChange,
  amount,
  feeId,
  studentId,
  onSuccess,
  title = "Process Payment",
  description = "Select payment method",
}: PaymentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          <div className="text-2xl font-bold pt-2">₹{amount.toFixed(2)}</div>
        </DialogHeader>
        <PaymentForm
          amount={amount}
          onSuccess={() => {
            onSuccess();
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
          studentId={studentId}
          feeId={feeId}
        />
      </DialogContent>
    </Dialog>
  );
}
