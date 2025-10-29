/**
 * Week 3 - UI Component 3: Pincode Pricing Dashboard Widget
 *
 * Central dashboard for pincode pricing management and monitoring.
 *
 * Location: Dashboard overview page
 * Features:
 * - Overall statistics (products, pincodes, prices)
 * - Coverage metrics (states, cities)
 * - Price distribution analytics
 * - Recent activity timeline
 * - Quick action buttons
 * - System health indicators
 */

import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Button, Text, Badge } from "@medusajs/ui";
import { useState, useEffect } from "react";

interface DashboardStats {
  overview: {
    total_products: number;
    total_pincodes: number;
    total_prices: number;
    last_updated: string;
  };
  coverage: {
    states: number;
    cities: number;
    top_states: Array<{ state: string; count: number }>;
  };
  price_analytics: {
    min_price: number;
    max_price: number;
    avg_price: number;
    min_formatted: string;
    max_formatted: string;
    avg_formatted: string;
  };
  health: {
    products_without_pricing: number;
    incomplete_coverage: number;
  };
}

interface RecentActivity {
  id: string;
  type: "upload" | "update" | "delete";
  description: string;
  timestamp: string;
  user?: string;
  details?: any;
}

const PincodePricingDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch statistics
        const statsResponse = await fetch(
          "/admin/pincode-pricing-v2/statistics",
          {
            credentials: "include",
          }
        );

        if (!statsResponse.ok) {
          throw new Error("Failed to fetch statistics");
        }

        const statsData = await statsResponse.json();
        setStats(statsData);

        // TODO: Fetch recent activity from API when available
        // For now, using mock data
        setRecentActivity([
          {
            id: "1",
            type: "upload",
            description: "Bulk price upload completed",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            details: { products: 150, prices: 1247 },
          },
          {
            id: "2",
            type: "update",
            description: "Prices updated for product SKU-123",
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "3",
            type: "upload",
            description: "CSV template downloaded",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "upload":
        return "📤";
      case "update":
        return "✏️";
      case "delete":
        return "🗑️";
      default:
        return "📝";
    }
  };

  if (loading) {
    return (
      <Container className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <Text className="text-red-800 font-medium">
            Error Loading Dashboard
          </Text>
          <Text className="text-red-600">{error}</Text>
        </div>
      </Container>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Container className="p-6 space-y-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1">Pincode Pricing Dashboard</Heading>
          <Text className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Manage and monitor product pricing across pincodes
          </Text>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/app/products")}
          >
            View Products
          </Button>
          <Button
            onClick={() => {
              // Scroll to upload widget on products page
              window.location.href = "/app/products#upload";
            }}
          >
            Upload Prices
          </Button>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <Text className="text-xs text-blue-600 uppercase font-medium">
              Products
            </Text>
            <span className="text-2xl">📦</span>
          </div>
          <Text className="text-3xl font-bold text-blue-900">
            {stats.overview.total_products.toLocaleString()}
          </Text>
          <Text className="text-xs text-blue-700 mt-1">
            with pricing configured
          </Text>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <Text className="text-xs text-green-600 uppercase font-medium">
              Pincodes
            </Text>
            <span className="text-2xl">📍</span>
          </div>
          <Text className="text-3xl font-bold text-green-900">
            {stats.overview.total_pincodes.toLocaleString()}
          </Text>
          <Text className="text-xs text-green-700 mt-1">covered locations</Text>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <Text className="text-xs text-purple-600 uppercase font-medium">
              Total Prices
            </Text>
            <span className="text-2xl">💰</span>
          </div>
          <Text className="text-3xl font-bold text-purple-900">
            {stats.overview.total_prices.toLocaleString()}
          </Text>
          <Text className="text-xs text-purple-700 mt-1">
            price configurations
          </Text>
        </div>

        <div className="p-4 bg-orange-50 border border-orange-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <Text className="text-xs text-orange-600 uppercase font-medium">
              Last Updated
            </Text>
            <span className="text-2xl">🕐</span>
          </div>
          <Text className="text-lg font-bold text-orange-900">
            {formatTimestamp(stats.overview.last_updated)}
          </Text>
          <Text className="text-xs text-orange-700 mt-1">
            latest price update
          </Text>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Coverage & Price Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Coverage Map */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <Heading level="h3">Geographic Coverage</Heading>
              <Badge color="blue">{stats.coverage.states} States</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded">
                <Text className="text-sm text-gray-600">States Covered</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {stats.coverage.states}
                </Text>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <Text className="text-sm text-gray-600">Cities Covered</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {stats.coverage.cities}
                </Text>
              </div>
            </div>

            {/* Top States */}
            <div>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Top States by Coverage
              </Text>
              <div className="space-y-2">
                {stats.coverage.top_states.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.state}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Badge size="small" color="grey">
                        #{idx + 1}
                      </Badge>
                      <Text className="text-sm font-medium">{item.state}</Text>
                    </div>
                    <Badge>{item.count} pincodes</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Price Analytics */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <Heading level="h3" className="mb-4">
              Price Distribution
            </Heading>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded text-center">
                <Text className="text-xs text-green-600 uppercase mb-1">
                  Minimum
                </Text>
                <Text className="text-2xl font-bold text-green-900">
                  {stats.price_analytics.min_formatted}
                </Text>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded text-center">
                <Text className="text-xs text-blue-600 uppercase mb-1">
                  Average
                </Text>
                <Text className="text-2xl font-bold text-blue-900">
                  {stats.price_analytics.avg_formatted}
                </Text>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded text-center">
                <Text className="text-xs text-purple-600 uppercase mb-1">
                  Maximum
                </Text>
                <Text className="text-2xl font-bold text-purple-900">
                  {stats.price_analytics.max_formatted}
                </Text>
              </div>
            </div>

            {/* Price Range Visualization */}
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <Text className="text-sm text-gray-600 mb-2">Price Range</Text>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"
                  style={{ width: "100%" }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <Text className="text-xs text-gray-500">
                  {stats.price_analytics.min_formatted}
                </Text>
                <Text className="text-xs text-gray-500">
                  {stats.price_analytics.max_formatted}
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Activity & Health */}
        <div className="space-y-6">
          {/* System Health */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <Heading level="h3" className="mb-4">
              System Health
            </Heading>

            <div className="space-y-3">
              {stats.health.products_without_pricing > 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span>⚠️</span>
                    <Text className="text-sm font-medium text-yellow-900">
                      Products Without Pricing
                    </Text>
                  </div>
                  <Text className="text-2xl font-bold text-yellow-900">
                    {stats.health.products_without_pricing}
                  </Text>
                  <Button
                    size="small"
                    variant="secondary"
                    className="mt-2 w-full"
                    onClick={() =>
                      (window.location.href = "/app/products?filter=no-pricing")
                    }
                  >
                    View Products
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center gap-2">
                    <span>✅</span>
                    <Text className="text-sm font-medium text-green-900">
                      All Products Have Pricing
                    </Text>
                  </div>
                </div>
              )}

              {stats.health.incomplete_coverage > 0 ? (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span>📍</span>
                    <Text className="text-sm font-medium text-orange-900">
                      Incomplete Coverage
                    </Text>
                  </div>
                  <Text className="text-2xl font-bold text-orange-900">
                    {stats.health.incomplete_coverage}
                  </Text>
                  <Text className="text-xs text-orange-700 mt-1">
                    products with partial pincode coverage
                  </Text>
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center gap-2">
                    <span>✅</span>
                    <Text className="text-sm font-medium text-green-900">
                      Complete Coverage
                    </Text>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <Heading level="h3" className="mb-4">
              Recent Activity
            </Heading>

            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3 bg-gray-50 rounded border-l-4 border-blue-500"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">
                        {getActivityIcon(activity.type)}
                      </span>
                      <div className="flex-1">
                        <Text className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </Text>
                        {activity.details && (
                          <Text className="text-xs text-gray-600 mt-1">
                            {activity.details.products &&
                              `${activity.details.products} products • `}
                            {activity.details.prices &&
                              `${activity.details.prices} prices`}
                          </Text>
                        )}
                        <Text className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(activity.timestamp)}
                        </Text>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <Text className="text-sm">No recent activity</Text>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <Heading level="h3" className="mb-4">
              Quick Actions
            </Heading>

            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => (window.location.href = "/app/products#upload")}
              >
                📤 Upload Prices
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={async () => {
                  const response = await fetch(
                    "/admin/pincode-pricing-v2/template",
                    {
                      credentials: "include",
                    }
                  );
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "pincode-pricing-template.csv";
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
              >
                📥 Download Template
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => (window.location.href = "/app/products")}
              >
                📦 View All Products
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded">
        <Text className="text-blue-800 dark:text-blue-200 font-medium mb-2">
          💡 Getting Started with Pincode Pricing
        </Text>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-200">
          <li>Download the CSV template using "Download Template" button</li>
          <li>Fill in prices for each product-pincode combination</li>
          <li>Upload the completed CSV file using "Upload Prices" button</li>
          <li>Monitor the dashboard for coverage and pricing insights</li>
        </ol>
      </div>
    </Container>
  );
};

// Widget configuration - show on dashboard
export const config = defineWidgetConfig({
  zone: "order.list.before", // Temporary zone, adjust based on your dashboard layout
});

export default PincodePricingDashboard;
