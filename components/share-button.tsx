"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: location.href });
      } else {
        await navigator.clipboard.writeText(location.href);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      }
    } catch { /* User cancelled sharing or clipboard is unavailable. */ }
  }
  return <button className="watch-share" onClick={share}>{copied ? <Check size={16}/> : <Share2 size={16}/>} {copied ? "LINK COPIED" : "SHARE VIDEO"}</button>;
}
