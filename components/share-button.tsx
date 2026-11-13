"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

type Props = {slug:string;title?:string;compact?:boolean};

export function ShareButton({slug,title,compact=false}:Props) {
  const [copied,setCopied] = useState(false);
  const [error,setError] = useState(false);
  const url = "https://bajomundotv.com/viral?video="+encodeURIComponent(slug);
  async function share() {
    setError(false);
    try {
      if (navigator.share) {
        await navigator.share({title:title||"Bajo Mundo Viral",url});
        return;
      }
    } catch(e) {
      if (e instanceof DOMException && e.name==="AbortError") return;
      // Some desktop browsers expose Web Share but cannot open its system dialog.
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(()=>setCopied(false),2600);
    } catch { setError(true); }
  }
  return <button type="button"
    className={compact?"card-quick-share":"watch-share"}
    onClick={()=>void share()}
    title={error?url:"Compartir este video"}
    aria-label={error?"Copia este enlace: "+url:"Compartir "+(title||"video")}>
    {copied?<Check size={16}/>:<Share2 size={16}/>}
    {copied?"COPIADO":error?"COPIAR ENLACE":"COMPARTIR"}
  </button>;
}
