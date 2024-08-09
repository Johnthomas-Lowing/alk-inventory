document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.querySelector('.report-grid tbody');
    const searchInput = document.getElementById('search-input');

    async function fetchReports() {
        try {
            const response = await fetch('/reports');
            if (!response.ok) throw new Error('Failed to fetch reports');

            const reports = await response.json();

            // Sort reports by created_at in descending order
            reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            displayReports(reports);
        } catch (err) {
            console.error('Error fetching reports:', err);
        }
    }

    document.getElementById('logo').addEventListener('click', function(){
        window.location.href = '/products.html';
    });

    function displayReports(reports) {
        tbody.innerHTML = '';

        reports.forEach(report => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${report._id}</td>
                <td>${report.username}</td>
                <td>${report.action}</td>
                <td>
                    <ul>
                        ${report.items.map(item => `
                            <li>${item.name} (${item.color}, ${item.size}) - Quantity: ${item.quantity}, Price: $${item.price.toFixed(2)}, Location: ${item.location}</li>
                        `).join('')}
                    </ul>
                </td>
                <td>$${report.totalPrice.toFixed(2)}</td>
                <td>${report.employeeName}</td>
                <td>${new Date(report.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                })} ${new Date(report.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })}</td>
            `;
            tbody.appendChild(row);
        });
    }

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = Array.from(row.children);
            const matches = cells.some(cell => cell.textContent.toLowerCase().includes(searchTerm));
            row.style.display = matches ? '' : 'none';
        });
    });

    fetchReports();
});
