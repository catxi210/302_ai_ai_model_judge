/**
 * Helper function to copy the last assistant message to clipboard
 */
export const copyLastAssistantMessage = (messages: any[]) => {
  const assistantMessages = messages.filter((msg) => msg.role === "assistant");

  if (assistantMessages.length > 0) {
    const lastResponse =
      assistantMessages[assistantMessages.length - 1].content;
    navigator.clipboard.writeText(lastResponse);
    return true;
  }

  return false;
};

/**
 * Helper function to copy text to clipboard
 */
export const copyToClipboard = (text: string) => {
  if (!text) return false;

  try {
    navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy text to clipboard:", error);
    return false;
  }
};
