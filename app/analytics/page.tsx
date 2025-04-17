"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Colors for charts based on our new palette
const COLORS = [
  "#92374D", // magenta
  "#8C5383", // plum
  "#4A5899", // yinmn
  "#559CAD", // moonstone
  "#C1B2AB", // silver
  "#A85A6E", // magenta-light
  "#A46E9A", // plum-light
  "#6673B3", // yinmn-light
  "#76B1C0", // moonstone-light
  "#D4C9C4", // silver-light
]

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)
        const response = await fetch("/api/analytics")

        if (!response.ok) {
          throw new Error("Failed to fetch analytics data")
        }

        const data = await response.json()
        setAnalyticsData(data.data)
      } catch (error) {
        console.error("Error fetching analytics:", error)
        setError(error instanceof Error ? error.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-silver-light">
        <Loader2 className="h-8 w-8 animate-spin text-plum" />
        <p className="ml-2 text-gray-500">Loading analytics data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-silver-light">
        <div className="text-center">
          <p className="text-magenta mb-2">Error loading analytics data</p>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-silver-light">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  const { questionAnalytics, feedbackAnalytics, conversationMetrics } = analyticsData

  // Format data for charts
  const categoryData = questionAnalytics.categoryDistribution.map((item: any) => ({
    name: item.category,
    value: Number(item.count),
  }))

  const questionVolumeData = questionAnalytics.questionVolume.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString(),
    count: Number(item.count),
  }))

  const ratingDistributionData = feedbackAnalytics.ratingDistribution.map((item: any) => ({
    name: `${item.rating} Star${item.rating === 1 ? "" : "s"}`,
    value: Number(item.count),
  }))

  const ratingOverTimeData = feedbackAnalytics.ratingOverTime.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString(),
    rating: Number(item.average).toFixed(2),
  }))

  return (
    <div className="container mx-auto py-8 bg-silver-light min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-plum">Flo Analytics Dashboard</h1>

      <Tabs defaultValue="questions">
        <TabsList className="mb-6 bg-plum">
          <TabsTrigger value="questions" className="data-[state=active]:bg-magenta">
            Question Analytics
          </TabsTrigger>
          <TabsTrigger value="feedback" className="data-[state=active]:bg-magenta">
            Feedback Analytics
          </TabsTrigger>
          <TabsTrigger value="conversations" className="data-[state=active]:bg-magenta">
            Conversation Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-plum-light shadow-md">
              <CardHeader className="bg-gradient-to-r from-plum to-yinmn text-white">
                <CardTitle>Question Categories</CardTitle>
              </CardHeader>
              <CardContent className="h-80 bg-white">
                <ChartContainer
                  config={{
                    category: {
                      label: "Category",
                      color: "#8C5383", // plum
                    },
                  }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-plum-light shadow-md">
              <CardHeader className="bg-gradient-to-r from-plum to-yinmn text-white">
                <CardTitle>Question Volume Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-80 bg-white">
                <ChartContainer
                  config={{
                    count: {
                      label: "Questions",
                      color: "#4A5899", // yinmn
                    },
                  }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={questionVolumeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#4A5899" name="Questions" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-plum-light shadow-md">
              <CardHeader className="bg-gradient-to-r from-plum to-yinmn text-white">
                <CardTitle>Top Questions</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-plum-light">
                        <th className="text-left py-2 px-4 text-plum">Question</th>
                        <th className="text-left py-2 px-4 text-plum">Category</th>
                        <th className="text-left py-2 px-4 text-plum">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questionAnalytics.topQuestions.map((question: any, index: number) => (
                        <tr key={index} className="border-b border-silver">
                          <td className="py-2 px-4">{question.question}</td>
                          <td className="py-2 px-4">{question.category}</td>
                          <td className="py-2 px-4">{question.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-plum-light shadow-md">
              <CardHeader className="bg-gradient-to-r from-plum to-yinmn text-white">
                <CardTitle>Overall Satisfaction</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <div className="flex flex-col items-center justify-center h-60">
                  <div className="text-6xl font-bold text-magenta">
                    {Number(feedbackAnalytics.averageRating).toFixed(1)}
                  </div>
                  <div className="text-gray-500 mt-2">Average Rating (out of 5)</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-plum-light shadow-md">
              <CardHeader className="bg-gradient-to-r from-plum to-yinmn text-white">
                <CardTitle>Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-80 bg-white">
                <ChartContainer
                  config={{
                    value: {
                      label: "Count",
                      color: "#92374D", // magenta
                    },
                  }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ratingDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="value" fill="#92374D" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-plum-light shadow-md">
              <CardHeader className="bg-gradient-to-r from-plum to-yinmn text-white">
                <CardTitle>Rating Trend Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-80 bg-white">
                <ChartContainer
                  config={{
                    rating: {
                      label: "Average Rating",
                      color: "#559CAD", // moonstone
                    },
                  }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ratingOverTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 5]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="rating" stroke="#559CAD" name="Average Rating" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversations">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-plum-light shadow-md">
              <CardHeader className="bg-gradient-to-r from-plum to-yinmn text-white">
                <CardTitle>Average Messages</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <div className="flex flex-col items-center justify-center h-40">
                  <div className="text-5xl font-bold text-plum">
                    {Number(conversationMetrics.averageMetrics.avg_message_count).toFixed(1)}
                  </div>
                  <div className="text-gray-500 mt-2">Messages per Conversation</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-plum-light shadow-md">
              <CardHeader className="bg-gradient-to-r from-plum to-yinmn text-white">
                <CardTitle>Average Response Time</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <div className="flex flex-col items-center justify-center h-40">
                  <div className="text-5xl font-bold text-moonstone">
                    {Number(conversationMetrics.averageMetrics.avg_response_time).toFixed(2)}s
                  </div>
                  <div className="text-gray-500 mt-2">Seconds per Response</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-plum-light shadow-md">
              <CardHeader className="bg-gradient-to-r from-plum to-yinmn text-white">
                <CardTitle>Completion Rate</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <div className="flex flex-col items-center justify-center h-40">
                  <div className="text-5xl font-bold text-magenta">
                    {conversationMetrics.completionRate.total_count > 0
                      ? (
                          (conversationMetrics.completionRate.completed_count /
                            conversationMetrics.completionRate.total_count) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %
                  </div>
                  <div className="text-gray-500 mt-2">Conversations Completed</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
