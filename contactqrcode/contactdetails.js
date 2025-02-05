// Function to get query parameters from URL
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      title: params.get("title") || "",
      firstName: params.get("firstName") || "",
      lastName: params.get("lastName") || "",
      phoneNumber: params.get("phoneNumber") || ""
    };
  }
  
  // Populate the form with the extracted details
  function displayContactDetails() {
    const details = getQueryParams();
  
    document.getElementById("title").value = details.title;
    document.getElementById("first-name").value = details.firstName;
    document.getElementById("last-name").value = details.lastName;
    document.getElementById("phone-number").value = details.phoneNumber;
  }
  
  // Call function on page load
  window.onload = displayContactDetails;
  