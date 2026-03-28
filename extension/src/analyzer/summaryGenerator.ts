export interface AISummary {
    rootCause: string;
    technicalDetails: string;
    impact: string;
    recommendedFix: string[];
}

export async function generateOfflineSummary(clusters: any[], stats: any): Promise<AISummary> {
    // Rule-based heuristic summary for offline mode
    const topError = clusters[0];
    const totalErrors = stats.errorCount;
    
    let rootCause = "Stable environment detected.";
    let technicalDetails = "No critical patterns found in the analyzed log batch.";
    let impact = "Minimal risk to production services.";
    let recommendedFix = ["Continue monitoring system health."];

    if (totalErrors > 0 && topError) {
        rootCause = `High-frequency of ${topError.pattern} detected.`;
        technicalDetails = `We observed ${topError.count} occurrences of this issue. Error samples suggest potential failures in ${inferSystemArea(topError.samples[0])}.`;
        impact = `Potential degradation in ${inferImpactArea(topError.pattern)}. High count suggests systematic failure rather than transient error.`;
        recommendedFix = [
            `Check ${inferSystemArea(topError.samples[0])} configuration and status.`,
            `Investigate logs around ${topError.latestTimestamp} for correlation.`,
            `Validate network connectivity if timeout or connection errors persist.`
        ];
    }

    return { rootCause, technicalDetails, impact, recommendedFix };
}

function inferSystemArea(message: string): string {
    if (/sql|db|database|query|connection/i.test(message)) return "Database Layer";
    if (/auth|jwt|token|login|unauthorized/i.test(message)) return "Security & Auth";
    if (/timeout|network|socket|refused/i.test(message)) return "Network Infrastructure";
    if (/memory|null|pointer|stack/i.test(message)) return "Application Runtime";
    return "Core System";
}

function inferImpactArea(pattern: string): string {
    if (/db|sql/i.test(pattern)) return "Data Integrity and Availability";
    if (/timeout/i.test(pattern)) return "Service Latency and Throughput";
    return "Application Stability";
}
