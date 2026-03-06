"use client";

import { useState, useMemo } from "react";
import type { AnalysisResponse } from "@/lib/types";
import { formatCurrency, formatCurrencyPrecise } from "@/lib/formatters";
import { DecisionCard } from "@/components/shared/DecisionCard";
import { MetricCard } from "@/components/shared/MetricCard";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function CustomerDetail({ data }: { data: AnalysisResponse }) {
  if (!data) return <EmptyState />;

  const { topCustomersByRevenue, customerPurchases, decisions } = data;
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");

  // All unique customer names for the select
  const customerNames = useMemo(() => {
    if (!topCustomersByRevenue) return [];
    return topCustomersByRevenue.map((c) => ({
      id: c.customer,
      name: c.customerName || c.customer
    }));
  }, [topCustomersByRevenue]);

  // Filtered purchases for the selected customer
  const filteredPurchases = useMemo(() => {
    if (!selectedCustomer || !customerPurchases) return [];
    // Match customer ID exactly
    return customerPurchases.filter((p) => p.customer === selectedCustomer);
  }, [selectedCustomer, customerPurchases]);

  // Total purchase value for selected customer
  const totalPurchaseValue = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + p.total, 0);
  }, [filteredPurchases]);

  if (!topCustomersByRevenue || topCustomersByRevenue.length === 0) {
    return (
      <EmptyState
        title="No customer data"
        message="Upload sales data to see customer purchase details."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">-- Select a customer --</option>
            {customerNames.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Purchase detail table */}
      {selectedCustomer && (
        <>
          <MetricCard
            label={`Total Purchases — ${customerNames.find(c => c.id === selectedCustomer)?.name || selectedCustomer}`}
            value={formatCurrency(totalPurchaseValue)}
            delta={`${filteredPurchases.length} invoices`}
            deltaDirection="neutral"
          />

          <Card>
            <CardHeader>
              <CardTitle>Purchase Records</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPurchases.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No purchase records found for this customer.
                </p>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPurchases.map((purchase) => (
                        <TableRow key={purchase.invoiceId}>
                          <TableCell>{purchase.issueDate}</TableCell>
                          <TableCell>{purchase.branch}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {purchase.invoiceNum}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrencyPrecise(purchase.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <DecisionCard
        decision={
          decisions.bp9 ??
          "Review individual customer purchase patterns for pricing opportunities."
        }
      />
    </div>
  );
}
