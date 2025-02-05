document.getElementById("shorten-btn").addEventListener("click", shortenURL);
document.getElementById("generate-qr-btn").addEventListener("click", generateQRCode);

async function shortenURL() {
  const longURL = document.getElementById("long-url").value.trim();
  const shortURLField = document.getElementById("short-url");

  if (!longURL) {
    alert("Please enter a valid URL!");
    return;
  }

  try {
    const response = await fetch("https://api.tinyurl.com/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer QeiZ8ZP85UdMKoZxaDDo2k8xuquZNXT6vys45A1JImuP4emSxSi2Zz655QDJ", // Replace with your TinyURL API key
      },
      body: JSON.stringify({
        url: longURL,
        domain: "tiny.one", // TinyURL domain to use
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to shorten URL. Please check your input or API key.");
    }

    const data = await response.json();
    shortURLField.value = data.data.tiny_url;

    // Automatically copy the shortened URL to the clipboard
    shortURLField.select();
    document.execCommand("copy");
    alert("Shortened URL copied to clipboard!");
  } catch (error) {
    console.error(error);
    alert("An error occurred while shortening the URL.");
  }
}

function generateQRCode() {
    const shortURL = document.getElementById("short-url").value.trim();
    const qrCodeContainer = document.getElementById("qr-code-container");
  
    if (!shortURL) {
      alert("Please shorten a URL first!");
      return;
    }
  
    // Clear the QR code container before generating a new one
    qrCodeContainer.innerHTML = "";
  
    // Create a new canvas element
    const canvas = document.createElement("canvas");
    qrCodeContainer.appendChild(canvas);
  
    // Generate the QR code inside the canvas
    QRCode.toCanvas(canvas, shortURL, { width: 200 }, (error) => {
      if (error) {
        console.error("Error generating QR Code:", error);
        alert("Failed to generate QR Code.");
      }
    });
  }
  
