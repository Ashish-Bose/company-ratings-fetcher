const companyNameInput = document.getElementById('company-name');
const fetchBtn = document.getElementById('fetch-btn');
const downloadBtn = document.getElementById('download-btn');
const companyInfoDiv = document.getElementById('company-info');

const RAPIDAPI_KEY = '160f31f5famsh2e3d240681a058cp1b5e22jsncd4a7d3d613c'; 
const RAPIDAPI_HOST = 'real-time-glassdoor-data.p.rapidapi.com'; // For the API

let currentData = []; // Store data for CSV

async function fetchCompanyData(companyName) {
    try {
        companyInfoDiv.innerHTML = '<p>Loading...</p>';
        downloadBtn.style.display = 'none';

        // Step 1: Search for company ID
        const searchUrl = `https://real-time-glassdoor-data.p.rapidapi.com/search?query=${encodeURIComponent(companyName)}`;
        const searchResponse = await fetch(searchUrl, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': RAPIDAPI_HOST
            }
        });
        if (!searchResponse.ok) throw new Error('Company search failed');
        const searchData = await searchResponse.json();
        
        if (searchData.results && searchData.results.length > 0) {
            const company = searchData.results[0]; // Top match
            const companyId = company.id;

            // Step 2: Fetch company details (ratings, reviews)
            const detailsUrl = `https://real-time-glassdoor-data.p.rapidapi.com/company?id=${companyId}`;
            const detailsResponse = await fetch(detailsUrl, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': RAPIDAPI_KEY,
                    'X-RapidAPI-Host': RAPIDAPI_HOST
                }
            });
            if (!detailsResponse.ok) throw new Error('Details fetch failed');
            const detailsData = await detailsResponse.json();

            // Extract key info
            const rating = detailsData.overall_rating || 'N/A';
            const pros = detailsData.pros || 'No pros available';
            const cons = detailsData.cons || 'No cons available';
            const reviewCount = detailsData.review_count || 0;

            // Display
            companyInfoDiv.innerHTML = `
                <h2>${company.name}</h2>
                <p><strong>Overall Rating:</strong> ${rating}/5 (based on ${reviewCount} reviews)</p>
                <div class="pros">
                    <h3>Pros:</h3>
                    <p>${pros}</p>
                </div>
                <div class="cons">
                    <h3>Cons:</h3>
                    <p>${cons}</p>
                </div>
            `;

            // Store for CSV
            currentData = [
                { Company: company.name, Rating: rating, Pros: pros, Cons: cons, Reviews: reviewCount }
            ];

            downloadBtn.style.display = 'inline-block';
        } else {
            throw new Error('No company found. Try exact name.');
        }
    } catch (error) {
        console.error('Error:', error);
        companyInfoDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

// Event listeners
fetchBtn.addEventListener('click', () => {
    const name = companyNameInput.value.trim();
    if (!name) {
        companyInfoDiv.innerHTML = '<p class="error">Please enter a company name!</p>';
        return;
    }
    fetchCompanyData(name);
});

// CSV Download
downloadBtn.addEventListener('click', () => {
    if (currentData.length === 0) return;

    // Create CSV
    let csv = 'Company,Rating,Pros,Cons,Review Count\n';
    currentData.forEach(row => {
        csv += `${row.Company},${row.Rating},"${row.Pros.replace(/"/g, '""')}","${row.Cons.replace(/"/g, '""')}","${row.Reviews}"\n`;
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'company-ratings.csv';
    a.click();
    window.URL.revokeObjectURL(url);
});
