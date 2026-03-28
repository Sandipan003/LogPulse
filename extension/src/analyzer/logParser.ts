export interface LogEntry {
    timestamp: string | null;
    severity: string;
    message: string;
}

export interface LogFormat {
    name: string;
    regex?: RegExp;
    detect?: (line: string) => boolean;
    parse: (input: any) => LogEntry | null;
}

export const LOG_FORMATS: LogFormat[] = [
    {
        name: 'json',
        detect: (line) => line.trim().startsWith('{') && line.trim().endsWith('}'),
        parse: (line: string) => {
            try {
                const j = JSON.parse(line);
                return {
                    timestamp: j.timestamp || j.time || j.date || null,
                    severity: (j.level || j.severity || j.status || 'INFO').toUpperCase(),
                    message: j.message || j.msg || j.error || j.log || Object.values(j).join(' ')
                };
            } catch (e) { return null; }
        }
    },
    {
        name: 'web',
        regex: /^(\S+) \S+ \S+ \[(.*?)\] "(\S+) (\S+) \S+" (\d{3}) (\d+|-)/,
        parse: (match: RegExpMatchArray) => ({
            timestamp: match[2],
            severity: parseInt(match[5]) >= 400 ? 'ERROR' : 'INFO',
            message: `${match[3]} ${match[4]} returned ${match[5]}`
        })
    },
    {
        name: 'spring',
        regex: /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\s+(ERROR|WARN|INFO|DEBUG|TRACE)\s+\[(.*?)\]\s+(.*?)\s+:\s+(.*)/,
        parse: (match: RegExpMatchArray) => ({
            timestamp: match[1],
            severity: match[2],
            message: match[5]
        })
    },
    {
        name: 'generic',
        regex: /^\[(.*?)\]\s+(ERROR|WARN|INFO|DEBUG|FATAL|CRITICAL)\b(.*?):\s*(.*)/i,
        parse: (match: RegExpMatchArray) => ({
            timestamp: match[1],
            severity: match[2].toUpperCase(),
            message: match[4]
        })
    }
];

export function generateSignature(message: string): string {
    const exceptionMatch = message.match(/([a-zA-Z0-9.]+Exception|Error):/);
    if (exceptionMatch) return exceptionMatch[1];

    let sig = message;
    sig = sig.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '<IP>');
    sig = sig.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig, '<UUID>');
    sig = sig.replace(/\b\d+\b/g, '<NUM>');
    return sig.trim().substring(0, 150);
}
