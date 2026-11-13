import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import { isAdmin } from "@/lib/auth";
import { sameOrigin } from "@/lib/community";
import { database } from "@/lib/db";
import {
  pendingFileName,pendingPosterName,validUploadId,validVideoHeader,
  UPLOAD_CHUNK_BYTES,readBoundedBody,prepareStorage,type VideoExtension
} from "@/lib/media-storage";

export const runtime="nodejs";
type Params={params:Promise<{id:string}>};
type Session={id:string; extension:VideoExtension; size_bytes:string; received_bytes:string;created_at:Date};

export async function GET(_req:NextRequest,{params}:Params){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  if(!validUploadId(id))return NextResponse.json({error:"Invalid upload."},{status:400});
  const result=await database().query<Session>(
    "SELECT id,extension,size_bytes,received_bytes,created_at FROM viral_media_uploads WHERE id=$1",[id]
  ).catch(()=>null);
  if(!result?.rows[0])return NextResponse.json({error:"Upload not found."},{status:404});
  return NextResponse.json({ok:true,received:Number(result.rows[0].received_bytes),size:Number(result.rows[0].size_bytes)},{
    headers:{"Cache-Control":"no-store"}
  });
}

export async function PUT(req:NextRequest,{params}:Params){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  if(!sameOrigin(req))return NextResponse.json({error:"Invalid request origin."},{status:403});
  const {id}=await params;
  if(!validUploadId(id))return NextResponse.json({error:"Invalid upload."},{status:400});
  const offset=Number(req.nextUrl.searchParams.get("offset"));
  if(!Number.isSafeInteger(offset)||offset<0)return NextResponse.json({error:"Invalid chunk offset."},{status:400});
  const declared=Number(req.headers.get("content-length"));
  if(!Number.isSafeInteger(declared)||declared<1||declared>UPLOAD_CHUNK_BYTES)
    return NextResponse.json({error:"Chunk must be between 1 byte and 4 MiB."},{status:413});
  let data:Buffer;
  try{
    data=await readBoundedBody(req.body,UPLOAD_CHUNK_BYTES);
    if(data.length!==declared)throw new Error("Chunk length mismatch");
  }catch{return NextResponse.json({error:"Invalid upload chunk."},{status:413})}
  const client=await database().connect().catch(()=>null);
  if(!client)return NextResponse.json({error:"Database unavailable."},{status:503});
  try{
    await prepareStorage();
    await client.query("BEGIN");
    const lookup=await client.query<Session>(
      "SELECT id,extension,size_bytes,received_bytes,created_at FROM viral_media_uploads WHERE id=$1 FOR UPDATE",[id]
    );
    const upload=lookup.rows[0];
    if(!upload)return NextResponse.json({error:"Upload not found."},{status:404});
    if(Date.now()-new Date(upload.created_at).getTime()>24*3600*1000)
      return NextResponse.json({error:"Upload expired; start again."},{status:410});
    const received=Number(upload.received_bytes),size=Number(upload.size_bytes);
    if(offset!==received)return NextResponse.json({error:"Incorrect offset.",received},{status:409});
    if(offset+data.length>size)return NextResponse.json({error:"Chunk exceeds file size."},{status:413});
    if(offset===0&&!validVideoHeader(data,upload.extension))
      return NextResponse.json({error:"File content does not match MP4/WebM format."},{status:415});
    const file=await fs.open(pendingFileName(id,upload.extension),"r+");
    try{
      let written=0;
      while(written<data.length){
        const result=await file.write(data,written,data.length-written,offset+written);
        if(!result.bytesWritten)throw new Error("Incomplete upload write");
        written+=result.bytesWritten;
      }
      await file.sync();
    }finally{await file.close()}
    await client.query("UPDATE viral_media_uploads SET received_bytes=$1,updated_at=NOW() WHERE id=$2",[offset+data.length,id]);
    await client.query("COMMIT");
    return NextResponse.json({ok:true,received:offset+data.length,size});
  }catch{
    await client.query("ROLLBACK").catch(()=>{});
    return NextResponse.json({error:"Could not save chunk. Retry at the last confirmed offset."},{status:503});
  }finally{
    await client.query("ROLLBACK").catch(()=>{});
    client.release();
  }
}

export async function DELETE(req:NextRequest,{params}:Params){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  if(!sameOrigin(req))return NextResponse.json({error:"Invalid request origin."},{status:403});
  const {id}=await params;
  if(!validUploadId(id))return NextResponse.json({error:"Invalid upload."},{status:400});
  const result=await database().query<Session>("DELETE FROM viral_media_uploads WHERE id=$1 RETURNING extension",[id]).catch(()=>null);
  const ext=result?.rows[0]?.extension;
  if(ext) {
    await Promise.allSettled([
      fs.unlink(pendingFileName(id,ext)),
      fs.unlink(pendingPosterName(id))
    ]);
  }
  return NextResponse.json({ok:true});
}
