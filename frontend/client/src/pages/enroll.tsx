import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentSchema, type InsertStudent, type SubscriptionPlan } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useLocation } from "wouter";

export default function Enroll() {
  const [, setLocation] = useLocation();
  const [planName, setPlanName] = useState<string>("");
  const [planAmount, setPlanAmount] = useState<string>("");
  const [planDuration, setPlanDuration] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi">("cash");
  const [upiId, setUpiId] = useState("");
  const { toast } = useToast();

  const form = useForm<InsertStudent>({
    resolver: zodResolver(insertStudentSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      studentId: "",
      aadharNumber: "",
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (data: InsertStudent) => {
      if (!planName || !planAmount || !planDuration) throw new Error("Please fill all plan details");
      
      const studentRes = await apiRequest("POST", "/api/students", data);
      const student = await studentRes.json();

      await apiRequest("POST", "/api/enroll-student", {
        studentId: student.id,
        planName,
        planAmount,
        planDuration: parseInt(planDuration),
        paymentMethod,
        upiId: paymentMethod === "upi" ? upiId : undefined,
      });

      return student;
    },
    onSuccess: (student) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Enrollment Successful",
        description: "Payment received. Access to LMS granted.",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertStudent) => {
    enrollMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Enroll to Library</h1>
            <p className="text-muted-foreground mb-8">
              Add student details and select a membership plan
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" data-testid="input-enroll-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="STU001" data-testid="input-enroll-studentid" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seatNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seat Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="A-101" data-testid="input-enroll-seat-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="john@example.com" data-testid="input-enroll-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+91 9876543210" data-testid="input-enroll-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aadharNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhar Number</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="1234 5678 9012" 
                          maxLength="14"
                          onChange={(e) => {
                            let value = e.target.value.replace(/\s/g, '');
                            if (value.length > 12) value = value.slice(0, 12);
                            const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                            field.onChange(value);
                            e.target.value = formatted;
                          }}
                          data-testid="input-enroll-aadhar" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label className="text-base font-semibold mb-3 block">Plan Details</Label>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="plan-name" className="text-sm">Plan Name</Label>
                      <Input
                        id="plan-name"
                        placeholder="e.g., Monthly Basic, Semester Plan"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        data-testid="input-plan-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="plan-amount" className="text-sm">Amount (₹)</Label>
                      <Input
                        id="plan-amount"
                        type="number"
                        placeholder="e.g., 499"
                        value={planAmount}
                        onChange={(e) => setPlanAmount(e.target.value)}
                        data-testid="input-plan-amount"
                      />
                    </div>
                    <div>
                      <Label htmlFor="plan-duration" className="text-sm">Duration (Months)</Label>
                      <Input
                        id="plan-duration"
                        type="number"
                        placeholder="e.g., 1"
                        value={planDuration}
                        onChange={(e) => setPlanDuration(e.target.value)}
                        data-testid="input-plan-duration"
                      />
                    </div>
                  </div>
                </div>

                {planName && planAmount && planDuration && (
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Payment Method</Label>
                    <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "cash" | "upi")}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="cash" data-testid="tab-enroll-cash">Cash</TabsTrigger>
                        <TabsTrigger value="upi" data-testid="tab-enroll-upi">UPI</TabsTrigger>
                      </TabsList>

                      <TabsContent value="cash" className="mt-4">
                        <Card className="p-4 bg-muted">
                          <p className="text-sm font-medium mb-2">Cash Payment</p>
                          <p className="text-xs text-muted-foreground">
                            Amount to collect: <span className="font-bold">₹{selectedPlanData?.price}</span>
                          </p>
                        </Card>
                      </TabsContent>

                      <TabsContent value="upi" className="mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="upi-id" className="text-sm">UPI ID (Optional)</Label>
                          <Input
                            id="upi-id"
                            placeholder="student@upi"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            data-testid="input-enroll-upi"
                          />
                          <p className="text-xs text-muted-foreground">
                            Amount: <span className="font-bold">₹{selectedPlanData?.price}</span>
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={enrollMutation.isPending || !planName || !planAmount || !planDuration}
                  data-testid="button-enroll-submit"
                >
                  {enrollMutation.isPending ? "Processing..." : "Complete Enrollment"}
                </Button>
              </form>
            </Form>
          </div>

          <div>
            {planName && planAmount && planDuration && (
              <Card className="sticky top-8 animate-slide-up">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="text-lg font-semibold">{planName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-lg font-semibold">
                      {planDuration === "1" ? "1 Month" : planDuration === "12" ? "1 Year" : `${planDuration} Months`}
                    </p>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Amount</span>
                      <span className="text-2xl font-bold">₹{planAmount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
