export const mockAnalysisData = {
  summary: {
    totalLogs: 1042,
    errorCount: 89,
    warnCount: 156,
    infoCount: 797,
    unstructuredCount: 142,
    truncated: false
  },
  aiSummary: {
    rootCause: "Database Connection Pool Exhaustion",
    impact: "89 connection timeout errors occurred in a 5-minute window, causing API latency to spike.",
    recommendedFix: "1. Increase the max connection pool size in the DB config.\n2. Restart the API service.\n3. Check for unclosed DB connections in the recent auth service deployment."
  },
  clusters: [
    {
      id: "err-01",
      pattern: "Timeout waiting for a connection from pool",
      count: 45,
      severity: "ERROR",
      latestTimestamp: "2023-11-10T14:32:05Z"
    },
    {
      id: "err-02",
      pattern: "Connection refused via TCP to 10.0.1.45:5432",
      count: 24,
      severity: "ERROR",
      latestTimestamp: "2023-11-10T14:31:10Z"
    },
    {
      id: "err-03",
      pattern: "Query execution timeout after 5000ms",
      count: 20,
      severity: "ERROR",
      latestTimestamp: "2023-11-10T14:30:45Z"
    }
  ],
  timeline: {
    labels: ["14:25", "14:26", "14:27", "14:28", "14:29", "14:30", "14:31", "14:32", "14:33", "14:34"],
    datasets: [
      {
        label: "Errors",
        data: [2, 1, 0, 0, 5, 20, 24, 25, 10, 2],
        borderColor: "#ef4444", // red-500
        backgroundColor: "rgba(239, 68, 68, 0.2)"
      },
      {
        label: "Warnings",
        data: [5, 4, 6, 8, 12, 15, 28, 45, 20, 13],
        borderColor: "#f59e0b", // amber-500
        backgroundColor: "rgba(245, 158, 11, 0.2)"
      }
    ]
  }
};
