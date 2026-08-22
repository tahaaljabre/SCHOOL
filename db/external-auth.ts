import { headers } from "next/headers";
const url=()=>process.env.SUPABASE_URL?.replace(/\/$/,"")||"";
const publicKey=()=>process.env.SUPABASE_ANON_KEY||"";
const serviceKey=()=>process.env.SUPABASE_SERVICE_ROLE_KEY||"";
export const externalAuthConfigured=()=>Boolean(url()&&publicKey()&&serviceKey());
export const studentEmail=(username:string)=>`${username.trim().toLowerCase()}@students.alsomah.school`;
export const staffEmail=(username:string)=>`${username.trim().toLowerCase()}@staff.alsomah.school`;
export function validPassword(value:string){return value.length>=8&&/[A-Z]/.test(value)&&/[a-z]/.test(value)&&/\d/.test(value);}
async function call(path:string,key:string,init:RequestInit={}){return fetch(`${url()}${path}`,{...init,headers:{apikey:key,authorization:`Bearer ${key}`,"content-type":"application/json",...(init.headers||{})}});}
export async function signInExternal(identifier:string,password:string,type:string){
  if(process.env.MOCK_AUTH==="true"){
    const token = `mock_${identifier}`;
    return {access_token:token, refresh_token:token, expires_in:3600, user:{id:token, email:`${identifier}@mock.local`}};
  }
  if(!url()||!publicKey())throw new Error("خدمة الدخول غير مفعلة");
  const cleanIdentifier=identifier.trim().toLowerCase(),email=cleanIdentifier.includes("@")?cleanIdentifier:type==="student"?studentEmail(cleanIdentifier):type==="staff"?staffEmail(cleanIdentifier):cleanIdentifier;
  const response=await call("/auth/v1/token?grant_type=password",publicKey(),{method:"POST",body:JSON.stringify({email,password})});
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
  if(!url()||!publicKey())return null;
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
export async function updateExternalUser(id:string,changes:Record<string,unknown>){
  if(process.env.MOCK_AUTH==="true")return {};
  if(!externalAuthConfigured())throw new Error("أضف إعدادات خدمة الدخول أولًا");
  const response=await call(`/auth/v1/admin/users/${id}`,serviceKey(),{method:"PUT",body:JSON.stringify(changes)}),data=await response.json() as Record<string,unknown>;
  if(!response.ok)throw new Error(String(data.msg||data.message||"تعذر تحديث الحساب الخارجي"));
  return data;
}
