import { useToast } from "@/components/common/ToastProvider";

export const useCopyToClipboard = () => {
  const { showToast } = useToast();

  const copyToClipboard = async (text: string, successMessage: string = "Copied to clipboard!") => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        showToast(successMessage);
      } catch (fallbackErr) {
        showToast("Failed to copy");
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return { copyToClipboard };
};

