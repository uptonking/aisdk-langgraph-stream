import type { UIMessage } from "ai";

export interface LangchainMessage {
  type: "human" | "ai" | "system";
  content: string;
}

export function convertAisdkMsgToLangchainMsg(aisdkMsg: UIMessage): LangchainMessage {
  // Extract text content from parts array
  const textContent = aisdkMsg.parts
    ?.filter(part => part.type === "text")
    .map(part => part.text)
    .join("\n") || "";

  // Determine message type based on role
  let type: "human" | "ai" | "system";
  switch (aisdkMsg.role) {
    case "user":
      type = "human";
      break;
    case "assistant":
      type = "ai";
      break;
    case "system":
      type = "system";
      break;
    default:
      type = "human"; // Default to human if role is unknown
  }

  return {
    type,
    content: textContent
  };
}
