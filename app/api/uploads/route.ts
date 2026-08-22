import { env } from "cloudflare:workers";
import { requireSchoolAdmin } from "../../../db/authorization";

const bucket=()=>((env as unknown as {MEDIA?:R2Bucket}).MEDIA);

export async function GET(request:Request){
 try{const key=new URL(request.url).searchParams.get("key");if(!key)return new Response("Not found",{status:404});const object=await bucket()?.get(key);if(!object)return new Response("Not found",{status:404});const headers=new Headers();object.writeHttpMetadata(headers);headers.set("etag",object.httpEtag);headers.set("cache-control","public, max-age=31536000, immutable");return new Response(object.body,{headers});}
 catch{return new Response("Not found",{status:404});}
}

export async function POST(request:Request){
 try{const auth=await requireSchoolAdmin();if(auth.error)return auth.error;const form=await request.formData(),file=form.get("file");if(!(file instanceof File))return Response.json({error:"اختر ملفًا أولاً"},{status:400});if(!file.type.startsWith("image/")&&!file.type.startsWith("video/"))return Response.json({error:"اختر صورة أو فيديو فقط"},{status:400});const storage=bucket();if(!storage)return Response.json({error:"مساحة الصور غير مفعلة"},{status:503});const extension=(file.name.split(".").pop()||"bin").replace(/[^a-zA-Z0-9]/g,"").slice(0,8),key=`school/${file.type.startsWith("image/")?"images":"videos"}/${Date.now()}-${crypto.randomUUID().slice(0,8)}.${extension}`;await storage.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type||"application/octet-stream"}});return Response.json({url:`/api/uploads?key=${encodeURIComponent(key)}`,message:"تم رفع الملف بنجاح"});}
 catch(error){return Response.json({error:error instanceof Error?error.message:"تعذر رفع الملف"},{status:400});}
}
