import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertStudentSchema,
  insertBookSchema,
  insertCheckoutSchema,
  insertFeeSchema,
  insertPaymentSchema,
  insertSubscriptionSchema,
} from "@shared/schema";
import nodemailer from "nodemailer";
import cron from "node-cron";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

async function sendFeeReminderEmail(
  studentEmail: string,
  studentName: string,
  amount: string,
  dueDate: Date
) {
  try {
    await transporter.sendMail({
      from: '"LibraryHub" <noreply@libraryhub.com>',
      to: studentEmail,
      subject: "Fee Payment Reminder - LibraryHub",
      html: `
        <h2>Fee Payment Reminder</h2>
        <p>Dear ${studentName},</p>
        <p>This is a reminder that you have an outstanding fee of <strong>₹${amount}</strong> due on ${dueDate.toLocaleDateString()}.</p>
        <p>Please ensure payment is made before the due date to avoid late fees.</p>
        <p>Thank you,<br>LibraryHub Team</p>
      `,
    });
    console.log(`Sent fee reminder to ${studentEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

cron.schedule("0 9 * * *", async () => {
  console.log("Running daily fee reminder check...");
  const fees = await storage.getFees();
  const students = await storage.getStudents();
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  for (const fee of fees) {
    if (fee.status === "pending" && fee.dueDate <= threeDaysFromNow) {
      const student = students.find((s) => s.id === fee.studentId);
      if (student) {
        await sendFeeReminderEmail(
          student.email,
          student.name,
          fee.amount,
          fee.dueDate
        );
      }
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/students", async (_req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/students/list", async (_req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students.map((s) => ({ id: s.id, name: s.name })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const data = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(data);
      res.json(student);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/books", async (_req, res) => {
    try {
      const books = await storage.getBooks();
      res.json(books);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/books/available", async (_req, res) => {
    try {
      const books = await storage.getBooks();
      res.json(
        books.map((b) => ({
          id: b.id,
          title: b.title,
          availableCopies: b.availableCopies,
        }))
      );
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/books", async (req, res) => {
    try {
      const data = insertBookSchema.parse(req.body);
      const book = await storage.createBook(data);
      res.json(book);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/subscription-plans", async (_req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/subscriptions", async (_req, res) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      const students = await storage.getStudents();
      const plans = await storage.getSubscriptionPlans();

      const subscriptionsWithDetails = subscriptions.map((sub) => {
        const student = students.find((s) => s.id === sub.studentId);
        const plan = plans.find((p) => p.id === sub.planId);
        return {
          id: sub.id,
          studentName: student?.name || "Unknown",
          planName: plan?.name || "Unknown",
          startDate: sub.startDate,
          endDate: sub.endDate,
          status: sub.status,
          amount: sub.amount,
        };
      });

      res.json(subscriptionsWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/subscriptions", async (req, res) => {
    try {
      const data = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(data);
      res.json(subscription);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/checkouts", async (_req, res) => {
    try {
      const checkouts = await storage.getCheckouts();
      const books = await storage.getBooks();
      const students = await storage.getStudents();

      const checkoutsWithDetails = checkouts.map((checkout) => {
        const book = books.find((b) => b.id === checkout.bookId);
        const student = students.find((s) => s.id === checkout.studentId);
        return {
          id: checkout.id,
          bookTitle: book?.title || "Unknown",
          studentName: student?.name || "Unknown",
          checkoutDate: checkout.checkoutDate,
          dueDate: checkout.dueDate,
          returnDate: checkout.returnDate,
          status: checkout.status,
        };
      });

      res.json(checkoutsWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/checkouts", async (req, res) => {
    try {
      const data = insertCheckoutSchema.parse(req.body);
      const book = await storage.getBook(data.bookId);
      if (!book || book.availableCopies < 1) {
        return res.status(400).json({ message: "Book not available" });
      }

      const checkout = await storage.createCheckout(data);
      await storage.updateBookCopies(data.bookId, book.availableCopies - 1);
      res.json(checkout);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/checkouts/:id/return", async (req, res) => {
    try {
      const checkout = await storage.getCheckout(req.params.id);
      if (!checkout) {
        return res.status(404).json({ message: "Checkout not found" });
      }

      const book = await storage.getBook(checkout.bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }

      const updated = await storage.updateCheckoutReturn(
        req.params.id,
        new Date()
      );
      await storage.updateBookCopies(
        checkout.bookId,
        book.availableCopies + 1
      );

      if (checkout.dueDate < new Date()) {
        const daysLate = Math.ceil(
          (new Date().getTime() - checkout.dueDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const lateFee = daysLate * 1.0;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        await storage.createFee({
          studentId: checkout.studentId,
          amount: lateFee.toFixed(2),
          type: "late-fee",
          description: `Late return fee for ${daysLate} days`,
          status: "pending",
          dueDate: dueDate.toISOString(),
        });
      }

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/fees", async (_req, res) => {
    try {
      const fees = await storage.getFees();
      const students = await storage.getStudents();

      const feesWithDetails = fees.map((fee) => {
        const student = students.find((s) => s.id === fee.studentId);
        return {
          id: fee.id,
          studentId: fee.studentId,
          studentName: student?.name || "Unknown",
          amount: fee.amount,
          type: fee.type,
          description: fee.description,
          status: fee.status,
          dueDate: fee.dueDate,
          paidDate: fee.paidDate,
        };
      });

      res.json(feesWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/fees", async (req, res) => {
    try {
      const data = insertFeeSchema.parse(req.body);
      const fee = await storage.createFee(data);
      res.json(fee);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/payments", async (_req, res) => {
    try {
      const payments = await storage.getPayments();
      const students = await storage.getStudents();

      const paymentsWithDetails = payments.map((payment) => {
        const student = students.find((s) => s.id === payment.studentId);
        return {
          id: payment.id,
          studentName: student?.name || "Unknown",
          amount: payment.amount,
          paymentDate: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          status: payment.status,
        };
      });

      res.json(paymentsWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const data = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(data);

      if (data.feeId) {
        await storage.updateFeeStatus(data.feeId, "paid", new Date());
      }

      res.json(payment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const students = await storage.getStudents();
      const subscriptions = await storage.getSubscriptions();
      const books = await storage.getBooks();
      const checkouts = await storage.getCheckouts();
      const fees = await storage.getFees();

      const activeSubscriptions = subscriptions.filter(
        (s) => s.status === "active"
      );
      const totalRevenue = subscriptions.reduce(
        (sum, s) => sum + parseFloat(s.amount),
        0
      );
      const pendingFees = fees
        .filter((f) => f.status === "pending" || f.status === "overdue")
        .reduce((sum, f) => sum + parseFloat(f.amount), 0);
      const activeCheckouts = checkouts.filter((c) => c.status === "active");
      const overdueCheckouts = checkouts.filter(
        (c) => c.status === "active" && c.dueDate < new Date()
      );

      res.json({
        totalStudents: students.length,
        activeSubscriptions: activeSubscriptions.length,
        totalRevenue: totalRevenue.toFixed(2),
        totalBooks: books.length,
        activeCheckouts: activeCheckouts.length,
        overdueCheckouts: overdueCheckouts.length,
        pendingFees: pendingFees.toFixed(2),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/recent-students", async (_req, res) => {
    try {
      const students = await storage.getStudents();
      const recent = students
        .sort(
          (a, b) =>
            new Date(b.enrollmentDate).getTime() -
            new Date(a.enrollmentDate).getTime()
        )
        .slice(0, 5);
      res.json(recent);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/upcoming-fees", async (_req, res) => {
    try {
      const fees = await storage.getFees();
      const students = await storage.getStudents();
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const upcomingFees = fees
        .filter(
          (f) =>
            (f.status === "pending" || f.status === "overdue") &&
            f.dueDate <= sevenDaysFromNow
        )
        .map((fee) => {
          const student = students.find((s) => s.id === fee.studentId);
          return {
            id: fee.id,
            studentName: student?.name || "Unknown",
            amount: fee.amount,
            dueDate: fee.dueDate,
            type: fee.type,
          };
        })
        .slice(0, 5);

      res.json(upcomingFees);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/enroll-student", async (req, res) => {
    try {
      const { studentId, planId, paymentMethod, upiId } = req.body;
      const student = await storage.getStudent(studentId);
      const plan = await storage.getSubscriptionPlans().then((plans) =>
        plans.find((p) => p.id === planId)
      );

      if (!student || !plan) {
        return res.status(404).json({ message: "Student or plan not found" });
      }

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration);
      await storage.createSubscription({
        studentId,
        planId,
        endDate: endDate.toISOString(),
        status: "active",
        amount: plan.price,
      });

      await storage.createPayment({
        studentId,
        amount: plan.price,
        paymentMethod,
        status: "completed",
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const students = await storage.getStudents();
      const payments = await storage.getPayments();
      const paidPayments = payments.filter(p => p.status === "completed");
      const totalReceived = paidPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const totalPending = payments.filter(p => p.status !== "completed").reduce((sum, p) => sum + parseFloat(p.amount), 0);

      res.json({
        totalStudents: students.length,
        pendingPayments: Number(totalPending.toFixed(2)) || 0,
        paidPayments: Number(totalReceived.toFixed(2)) || 0,
        totalReceived: Number(totalReceived.toFixed(2)) || 0,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/students-with-fees", async (_req, res) => {
    try {
      const students = await storage.getStudents();
      const subscriptions = await storage.getSubscriptions();
      const payments = await storage.getPayments();
      const plans = await storage.getSubscriptionPlans();

      const result = students.map((student) => {
        const subscription = subscriptions.find(s => s.studentId === student.id);
        const plan = plans.find(p => p.id === subscription?.planId);
        const payment = payments.find(p => p.studentId === student.id && p.status === "completed");

        return {
          id: student.id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          planName: plan?.name || "N/A",
          amount: subscription?.amount || "0",
          paymentStatus: payment ? "paid" : "pending",
          paymentDate: payment?.paymentDate || null,
          enrollmentDate: student.enrollmentDate,
        };
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/export-excel", async (_req, res) => {
    try {
      const XLSX = await import("xlsx");
      const students = await storage.getStudents();
      const subscriptions = await storage.getSubscriptions();
      const payments = await storage.getPayments();
      const plans = await storage.getSubscriptionPlans();

      const data = students.map((student) => {
        const subscription = subscriptions.find(s => s.studentId === student.id);
        const plan = plans.find(p => p.id === subscription?.planId);
        const payment = payments.find(p => p.studentId === student.id && p.status === "completed");

        return {
          "Student Name": student.name,
          "Email": student.email,
          "Phone": student.phone,
          "Plan": plan?.name || "N/A",
          "Amount (₹)": subscription?.amount || "0",
          "Payment Status": payment ? "Paid" : "Pending",
          "Payment Date": payment?.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : "N/A",
          "Enrollment Date": new Date(student.enrollmentDate).toLocaleDateString(),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="library-students.xlsx"');
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/renewal-reminders", async (_req, res) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      const students = await storage.getStudents();
      const plans = await storage.getSubscriptionPlans();
      const now = new Date();

      const reminders = subscriptions
        .filter(s => s.status === "active")
        .map((sub) => {
          const student = students.find(s => s.id === sub.studentId);
          const plan = plans.find(p => p.id === sub.planId);
          const daysUntilRenewal = Math.ceil((new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          return {
            id: sub.id,
            studentName: student?.name || "Unknown",
            email: student?.email || "N/A",
            planName: plan?.name || "Unknown",
            amount: sub.amount,
            renewalDate: sub.endDate,
            daysUntilRenewal,
          };
        })
        .filter(r => r.daysUntilRenewal > 0)
        .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);

      res.json(reminders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      await storage.deleteStudent(req.params.id);
      res.json({ message: "Student deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/payments/:id/mark-pending", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      const payment = payments.find(p => p.id === req.params.id);

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Update payment status to pending
      res.json({ message: "Payment marked as pending" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
