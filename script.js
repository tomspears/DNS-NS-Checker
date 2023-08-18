// script.js
document.addEventListener('DOMContentLoaded', function () {
    const domainForm = document.getElementById('domainForm');
    const resultDiv = document.getElementById('result');
    const downloadLink = document.getElementById('downloadLink');

    const csvData = [['Domain', 'NS Records']]; // CSV header

    domainForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent form submission
        const domainInput = document.getElementById('domainInput').value;
        const domainNames = domainInput.split('\n').map(line => line.trim());
        lookupDomains(domainNames);
    });

    const allowedNSStrings = [
        'pdns206.ultradns',
        'pdns1.ultradns',
        'pdns2.ultradns',
        'pdns3.ultradns',
        'pdns4.ultradns',
        'pdns5.ultradns',
        'pdns6.ultradns',
        'pdns11.ultradns',
        'udns1.cscdns',
        'udns2.cscdns'
        // ... (add other allowed nameserver strings???)
    ];

    function lookupDomains(domains) {
        resultDiv.innerHTML = ''; // Clear previous results
        csvData.length = 1; // Reset CSV data, keeping the header

        domains.forEach(domain => {
            if (domain) { // Skip empty lines
                lookupDomain(domain);
            }
        });
    }

    function lookupDomain(domain) {
        const apiUrl = `https://networkcalc.com/api/dns/lookup/${domain}`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                displayDomainResult(domain, data);
            })
            .catch(error => {
                console.error(`Error fetching data for ${domain}:`, error);
                displayDomainResult(domain, { status: 'Error', message: 'An error occurred while fetching data.' });
            });
    }

    function displayDomainResult(domain, data) {
        const nsRecords = data.records.NS;

        // Check if any NS record contains allowed strings
        const hasAllowedNS = nsRecords.some(nsRecord => {
            return allowedNSStrings.some(allowedString => nsRecord.nameserver.includes(allowedString));
        });
        
        // TO-DO: Handle cases where domains point away - show confirmation and add to sheet?
        

        if (hasAllowedNS) {
            const nsRecordValues = nsRecords.map(nsRecord => nsRecord.nameserver).join(', ');
            csvData.push([domain, nsRecordValues]); // Add data to CSV array

            const domainResult = document.createElement('div');
            domainResult.innerHTML = `<h3>${domain}</h3>`;

            domainResult.innerHTML += `<ul>`;
            nsRecords.forEach(nsRecord => {
                domainResult.innerHTML += `<li>${nsRecord.nameserver}</li>`;
            });
            domainResult.innerHTML += `</ul>`;

            resultDiv.appendChild(domainResult);
        }
    }

    downloadLink.addEventListener('click', function () {
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        if (navigator.msSaveBlob) {
            // For Microsoft browsers
            navigator.msSaveBlob(blob, 'domain_results.csv');
        } else {
            // For other browsers
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'domain_results.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    });
});
