import { getChatGPTUser } from "../app/chatgpt-auth";
import { ensureCoreSchema } from "./core";
import { externalIdentity } from "./external-auth";

export async function requireSchoolUser(){
 const db=await ensureCoreSchema(),identity=(await externalIdentity())??(await getChatGPTUser()),dev=process.env.NODE_ENV!=="production";
 const user=identity??(dev?{userId:"local-admin",email:"admin@local.school",displayName:"مدير المدرسة",fullName:"مدير المدرسة"}:null);
 if(!user)return{error:Response.json({error:"يجب تسجيل الدخول"},{status:401})} as const;
 let record=await db.prepare("SELECT id,email,full_name,role,status FROM users WHERE external_user_id=? OR email=? LIMIT 1").bind(user.userId,user.email).first<{id:number;email:string;full_name:string;role:string;status:string}>();
 if(!record){const count=await db.prepare("SELECT COUNT(*) AS count FROM users").first<{count:number}>();if(Number(count?.count??0)>0)return{error:Response.json({error:"الحساب غير مضاف إلى مستخدمي المدرسة"},{status:403})} as const;await db.prepare("INSERT INTO users(external_user_id,email,full_name,role,status) VALUES(?,?,?,?,?)").bind(user.userId,user.email,user.fullName??user.displayName,"SUPER_ADMIN","ACTIVE").run();record=await db.prepare("SELECT id,email,full_name,role,status FROM users WHERE external_user_id=?").bind(user.userId).first<{id:number;email:string;full_name:string;role:string;status:string}>();}
 if(!record||record.status!=="ACTIVE")return{error:Response.json({error:"الحساب غير نشط"},{status:403})} as const;
 return{db,record,user} as const;
}

export async function requireSchoolAdmin(){
 const auth=await requireSchoolUser();if(auth.error)return auth;
 if(!["SUPER_ADMIN","ADMIN"].includes(auth.record.role))return{error:Response.json({error:"لا تملك صلاحية تنفيذ هذه العملية"},{status:403})} as const;
 return auth;
}
