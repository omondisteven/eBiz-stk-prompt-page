export const shortenUrl = async (longUrl: string): Promise<string | null> => {
    const accessToken = "2c22ea6b30977972e3ed7037b8deb89cdf2cabf7"; // Replace with your actual token
    const apiUrl = "https://api-ssl.bitly.com/v4/shorten";

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ long_url: longUrl })
        });

        if (!response.ok) throw new Error("Failed to shorten URL");

        const data = await response.json();
        return data.link; // Bit.ly returns the shortened link in 'link' property
    } catch (error) {
        console.error("Error shortening URL:", error);
        return null;
    }
};
