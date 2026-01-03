import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { SubscriptionPlan } from "@shared/schema";

interface Student {
  id: string;
  name: string;
}

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SubscriptionModal({
  open,
  onOpenChange,
  onSuccess,
}: SubscriptionModalProps) {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const { toast } = useToast();

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students/list"],
  });

  const { data: plans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: { studentId: string; planId: string }) => {
      const plan = plans?.find((p) => p.id === data.planId);
      if (!plan) throw new Error("Plan not found");

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration);

      return apiRequest("POST", "/api/subscriptions", {
        studentId: data.studentId,
        planId: data.planId,
        endDate: endDate.toISOString(),
        status: "active",
        amount: plan.price,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Subscription Activated",
        description: "Student subscription has been successfully activated.",
      });
      onSuccess();
      onOpenChange(false);
      setSelectedStudent("");
      setSelectedPlan("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedStudent || !selectedPlan) {
      toast({
        title: "Missing Information",
        description: "Please select both a student and a plan",
        variant: "destructive",
      });
      return;
    }

    createSubscriptionMutation.mutate({
      studentId: selectedStudent,
      planId: selectedPlan,
    });
  };

  const selectedPlanDetails = plans?.find((p) => p.id === selectedPlan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Activate Subscription</DialogTitle>
          <DialogDescription>
            Select a student and subscription plan to activate
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Student</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger data-testid="select-subscription-student">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students?.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Plan</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger data-testid="select-subscription-plan">
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {plans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.price}/{plan.duration === 1 ? "month" : "year"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlanDetails && (
            <div className="rounded-md border p-4">
              <p className="text-sm font-medium mb-2">Plan Features:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {selectedPlanDetails.features.map((feature, idx) => (
                  <li key={idx}>• {feature}</li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t">
                <p className="text-lg font-bold">
                  ${selectedPlanDetails.price} / {selectedPlanDetails.duration === 1 ? "month" : "year"}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-subscription"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedStudent || !selectedPlan || createSubscriptionMutation.isPending}
              data-testid="button-activate-subscription"
            >
              {createSubscriptionMutation.isPending ? "Activating..." : "Activate Subscription"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
