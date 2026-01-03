import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCheckoutSchema, type InsertCheckout } from "@shared/schema";
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

interface CheckoutWithDetails {
  id: string;
  bookTitle: string;
  studentName: string;
  checkoutDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
}

export default function Checkouts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: checkouts, isLoading } = useQuery<CheckoutWithDetails[]>({
    queryKey: ["/api/checkouts"],
  });

  const { data: students } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/students/list"],
  });

  const { data: books } = useQuery<Array<{ id: string; title: string; availableCopies: number }>>({
    queryKey: ["/api/books/available"],
  });

  const form = useForm<InsertCheckout>({
    resolver: zodResolver(insertCheckoutSchema),
    defaultValues: {
      bookId: "",
      studentId: "",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertCheckout) => apiRequest("POST", "/api/checkouts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checkouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Book Checked Out",
        description: "Book has been successfully checked out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const returnMutation = useMutation({
    mutationFn: (checkoutId: string) => apiRequest("PATCH", `/api/checkouts/${checkoutId}/return`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checkouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Book Returned",
        description: "Book has been successfully returned.",
      });
    },
  });

  const onSubmit = (data: InsertCheckout) => {
    createMutation.mutate(data);
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status === "active" && new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Checkouts</h1>
          <p className="text-muted-foreground">
            Manage book checkouts and returns
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-checkout">
              <Plus className="h-4 w-4 mr-2" />
              New Checkout
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Checkout Book</DialogTitle>
              <DialogDescription>
                Select a student and book to create a checkout
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-checkout-student">
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students?.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bookId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Book</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-checkout-book">
                            <SelectValue placeholder="Select book" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {books?.filter(b => b.availableCopies > 0).map((book) => (
                            <SelectItem key={book.id} value={book.id}>
                              {book.title} ({book.availableCopies} available)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <input
                          type="date"
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          data-testid="input-checkout-due-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-checkout"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-checkout">
                    {createMutation.isPending ? "Processing..." : "Checkout"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Active & Recent Checkouts</h2>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : checkouts && checkouts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Checkout Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkouts.map((checkout) => (
                  <TableRow key={checkout.id} className="hover-elevate" data-testid={`row-checkout-${checkout.id}`}>
                    <TableCell className="font-medium">{checkout.bookTitle}</TableCell>
                    <TableCell>{checkout.studentName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(checkout.checkoutDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isOverdue(checkout.dueDate, checkout.status) && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span className={isOverdue(checkout.dueDate, checkout.status) ? "text-destructive font-medium" : ""}>
                          {new Date(checkout.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        checkout.status === "returned" ? "secondary" :
                        isOverdue(checkout.dueDate, checkout.status) ? "destructive" : "default"
                      }>
                        {checkout.status === "returned" ? "Returned" :
                         isOverdue(checkout.dueDate, checkout.status) ? "Overdue" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {checkout.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => returnMutation.mutate(checkout.id)}
                          disabled={returnMutation.isPending}
                          data-testid={`button-return-${checkout.id}`}
                        >
                          Return Book
                        </Button>
                      )}
                      {checkout.returnDate && (
                        <span className="text-sm text-muted-foreground">
                          Returned {new Date(checkout.returnDate).toLocaleDateString()}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No checkouts found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
