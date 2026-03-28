(function() {
    const vscode = acquireVsCodeApi();
    let chart;

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'STATUS':
                document.getElementById('status-text').innerText = message.message;
                break;
            case 'RESULT':
                document.getElementById('loading').classList.add('hidden');
                updateDashboard(message);
                break;
        }
    });

    function updateDashboard(data) {
        document.getElementById('stat-total').innerText = data.stats.totalLogs;
        document.getElementById('stat-errors').innerText = data.stats.errorCount;
        document.getElementById('stat-unique').innerText = data.clusters.length;

        // Render Summary
        const summary = data.aiSummary;
        document.getElementById('ai-summary').innerHTML = `
            <p><strong>Root Cause:</strong> ${summary.rootCause}</p>
            <p><strong>Technical Detail:</strong> ${summary.technicalDetails}</p>
            <p><strong>Downstream Impact:</strong> ${summary.impact}</p>
            <p><strong>Recommended Fixes:</strong></p>
            <ul>${summary.recommendedFix.map(f => `<li>${f}</li>`).join('')}</ul>
        `;

        // Render List
        const list = document.getElementById('clusters-list');
        list.innerHTML = data.clusters.map(c => `
            <div class="cluster-item">
                <span class="count">${c.count} hits</span>
                <div class="pattern">${c.pattern}</div>
            </div>
        `).join('');

        // Render Chart
        const labels = Object.keys(data.timeline).sort();
        const ctx = document.getElementById('timelineChart').getContext('2d');
        if (chart) chart.destroy();
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Errors Detected',
                    data: labels.map(l => data.timeline[l].errors),
                    borderColor: '#ef4444',
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}());
