import { eq, and, lte, sql } from "drizzle-orm";
import { db } from "./db";
import {
  students,
  books,
  subscriptions,
  subscriptionPlans,
  checkouts,
  fees,
  payments,
  type Student,
  type InsertStudent,
  type Book,
  type InsertBook,
  type Subscription,
  type InsertSubscription,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Checkout,
  type InsertCheckout,
  type Fee,
  type InsertFee,
  type Payment,
  type InsertPayment,
} from "@shared/schema";

export interface IStorage {
  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByEmail(email: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  deleteStudent(id: string): Promise<void>;
  updateStudentStripeInfo(
    id: string,
    customerId: string,
    subscriptionId: string
  ): Promise<Student>;

  getBooks(): Promise<Book[]>;
  getBook(id: string): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBookCopies(id: string, availableCopies: number): Promise<Book>;

  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;

  getSubscriptions(): Promise<Subscription[]>;
  getActiveSubscriptionByStudent(studentId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;

  getCheckouts(): Promise<Checkout[]>;
  getCheckout(id: string): Promise<Checkout | undefined>;
  createCheckout(checkout: InsertCheckout): Promise<Checkout>;
  updateCheckoutReturn(id: string, returnDate: Date): Promise<Checkout>;

  getFees(): Promise<Fee[]>;
  getFeesByStudent(studentId: string): Promise<Fee[]>;
  createFee(fee: InsertFee): Promise<Fee>;
  updateFeeStatus(id: string, status: string, paidDate?: Date): Promise<Fee>;

  getPayments(): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
}

export class DbStorage implements IStorage {
  async seedData() {
    const existingPlans = await db.select().from(subscriptionPlans);
    if (existingPlans.length === 0) {
      await db.insert(subscriptionPlans).values([
        {
          name: "Basic",
          price: "499",
          duration: 1,
          features: [
            "Borrow up to 3 books",
            "14-day checkout period",
            "Email support",
            "Access to digital catalog",
          ],
          stripePriceId: null,
        },
        {
          name: "Premium",
          price: "999",
          duration: 1,
          features: [
            "Borrow up to 10 books",
            "30-day checkout period",
            "Priority support",
            "Early access to new releases",
            "Hold up to 5 books",
          ],
          stripePriceId: null,
        },
        {
          name: "Annual",
          price: "9999",
          duration: 12,
          features: [
            "Unlimited book borrowing",
            "60-day checkout period",
            "24/7 priority support",
            "Exclusive events access",
            "Free late fee waivers (2x/year)",
          ],
          stripePriceId: null,
        },
      ]);
    }

    const existingBooks = await db.select().from(books);
    if (existingBooks.length === 0) {
      await db.insert(books).values([
        {
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          isbn: "978-0-7432-7356-5",
          category: "Fiction",
          totalCopies: 5,
          availableCopies: 3,
          publishedYear: 1925,
        },
        {
          title: "To Kill a Mockingbird",
          author: "Harper Lee",
          isbn: "978-0-06-112008-4",
          category: "Fiction",
          totalCopies: 4,
          availableCopies: 2,
          publishedYear: 1960,
        },
        {
          title: "1984",
          author: "George Orwell",
          isbn: "978-0-452-28423-4",
          category: "Fiction",
          totalCopies: 6,
          availableCopies: 4,
          publishedYear: 1949,
        },
        {
          title: "Sapiens",
          author: "Yuval Noah Harari",
          isbn: "978-0-06-231609-7",
          category: "Non-Fiction",
          totalCopies: 3,
          availableCopies: 1,
          publishedYear: 2011,
        },
        {
          title: "The Pragmatic Programmer",
          author: "Andrew Hunt",
          isbn: "978-0-13-595705-9",
          category: "Technology",
          totalCopies: 4,
          availableCopies: 4,
          publishedYear: 1999,
        },
      ]);
    }
  }

  async getStudents(): Promise<Student[]> {
    return await db.select().from(students);
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.id, id));
    return result[0];
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.email, email));
    return result[0];
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const result = await db.insert(students).values(insertStudent).returning();
    return result[0];
  }

  async deleteStudent(id: string): Promise<void> {
    // Delete dependent records in correct order
    await db.delete(fees).where(eq(fees.studentId, id));
    await db.delete(payments).where(eq(payments.studentId, id));
    await db.delete(checkouts).where(eq(checkouts.studentId, id));
    await db.delete(subscriptions).where(eq(subscriptions.studentId, id));
    // Finally delete the student
    await db.delete(students).where(eq(students.id, id));
  }

  async updateStudentStripeInfo(
    id: string,
    customerId: string,
    subscriptionId: string
  ): Promise<Student> {
    const result = await db
      .update(students)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
      })
      .where(eq(students.id, id))
      .returning();
    return result[0];
  }

  async getBooks(): Promise<Book[]> {
    return await db.select().from(books);
  }

  async getBook(id: string): Promise<Book | undefined> {
    const result = await db.select().from(books).where(eq(books.id, id));
    return result[0];
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const result = await db.insert(books).values(insertBook).returning();
    return result[0];
  }

  async updateBookCopies(id: string, availableCopies: number): Promise<Book> {
    const result = await db
      .update(books)
      .set({ availableCopies })
      .where(eq(books.id, id))
      .returning();
    return result[0];
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans);
  }

  async createSubscriptionPlan(
    insertPlan: InsertSubscriptionPlan
  ): Promise<SubscriptionPlan> {
    const result = await db.insert(subscriptionPlans).values(insertPlan).returning();
    return result[0];
  }

  async getSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions);
  }

  async getActiveSubscriptionByStudent(
    studentId: string
  ): Promise<Subscription | undefined> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.studentId, studentId),
          eq(subscriptions.status, "active")
        )
      );
    return result[0];
  }

  async createSubscription(
    insertSubscription: InsertSubscription
  ): Promise<Subscription> {
    const result = await db
      .insert(subscriptions)
      .values({
        ...insertSubscription,
        startDate: insertSubscription.startDate
          ? new Date(insertSubscription.startDate)
          : new Date(),
        endDate: new Date(insertSubscription.endDate),
      })
      .returning();
    return result[0];
  }

  async getCheckouts(): Promise<Checkout[]> {
    return await db.select().from(checkouts);
  }

  async getCheckout(id: string): Promise<Checkout | undefined> {
    const result = await db.select().from(checkouts).where(eq(checkouts.id, id));
    return result[0];
  }

  async createCheckout(insertCheckout: InsertCheckout): Promise<Checkout> {
    const result = await db
      .insert(checkouts)
      .values({
        ...insertCheckout,
        dueDate: new Date(insertCheckout.dueDate),
      })
      .returning();
    return result[0];
  }

  async updateCheckoutReturn(id: string, returnDate: Date): Promise<Checkout> {
    const result = await db
      .update(checkouts)
      .set({ returnDate, status: "returned" })
      .where(eq(checkouts.id, id))
      .returning();
    return result[0];
  }

  async getFees(): Promise<Fee[]> {
    return await db.select().from(fees);
  }

  async getFeesByStudent(studentId: string): Promise<Fee[]> {
    return await db.select().from(fees).where(eq(fees.studentId, studentId));
  }

  async createFee(insertFee: InsertFee): Promise<Fee> {
    const result = await db
      .insert(fees)
      .values({
        ...insertFee,
        dueDate: new Date(insertFee.dueDate),
      })
      .returning();
    return result[0];
  }

  async updateFeeStatus(
    id: string,
    status: string,
    paidDate?: Date
  ): Promise<Fee> {
    const result = await db
      .update(fees)
      .set({ status, paidDate: paidDate || null })
      .where(eq(fees.id, id))
      .returning();
    return result[0];
  }

  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments);
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(insertPayment).returning();
    return result[0];
  }
}

export const storage = new DbStorage();
storage.seedData().catch(console.error);
