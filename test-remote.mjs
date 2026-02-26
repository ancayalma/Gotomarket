
async function testEndpoint(url) {
    try {
        console.log('Testing:', url);
        const res = await fetch(url + '/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: '/_azure_ip_test', userAgent: 'diagnostic-script', visitorId: 'test-123' })
        });
        const text = await res.text();
        console.log(url, res.status, text);
    } catch(e) {
        console.error(url, e.message);
    }
}
await testEndpoint('https://basalt-cms.azurewebsites.net');
await testEndpoint('https://basalt-crm.azurewebsites.net');
