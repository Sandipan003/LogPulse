"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClusters = void 0;
const logParser_1 = require("./logParser");
function updateClusters(clusters, message, severity, timestamp) {
    if (severity === 'ERROR' || severity === 'WARN') {
        const signature = (0, logParser_1.generateSignature)(message);
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
        if (timestamp)
            clusters[signature].latestTimestamp = timestamp;
        if (clusters[signature].samples.length < 5) {
            clusters[signature].samples.push(message.substring(0, 500));
        }
        return clusters[signature];
    }
    return null;
}
exports.updateClusters = updateClusters;
//# sourceMappingURL=errorCluster.js.map