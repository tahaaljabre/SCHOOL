import { headers } from "next/headers";
const url=()=>process.env.SUPABASE_URL?.replace(/\/$/,"")||"";
const publicKey=()=>process.env.SUPABASE_ANON_KEY||"";
const serviceKey=()=>process.env.SUPABASE_SERVICE_ROLE_KEY||"";
const validUrl=()=>{try{const parsed=new URL(url());return parsed.protocol==="https:"&&parsed.hostname.endsWith(".supabase.co");}catch{return false;}};
export const externalAuthConfigured=()=>Boolean(validUrl()&&publicKey()&&serviceKey());
export const studentEmail=(username:string)=>`${username.trim().toLowerCase()}@students.alsomah.school`;
export const staffEmail=(username:string)=>`${username.trim().toLowerCase()}@staff.alsomah.school`;
export const parentEmail=(username:string)=>`${username.trim().toLowerCase().replace(/[^a-z0-9._-]/g,"")}@parents.alsomah.school`;
export function validPassword(value:string){return value.length>=8&&/[A-Z]/.test(value)&&/[a-z]/.test(value)&&/\d/.test(value);}
async function call(path:string,key:string,init:RequestInit={}){return fetch(`${url()}${path}`,{...init,headers:{apikey:key,authorization:`Bearer ${key}`,"content-type":"application/json",...(init.headers||{})}});}
export async function signInExternal(identifier:string,password:string,type:string){
  if(process.env.MOCK_AUTH==="true"){
    const token = `mock_${identifier}`;
    return {access_token:token, refresh_token:token, expires_in:3600, user:{id:token, email:`${identifier}@mock.local`}};
  }
  if(!validUrl()||!publicKey())throw new Error("رابط Supabase المحلي غير صحيح. ضع رابط المشروع الذي ينتهي بـ supabase.co ثم أعد تشغيل الموقع المحلي.");
  const cleanIdentifier=identifier.trim().toLowerCase(),email=cleanIdentifier.includes("@")?cleanIdentifier:type==="student"?studentEmail(cleanIdentifier):type==="staff"?staffEmail(cleanIdentifier):type==="parent"?parentEmail(cleanIdentifier):cleanIdentifier;
  let response=await call("/auth/v1/token?grant_type=password",publicKey(),{method:"POST",body:JSON.stringify({email,password})});
  if(!response.ok&&type==="parent"&&!cleanIdentifier.includes("@"))response=await call("/auth/v1/token?grant_type=password",publicKey(),{method:"POST",body:JSON.stringify({email:parentEmail(`parent${cleanIdentifier}`),password})});
  const data=await response.json() as Record<string,unknown>;
  if(!response.ok)throw new Error("اسم الدخول أو كلمة المرور غير صحيحة");
  return data as {access_token:string;refresh_token:string;expires_in:number;user:{id:string;email:string}};
}
export async function externalIdentity(){
  const cookie=(await headers()).get("cookie")||"",token=cookie.match(/(?:^|; )school_session=([^;]+)/)?.[1];
  if(!token)return null;
  if(process.env.MOCK_AUTH==="true" && token.startsWith("mock_")){
    const role = token.replace("mock_", "");
    return {userId:token, email:`${role}@mock.local`, displayName:`مستخدم وهمي (${role})`, fullName:`مستخدم وهمي (${role})`};
  }
  if(!validUrl()||!publicKey())return null;
  const response=await call("/auth/v1/user",publicKey(),{headers:{authorization:`Bearer ${decodeURIComponent(token)}`}});
  if(!response.ok)return null;
  const user=await response.json() as {id:string;email:string;user_metadata?:Record<string,unknown>};
  return{userId:user.id,email:user.email,displayName:String(user.user_metadata?.full_name||user.email),fullName:String(user.user_metadata?.full_name||"")||null};
}
export async function createExternalUser(email:string,password:string,metadata:Record<string,unknown>){
  if(process.env.MOCK_AUTH==="true")return {id:`mock_${email}`, email};
  if(!externalAuthConfigured())throw new Error("أضف إعدادات خدمة الدخول أولًا");
  const response=await call("/auth/v1/admin/users",serviceKey(),{method:"POST",body:JSON.stringify({email,password,email_confirm:true,user_metadata:metadata})}),data=await response.json() as Record<string,unknown>;
  if(!response.ok)throw new Error(String(data.msg||data.message||"تعذر إنشاء الحساب الخارجي"));
  return data as {id:string;email:string};
}
export async function restoreExternalUser(email:string,password:string,metadata:Record<string,unknown>){
 if(!externalAuthConfigured())throw new Error("أضف إعدادات خدمة الدخول أولًا");
 const response=await call("/auth/v1/admin/users?page=1&per_page=1000",serviceKey()),data=await response.json() as {users?:Array<{id:string;email:string}>};
 if(!response.ok)throw new Error("تعذر العثور على الحساب القديم");
 const user=(data.users||[]).find(item=>item.email.toLowerCase()===email.toLowerCase());
 if(!user)throw new Error("الحساب موجود في خدمة الدخول لكن تعذر تحديده");
 await updateExternalUser(user.id,{password,user_metadata:metadata,must_change_password:true});
 return user;
}
export async function updateExternalUser(id:string,changes:Record<string,unknown>){
  if(process.env.MOCK_AUTH==="true")return {};
  if(!externalAuthConfigured())throw new Error("أضف إعدادات خدمة الدخول أولًا");
  const response=await call(`/auth/v1/admin/users/${id}`,serviceKey(),{method:"PUT",body:JSON.stringify(changes)}),data=await response.json() as Record<string,unknown>;
  if(!response.ok)throw new Error(String(data.msg||data.message||"تعذر تحديث الحساب الخارجي"));
  return data;
}

export async function uploadPublicSchoolFile(file:File){
 if(!externalAuthConfigured())throw new Error("أضف إعدادات Supabase أولًا");
 const isImage=file.type.startsWith("image/"),isVideo=file.type.startsWith("video/");
 if(!isImage&&!isVideo)throw new Error("اختر صورة أو فيديو فقط");
 const max=100*1024*1024;
 if(file.size>max)throw new Error(isImage?"تعذر رفع الصورة لأنها تتجاوز الحد التقني للاستضافة (100 ميجابايت)":"حجم الفيديو يجب ألا يتجاوز 100 ميجابايت");
 const bucket="school-public",bucketResponse=await fetch(`${url()}/storage/v1/bucket`,{method:"POST",headers:{apikey:serviceKey(),authorization:`Bearer ${serviceKey()}`,"content-type":"application/json"},body:JSON.stringify({id:bucket,name:bucket,public:true,file_size_limit:100*1024*1024})});
 if(!bucketResponse.ok&&bucketResponse.status!==409){const data=await bucketResponse.json().catch(()=>({})) as Record<string,unknown>,message=String(data.message||data.error||"");if(!/already exists|resource already exists|exists/i.test(message))throw new Error(message||"تعذر تجهيز مساحة الملفات");}
 const visibility=await fetch(`${url()}/storage/v1/bucket/${bucket}`,{method:"PUT",headers:{apikey:serviceKey(),authorization:`Bearer ${serviceKey()}`,"content-type":"application/json"},body:JSON.stringify({public:true,file_size_limit:100*1024*1024})});
 if(!visibility.ok){const data=await visibility.json().catch(()=>({})) as Record<string,unknown>;throw new Error(String(data.message||"تعذر جعل الصور متاحة للعرض"));}
 const extension=(file.name.split(".").pop()|| (isImage?"jpg":"mp4")).replace(/[^a-zA-Z0-9]/g,"").slice(0,8),path=`${isImage?"images":"videos"}/${Date.now()}-${crypto.randomUUID().slice(0,8)}.${extension}`;
 const response=await fetch(`${url()}/storage/v1/object/${bucket}/${path}`,{method:"POST",headers:{apikey:serviceKey(),authorization:`Bearer ${serviceKey()}`,"content-type":file.type||"application/octet-stream","x-upsert":"false"},body:await file.arrayBuffer()});
 if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(String((data as Record<string,unknown>).message||"تعذر رفع الملف"));}
 return `${url()}/storage/v1/object/public/${bucket}/${path}`;
}
