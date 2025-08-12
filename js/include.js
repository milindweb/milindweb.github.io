// js/include.js
// Fetch header footer contactform dynamically
// works all menu

function loadHTML(elementId, filePath, callback) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load ${filePath}`);
            return response.text();
        })
        .then(data => {
            document.getElementById(elementId).innerHTML = data;
            if (callback) callback();
        })
        .catch(error => console.error(error));
}

// Load header and footer everywhere
document.addEventListener("DOMContentLoaded", () => {
    loadHTML("header", "header.html", () => {
        console.log("Header loaded.");
    });

    loadHTML("footer", "footer.html", () => {
        console.log("Footer loaded.");
    });

    // If contact form placeholder exists, load it
    const contactContainer = document.getElementById("contactFormContainer");
    if (contactContainer) {
        loadHTML("contactFormContainer", "contactform.html", () => {
            console.log("Contact form loaded.");
            // Load form-handler.js after form is inserted
            const script = document.createElement("script");
            script.src = "js/form-handler.js";
            document.body.appendChild(script);
        });
    }
});