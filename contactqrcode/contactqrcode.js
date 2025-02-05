//contactqrcode.js
const form = document.getElementById('contact-form');
const qrCodeContainer = document.getElementById('qrcode');

function generateQRCode() {
  const title = encodeURIComponent(document.getElementById('title').value.trim());
  const firstName = encodeURIComponent(document.getElementById('first-name').value.trim());
  const lastName = encodeURIComponent(document.getElementById('last-name').value.trim());
  const phoneNumber = encodeURIComponent(document.getElementById('phone-number').value.trim());

  // Construct the URL with query parameters
  const detailsURL = `${window.location.origin}/contactdetails.html?title=${title}&firstName=${firstName}&lastName=${lastName}&phoneNumber=${phoneNumber}`;

  // Clear existing QR code
  qrCodeContainer.innerHTML = '';

  // Generate new QR code with the URL
  new QRCode(qrCodeContainer, {
    text: detailsURL,
    width: 200,
    height: 200,
  });
}

// Add event listeners to form inputs
form.addEventListener('input', generateQRCode);

// Generate an initial blank QR code
generateQRCode();

