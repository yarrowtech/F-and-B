import { useId, useRef, useState } from "react";

const CampaignImageUpload = ({ value, onChange, disabled }) => {
  const id = useId();
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  const selectImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 1024 * 1024) {
      setError("Choose a JPG or PNG image up to 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.onerror = () => setError("Could not read this image. Please try again.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
        Campaign image (optional)
      </label>
      <input ref={inputRef} id={id} type="file" accept="image/jpeg,image/png" disabled={disabled}
        onChange={selectImage} aria-describedby={`${id}-help`}
        className="block w-full min-w-0 rounded-lg border border-gray-300 p-2 text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-green-50 file:px-3 file:py-2 file:font-semibold file:text-green-700 dark:border-gray-600 dark:text-gray-300" />
      <p id={`${id}-help`} className="text-xs text-gray-500 dark:text-gray-400">JPG or PNG, up to 1 MB. Included with your WhatsApp or email campaign.</p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {value && (
        <div className="space-y-2">
          <img src={value} alt="Campaign preview" className="max-h-56 max-w-full rounded-lg border border-gray-200 object-contain" />
          <button type="button" disabled={disabled} onClick={() => { onChange(""); setError(""); inputRef.current.value = ""; }}
            className="text-sm font-semibold text-red-600 disabled:opacity-60">Remove image</button>
        </div>
      )}
    </div>
  );
};

export default CampaignImageUpload;
