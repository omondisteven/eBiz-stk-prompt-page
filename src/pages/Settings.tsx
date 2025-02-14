// src/pages/Settings.tsx
import Layout from "@/components/Layout";
import { useContext, useState } from "react";
import { AppContext, AppContextType } from "@/context/AppContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaMoon, FaSun } from "react-icons/fa";

const Settings = () => {
  const { data, setData } = useContext(AppContext) as AppContextType;
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [autoOpenLinks, setAutoOpenLinks] = useState(true);
  const [defaultCamera, setDefaultCamera] = useState<"front" | "back">("back");
  const [defaultPhoneNumber, setDefaultPhoneNumber] = useState("254");
  const [defaultPaybillNumber, setDefaultPaybillNumber] = useState("");
  const [defaultAccountNumber, setDefaultAccountNumber] = useState("");
  const [defaultAgentNumber, setDefaultAgentNumber] = useState("");
  const [defaultTillNumber, setDefaultTillNumber] = useState("");
  const [defaultStoreNumber, setDefaultStoreNumber] = useState("");

  const handleThemeChange = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Ensure the number starts with "254"
    if (!value.startsWith("254")) {
      value = "254";
    }

    // Validate the number after "254"
    if (value.length > 3) {
      const afterPrefix = value.slice(3);
      if (/^0/.test(afterPrefix)) {
        alert("Phone number cannot start with '0' after '254'.");
        return;
      }
    }

    setDefaultPhoneNumber(value);
  };

  const saveSettings = () => {
    setData({
      ...data,
      defaultPhoneNumber,
      defaultPaybillNumber,
      defaultAccountNumber,
      defaultAgentNumber,
      defaultTillNumber,
      defaultStoreNumber,
    });
    alert("Settings saved!");
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>

        {/* Theme Toggle */}
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <span>Theme:</span>
            <Button onClick={handleThemeChange} className="flex items-center space-x-2">
              {theme === "light" ? <FaSun /> : <FaMoon />}
              <span>{theme === "light" ? "Light" : "Dark"}</span>
            </Button>
          </label>
        </div>

        {/* Auto-Open Links */}
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <span>Auto-Open Links:</span>
            <Button
              onClick={() => setAutoOpenLinks(!autoOpenLinks)}
              className={`${autoOpenLinks ? "bg-green-500" : "bg-red-500"}`}
            >
              {autoOpenLinks ? "ON" : "OFF"}
            </Button>
          </label>
        </div>

        {/* Default Camera */}
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <span>Default Camera:</span>
            <Button
              onClick={() => setDefaultCamera(defaultCamera === "front" ? "back" : "front")}
            >
              {defaultCamera === "front" ? "Front" : "Back"}
            </Button>
          </label>
        </div>

        {/* Default Phone Number */}
        <div className="mb-4">
          <label>Default Phone Number:</label>
          <Input
            value={defaultPhoneNumber}
            onChange={handlePhoneNumberChange}
            placeholder="Enter Default Phone Number"
          />
        </div>

        {/* Default Paybill Number */}
        <div className="mb-4">
          <label>Default Paybill Number:</label>
          <Input
            value={defaultPaybillNumber}
            onChange={(e) => setDefaultPaybillNumber(e.target.value)}
            placeholder="Enter Default Paybill Number"
          />
        </div>

        {/* Default Account Number */}
        <div className="mb-4">
          <label>Default Account Number:</label>
          <Input
            value={defaultAccountNumber}
            onChange={(e) => setDefaultAccountNumber(e.target.value)}
            placeholder="Enter Default Account Number"
          />
        </div>

        {/* Default Agent Number */}
        <div className="mb-4">
          <label>Default Agent Number:</label>
          <Input
            value={defaultAgentNumber}
            onChange={(e) => setDefaultAgentNumber(e.target.value)}
            placeholder="Enter Default Agent Number"
          />
        </div>

        {/* Default Till Number */}
        <div className="mb-4">
          <label>Default Till Number:</label>
          <Input
            value={defaultTillNumber}
            onChange={(e) => setDefaultTillNumber(e.target.value)}
            placeholder="Enter Default Till Number"
          />
        </div>

        {/* Default Store Number */}
        <div className="mb-4">
          <label>Default Store Number:</label>
          <Input
            value={defaultStoreNumber}
            onChange={(e) => setDefaultStoreNumber(e.target.value)}
            placeholder="Enter Default Store Number"
          />
        </div>

        {/* Save Button */}
        <Button onClick={saveSettings} className="bg-blue-500 hover:bg-blue-700">
          Save Settings
        </Button>
      </div>
    </Layout>
  );
};

export default Settings;