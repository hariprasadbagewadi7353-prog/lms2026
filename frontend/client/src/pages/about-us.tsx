import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Library, Users, Zap, Shield } from "lucide-react";

export default function AboutUs() {
  const features = [
    {
      icon: Library,
      title: "Library Management",
      description: "Complete digital management system for library operations and student memberships",
    },
    {
      icon: Users,
      title: "Student Tracking",
      description: "Efficient tracking of student enrollments, payments, and membership details",
    },
    {
      icon: Zap,
      title: "Automated Reminders",
      description: "Smart renewal reminders and fee notifications for timely payments",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Secure payment methods (Cash/UPI) with complete transaction records",
    },
  ];

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">About LibraryHub</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Modern library management system designed to simplify operations and enhance student engagement
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover-elevate">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle>Our Mission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground">
            LibraryHub is committed to transforming library management through intuitive technology. 
            We provide library owners with powerful tools to manage student memberships, track payments, 
            and maintain smooth operations.
          </p>
          <p className="text-foreground">
            Our platform supports multiple payment methods (Cash and UPI), automated renewal reminders, 
            and comprehensive data analytics to help you make informed decisions about your library operations.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid md:grid-cols-2 gap-4">
            {[
              "Easy student enrollment with seat number tracking",
              "Flexible payment options (Cash & UPI)",
              "Monthly, quarterly, and annual membership plans",
              "Automated fee payment reminders",
              "Real-time dashboard with payment analytics",
              "Export student data to Excel",
              "Subscription renewal tracking",
              "Contact information management",
            ].map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                  ✓
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="text-center space-y-2 py-8">
        <p className="text-sm text-muted-foreground">
          LibraryHub © 2024 • Simplifying Library Management
        </p>
      </div>
    </div>
  );
}
