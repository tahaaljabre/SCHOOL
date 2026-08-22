import { getChatGPTUser } from "../app/chatgpt-auth";
import { ensureCoreSchema } from "./core";
import { externalIdentity } from "./external-auth";

export async function requireSchoolUser(){
 const db=await ensureCoreSchema(),identity=(await externalIdentity())??(await getChatGPTUser()),dev=process.env.NODE_ENV!=="production";
 const user=identity??(dev?{userId:"local-admin",email:"admin@local.school",displayName:"مدير المدرسة",fullName:"مدير المدرسة"}:null);
 if(!user)return{error:Response.json({error:"يجب تسجيل الدخول"},{status:401})} as const;
 let record=await db.prepare("SELECT id,external_user_id,email,full_name,role,status,phone,must_change_password FROM users WHERE external_user_id=? OR email=? LIMIT 1").bind(user.userId,user.email).first<{id:number;external_user_id:string;email:string;full_name:string;role:string;status:string;phone:string;must_change_password:number}>();
 if(!record){const count=await db.prepare("SELECT COUNT(*) AS count FROM users").first<{count:number}>();if(Number(count?.count??0)>0)return{error:Response.json({error:"الحساب غير مضاف إلى مستخدمي المدرسة"},{status:403})} as const;await db.prepare("INSERT INTO users(external_user_id,email,full_name,role,status) VALUES(?,?,?,?,?)").bind(user.userId,user.email,user.fullName??user.displayName,"SUPER_ADMIN","ACTIVE").run();record=await db.prepare("SELECT id,external_user_id,email,full_name,role,status,phone,must_change_password FROM users WHERE external_user_id=?").bind(user.userId).first<{id:number;external_user_id:string;email:string;full_name:string;role:string;status:string;phone:string;must_change_password:number}>();}
 if(!record||record.status!=="ACTIVE")return{error:Response.json({error:"الحساب غير نشط"},{status:403})} as const;
 return{db,record,user} as const;
}

export async function requireSchoolAdmin(){
 const auth=await requireSchoolUser();if(auth.error)return auth;
 if(!["SUPER_ADMIN","ADMIN"].includes(auth.record.role))return{error:Response.json({error:"لا تملك صلاحية تنفيذ هذه العملية"},{status:403})} as const;
 return auth;
}

export async function requireTeacherScope(){
  const auth = await requireSchoolUser(); if(auth.error) return auth;
  if(["SUPER_ADMIN","ADMIN"].includes(auth.record.role)) return { ...auth, isGlobal: true, teacherId: null } as const;
  if(auth.record.role !== "TEACHER") return { error: Response.json({error: "عذراً، هذه الصلاحية للمعلمين فقط"}, {status:403}) } as const;
  
  const link = await auth.db.prepare("SELECT entity_id FROM account_links WHERE user_id=? AND lower(entity_type)='teacher'").bind(auth.record.id).first<{entity_id:number}>();
  if(!link) return { error: Response.json({error: "حساب المعلم غير مرتبط بسجل مدرسي"}, {status:403}) } as const;
  
  return { ...auth, isGlobal: false, teacherId: link.entity_id } as const;
}

export async function requireStudentScope(){
  const auth = await requireSchoolUser(); if(auth.error) return auth;
  if(["SUPER_ADMIN","ADMIN"].includes(auth.record.role)) return { ...auth, isGlobal: true, studentId: null } as const;
  if(auth.record.role !== "STUDENT") return { error: Response.json({error: "عذراً، هذه الصلاحية للطلاب فقط"}, {status:403}) } as const;
  
  const link = await auth.db.prepare("SELECT entity_id FROM account_links WHERE user_id=? AND lower(entity_type)='student'").bind(auth.record.id).first<{entity_id:number}>();
  if(!link) return { error: Response.json({error: "حساب الطالب غير مرتبط بسجل مدرسي"}, {status:403}) } as const;
  
  return { ...auth, isGlobal: false, studentId: link.entity_id } as const;
}

export async function requireParentScope(){
  const auth = await requireSchoolUser(); if(auth.error) return auth;
  if(["SUPER_ADMIN","ADMIN"].includes(auth.record.role)) return { ...auth, isGlobal: true, parentId: null } as const;
  if(auth.record.role !== "PARENT") return { error: Response.json({error: "عذراً، هذه الصلاحية لأولياء الأمور فقط"}, {status:403}) } as const;
  
  const link = await auth.db.prepare("SELECT entity_id FROM account_links WHERE user_id=? AND lower(entity_type)='parent'").bind(auth.record.id).first<{entity_id:number}>();
  if(!link) return { error: Response.json({error: "حساب ولي الأمر غير مرتبط بسجل مدرسي"}, {status:403}) } as const;
  
  return { ...auth, isGlobal: false, parentId: link.entity_id } as const;
}
