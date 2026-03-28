import { generateSignature } from './logParser';

export interface ErrorCluster {
    pattern: string;
    count: number;
    severity: string;
    latestTimestamp: string;
    samples: string[];
}

export function updateClusters(clusters: { [key: string]: ErrorCluster }, message: string, severity: string, timestamp: string | null) {
    if (severity === 'ERROR' || severity === 'WARN') {
        const signature = generateSignature(message);
        if (!clusters[signature]) {
            clusters[signature] = {
                pattern: signature,
                count: 0,
                severity: severity,
                latestTimestamp: timestamp || new Date().toISOString(),
                samples: []
            };
        }
        clusters[signature].count++;
        if (timestamp) clusters[signature].latestTimestamp = timestamp;
        if (clusters[signature].samples.length < 5) {
            clusters[signature].samples.push(message.substring(0, 500));
        }
        return clusters[signature];
    }
    return null;
}
