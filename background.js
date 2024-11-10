let overlayVisible = false;

chrome.action.onClicked.addListener((tab) => {
  overlayVisible = !overlayVisible; // Toggle overlay visibility
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: toggleOverlay,
    args: [overlayVisible]
  });
});

function toggleOverlay(visible) {
  const overlay = document.getElementById("my-extension-overlay");
  if (overlay) {
    overlay.style.display = visible ? "block" : "none";
  }

  const toggleButton = document.getElementById('toggleButton');
  const resultPre = document.getElementById('result');

  // Event listener for button click
  toggleButton.addEventListener('click', () => {
    // Check if the <pre> element is currently hidden
    if (resultPre.style.display === 'none') {
      resultPre.style.display = 'block';       // Show the <pre> element
      toggleButton.textContent = 'Hide Result'; // Update button text
    } else {
      resultPre.style.display = 'none';        // Hide the <pre> element
      toggleButton.textContent = 'Show Result'; // Update button text
    }
  });




  document.getElementById('injectButton').addEventListener('click', fetchData);
  document.getElementById('exportButton').addEventListener('click', exportToExcel);

  let jsonData = null; // Store the JSON data globally to access it when exporting to Excel

  // Function to fetch data based on XPath inputs
  async function fetchData() {
    const jsonInput = document.getElementById('inputText').value;

    if (jsonInput) {
      try {
        const xpaths = JSON.parse(jsonInput);
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab && tab.id !== undefined) {
            const [result] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: fetchTextsByMultipleXPaths,
                args: [xpaths]
            });

            // Store the fetched JSON data
            jsonData = result.result;
            document.getElementById('result').innerText = JSON.stringify(jsonData, null, 2);
        } else {
            console.error("No active tab found.");
        }
      } catch (error) {
          console.error("Error fetching text:", error);
          document.getElementById('result').innerText = "Error: Invalid JSON or XPath.";
      }
    }
  }

  function fetchTextsByMultipleXPaths(xpaths) {
    const results = {};
  
    for (const key in xpaths) {
        try {
            const xpath = xpaths[key];
            const iterator = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.ORDERED_NODE_ITERATOR_TYPE,
                null
            );
  
            const nodeResults = [];
            let node = iterator.iterateNext();
            
            while (node) {
                nodeResults.push(node.textContent.trim());
                node = iterator.iterateNext();
            }
            
            results[key] = nodeResults;
        } catch (error) {
            console.error("Invalid XPath for key ${key}", error);
            results[key] = ["Error: Invalid XPath"];
        }
    }
    
    return results;
  }
  
  
  function exportToExcel() {
    if (!jsonData) {
        alert("No data available to export. Please fetch data first.");
        return;
    }
  
    // Prepare the data for Excel in a column-based format
    const headers = Object.keys(jsonData); // JSON keys as headers
    const maxRows = Math.max(...headers.map(header => jsonData[header].length)); // Find the longest array
  
    // Prepare worksheet data with headers as the first row
    const worksheetData = [headers];
  
    // Fill each row with data from each key's array
    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        const row = headers.map(header => jsonData[header][rowIndex] || ""); // Use an empty string if data is missing
        worksheetData.push(row);
    }
  
    // Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
  
    // Generate and download the Excel file
    XLSX.writeFile(workbook, "XPathResults.xlsx");
  }

}


