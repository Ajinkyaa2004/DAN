"use client";

import { FileText, Users, DollarSign, Calendar, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import type { DatasetProfile } from "@/lib/validation";

interface DatasetProfileCardProps {
  profile: DatasetProfile;
}

export function DatasetProfileCard({ profile }: DatasetProfileCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Dataset Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Total Transactions */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="text-xs">Transactions</span>
            </div>
            <p className="text-base md:text-lg font-semibold break-words">
              {profile.totalInvoices.toLocaleString()}
            </p>
          </div>

          {/* Total Revenue */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4 shrink-0" />
              <span className="text-xs">Revenue</span>
            </div>
            <p className="text-base md:text-lg font-semibold break-words">
              {formatCurrency(profile.totalRevenue)}
            </p>
          </div>

          {/* Unique Customers */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 shrink-0" />
              <span className="text-xs">Customers</span>
            </div>
            <p className="text-base md:text-lg font-semibold break-words">
              {profile.uniqueCustomers.toLocaleString()}
            </p>
          </div>

          {/* Branches */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="text-xs">Branches</span>
            </div>
            <p className="text-base md:text-lg font-semibold">{profile.branches}</p>
          </div>

          {/* Date Range */}
          <div className="flex flex-col gap-1 col-span-2 md:col-span-3 xl:col-span-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="text-xs">Date Range</span>
            </div>
            <p className="text-xs md:text-sm font-medium">
              {profile.dateRange ? (
                <>
                  {new Date(profile.dateRange.start).toLocaleDateString()} -{" "}
                  {new Date(profile.dateRange.end).toLocaleDateString()}
                </>
              ) : (
                <span className="text-muted-foreground">Not detected</span>
              )}
            </p>
          </div>
        </div>

        {/* Feature Availability Badges */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          {profile.hasMultiYearData && (
            <Badge variant="outline" className="text-xs">
              ✓ Multi-Year Data
            </Badge>
          )}
          {profile.hasHistoricalData && (
            <Badge variant="outline" className="text-xs">
              ✓ Historical FY Data
            </Badge>
          )}
          {profile.hasDateColumn && (
            <Badge variant="outline" className="text-xs">
              ✓ Date Analysis
            </Badge>
          )}
          {profile.hasPaymentData && (
            <Badge variant="outline" className="text-xs">
              ✓ Payment Tracking
            </Badge>
          )}
          {!profile.hasDateColumn && (
            <Badge variant="secondary" className="text-xs opacity-60">
              Date Column Missing
            </Badge>
          )}
          {!profile.hasPaymentData && (
            <Badge variant="secondary" className="text-xs opacity-60">
              Payment Data Missing
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
