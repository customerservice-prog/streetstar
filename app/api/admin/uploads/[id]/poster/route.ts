import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import { isAdmin } from "@/lib/auth";
import { sameOrigin } from "@/lib/community";
import { database } from "@/lib/db";
import {
  validUploadId,MAX_POSTER_BYTES,readBoundedBody,pendingPosterName,prepareStorage
} from "@/lib/media-storage";

export const runtime="nodejs";
type Params={params:Promise<{id:string}>};
export async function PUT(req:NextRequest,{params}:Params){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  if(!sameOrigin(req))return NextResponse.json({error:"Invalid request origin."},{status:403});
  const {id}=await params;
  if(!validUploadId(id))return NextResponse.json({error:"Invalid upload."},{status:400});
  const declared=Number(req.headers.get("content-length"));
  if(!Number.isSafeInteger(declared)||declared<100||declared>MAX_POSTER_BYTES)
    return NextResponse.json({error:"Poster must be a JPEG under 2 MiB."},{status:413});
  try{
    const result=await database().query("SELECT id FROM viral_media_uploads WHERE id=$1",[id]);
    if(!result.rows[0])return NextResponse.json({error:"Upload not found."},{status:404});
    await prepareStorage();
    const buffer=await readBoundedBody(req.body,MAX_POSTER_BYTES);
    if(buffer.length!==declared||buffer.length<100||buffer[0]!==0xff||buffer[1]!==0xd8||buffer[2]!==0xff)
      return NextResponse.json({error:"Invalid JPEG thumbnail."},{status:415});
    await fs.writeFile(pendingPosterName(id),buffer,{mode:0o640});
    return NextResponse.json({ok:true});
  }catch{
    return NextResponse.json({error:"Unable to save thumbnail. A branded fallback will be used."},{status:503});
  }
}
