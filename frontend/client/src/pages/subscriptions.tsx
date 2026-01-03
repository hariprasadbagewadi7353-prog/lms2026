import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, TrendingUp, Calendar, Plus } from "lucide-react";
import { SubscriptionModal } from "@/components/subscription-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionPlan, Subscription } from "@shared/schema";

interface SubscriptionWithDetails {
  id: string;
  studentName: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: string;
  amount: string;
}

export default function Subscriptions() {
  const [modalOpen, setModalOpen] = useState(false);

  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery<SubscriptionWithDetails[]>({
    queryKey: ["/api/subscriptions"],
  });

  const activeSubscriptions = subscriptions?.filter(s => s.status === "active") || [];
  const expiredSubscriptions = subscriptions?.filter(s => s.status === "expired") || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage library membership plans and student subscriptions
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} data-testid="button-activate-subscription">
          <Plus className="h-4 w-4 mr-2" />
          Activate Subscription
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Available Plans</h2>
        {plansLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        ) : plans && plans.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <Card
                key={plan.id}
                className={`relative hover-elevate ${index === 1 ? "border-primary" : ""}`}
              >
                {index === 1 && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge variant="default">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">₹{plan.price}</span>
                    <span className="text-muted-foreground">
                      /{plan.duration === 1 ? "month" : plan.duration === 12 ? "year" : `${plan.duration} months`}
                    </span>
                  </div>
                  <CardDescription className="mt-2">
                    {plan.duration === 1 ? "Monthly" : plan.duration === 12 ? "Annual" : "Multi-month"} membership
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2">
                        <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-6"
                    variant={index === 1 ? "default" : "outline"}
                    data-testid={`button-subscribe-${plan.name.toLowerCase()}`}
                  >
                    Subscribe
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <p>No subscription plans available</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle>Active Subscriptions</CardTitle>
            <Badge variant="default">{activeSubscriptions.length}</Badge>
          </CardHeader>
          <CardContent>
            {subscriptionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : activeSubscriptions.length > 0 ? (
              <div className="space-y-3">
                {activeSubscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                    data-testid={`active-subscription-${subscription.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{subscription.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.planName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">${subscription.amount}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Expires: {new Date(subscription.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No active subscriptions</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle>Recent Expirations</CardTitle>
            <Badge variant="secondary">{expiredSubscriptions.length}</Badge>
          </CardHeader>
          <CardContent>
            {subscriptionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : expiredSubscriptions.length > 0 ? (
              <div className="space-y-3">
                {expiredSubscriptions.slice(0, 5).map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                    data-testid={`expired-subscription-${subscription.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{subscription.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.planName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="destructive">Expired</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(subscription.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No expired subscriptions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SubscriptionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => {}}
      />
    </div>
  );
}
