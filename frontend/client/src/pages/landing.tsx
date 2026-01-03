import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, LogIn } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur animate-slide-down">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold">LibraryHub</span>
          </div>
          <Link href="/login">
            <Button variant="outline" size="sm" data-testid="button-header-login">
              <LogIn className="h-4 w-4 mr-1" />
              Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-16 sm:py-24">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 animate-slide-down">
              Library Management
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Reimagined</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Complete solution for student enrollment, payment tracking, and automated renewals
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Link href="/enroll">
                <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/40 transition-shadow" data-testid="button-enroll">
                  <Users className="h-5 w-5 mr-2" />
                  Enroll Student
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="hover-elevate" data-testid="button-owner-login">
                  <LogIn className="h-5 w-5 mr-2" />
                  Owner Login
                </Button>
              </Link>
            </div>

            {/* Quick Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg bg-card border border-border hover-elevate transition-all cursor-default animate-stagger-1" style={{ animationDelay: "0.3s" }}>
                <div className="text-3xl mb-2 group inline-block">
                  <span className="group-hover:animate-bounce inline-block">📚</span>
                </div>
                <h3 className="font-semibold mb-1">Easy Enrollment</h3>
                <p className="text-sm text-muted-foreground">Aadhar & Seat tracking</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border hover-elevate transition-all cursor-default animate-stagger-2" style={{ animationDelay: "0.4s" }}>
                <div className="text-3xl mb-2 group inline-block">
                  <span className="group-hover:animate-bounce inline-block" style={{ animationDelay: "0.05s" }}>💰</span>
                </div>
                <h3 className="font-semibold mb-1">Payment Tracking</h3>
                <p className="text-sm text-muted-foreground">Cash & UPI support</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border hover-elevate transition-all cursor-default animate-stagger-3" style={{ animationDelay: "0.5s" }}>
                <div className="text-3xl mb-2 group inline-block">
                  <span className="group-hover:animate-bounce inline-block" style={{ animationDelay: "0.1s" }}>🔔</span>
                </div>
                <h3 className="font-semibold mb-1">Smart Reminders</h3>
                <p className="text-sm text-muted-foreground">Auto renewal alerts</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
