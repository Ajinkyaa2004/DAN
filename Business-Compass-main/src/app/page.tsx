import Link from "next/link";
import {
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Expand,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Target,
    title: "BP1 \u2013 Segment Focus",
    description: "Identify which branch drives revenue and where to invest.",
  },
  {
    icon: TrendingUp,
    title: "BP2 \u2013 Target Setting",
    description:
      "Use 6 years of FY trends to set realistic growth targets.",
  },
  {
    icon: DollarSign,
    title: "BP3 \u2013 Cash & Outstanding",
    description: "Track billed vs outstanding and collection priorities.",
  },
  {
    icon: Users,
    title: "BP4 \u2013 Concentration Risk",
    description:
      "Understand customer dependency and diversification needs.",
  },
  {
    icon: Expand,
    title: "BP5 \u2013 Expansion",
    description:
      "Monitor secondary branch growth relative to primary.",
  },
  {
    icon: Calendar,
    title: "BP6 \u2013 Seasonality",
    description:
      "Identify peaks, troughs, and 12x seasonal swings.",
  },
  {
    icon: CheckCircle,
    title: "BP7 \u2013 On Track",
    description:
      "Live progress bar against FY target with Prophet forecasts.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
          Sales Analysis Dashboard
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
          Revenue intelligence, customer analytics, and forecasting for Connect
          Resources across multiple regions and territories.
        </p>
        <div className="mt-6 sm:mt-8 flex justify-center gap-4">
          <Link href="/setup">
            <Button size="lg" className="w-full sm:w-auto">Get Started</Button>
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="container mx-auto px-4 sm:px-6 pb-12 sm:pb-16 md:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {features.map((f) => (
            <Card key={f.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <f.icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary mb-3" />
                <h3 className="font-semibold text-sm sm:text-base text-foreground">{f.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {f.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
