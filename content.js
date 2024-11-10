if (!document.getElementById("my-extension-overlay")) {
  const overlay = document.createElement("div");
  overlay.id = "my-extension-overlay";
  
  // Insert the overlay as the first child of the body
  document.body.insertBefore(overlay, document.body.firstChild);

  // Fetch the HTML content from overlay.html and insert it into the overlay div
  fetch(chrome.runtime.getURL("overlay.html"))
    .then((response) => response.text())
    .then((data) => {
      overlay.innerHTML = data;
    })
    .catch((error) => console.error("Error loading overlay content:", error));

  // Set initial margin to push down content
  document.body.style.marginTop = "50px"; // Adjust based on overlay height
}


