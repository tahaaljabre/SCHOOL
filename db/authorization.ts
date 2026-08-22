import { getChatGPTUser } from "../app/chatgpt-auth";
import { ensureCoreSchema } from "./core";
import { externalIdentity } from "./external-auth";
import { headers } from "next/headers";

export async function requireSchoolUser(){
 const db=await ensureCoreSchema(),dev=process.env.NODE_ENV!=="production",identity=(await externalIdentity())??(dev?(await getChatGPTUser()):null);
 const user=identity??(dev?{userId:"local-admin",email:"admin@local.school",displayName:"مدير المدرسة",fullName:"مدير المدرسة"}:null);
 if(!user)return{error:Response.json({error:"يجب تسجيل الدخول"},{status:401})} as const;
 const isDevelopmentAccount=user.email.trim().toLowerCase()==="tahaaljabre@hotmail.com";
 let record=await db.prepare("SELECT id,external_user_id,email,full_name,role,status,username,phone,must_change_password FROM users WHERE external_user_id=? OR email=? LIMIT 1").bind(user.userId,user.email).first<{id:number;external_user_id:string;email:string;full_name:string;role:string;status:string;username:string;phone:string;must_change_password:number}>();
 if(!record){const username=user.email.split("@")[0].toLowerCase(),legacy=await db.prepare("SELECT id,external_user_id,email,full_name,role,status,phone,must_change_password FROM users WHERE lower(phone)=? AND role IN ('SUPER_ADMIN','ADMIN','TEACHER') LIMIT 1").bind(username).first<{id:number;external_user_id:string;email:string;full_name:string;role:string;status:string;phone:string;must_change_password:number}>();if(legacy){await db.prepare("UPDATE users SET external_user_id=?,email=?,username=?,phone='',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(user.userId,user.email,username,legacy.id).run();record={...legacy,external_user_id:user.userId,email:user.email,phone:""};}else{const count=await db.prepare("SELECT COUNT(*) AS count FROM users").first<{count:number}>(),localStaffManager=dev&&user.email.endsWith("@staff.alsomah.school");if(Number(count?.count??0)>0&&!localStaffManager&&!isDevelopmentAccount)return{error:Response.json({error:"الحساب غير مضاف إلى مستخدمي المدرسة"},{status:403})} as const;await db.prepare("INSERT INTO users(external_user_id,email,full_name,role,status,username) VALUES(?,?,?,?,?,?)").bind(user.userId,user.email,user.fullName??user.displayName,"SUPER_ADMIN","ACTIVE",username).run();record=await db.prepare("SELECT id,external_user_id,email,full_name,role,status,phone,must_change_password FROM users WHERE external_user_id=?").bind(user.userId).first<{id:number;external_user_id:string;email:string;full_name:string;role:string;status:string;phone:string;must_change_password:number}>();}}
 if(!record||record.status!=="ACTIVE")return{error:Response.json({error:"الحساب غير نشط"},{status:403})} as const;
 const loginUsername=user.email.split("@")[0].toLowerCase();if(user.email.endsWith("@staff.alsomah.school")&&record.username!==loginUsername){await db.prepare("UPDATE users SET username=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(loginUsername,record.id).run();record={...record,username:loginUsername};}
 return{db,record,user} as const;
}

export async function requireSchoolAdmin(){
 const auth=await requireSchoolUser();if(auth.error)return auth;
 if(!["SUPER_ADMIN","ADMIN"].includes(auth.record.role))return{error:Response.json({error:"لا تملك صلاحية تنفيذ هذه العملية"},{status:403})} as const;
 return auth;
}

/** يحدد الفترة الفعلية من ربط الحساب، ولا يقبل اختيار فترة غير مسموح بها. */
export async function requireShiftContext(){
 const auth=await requireSchoolUser();if(auth.error)return auth;
 const role=auth.record.role;
 let shifts:{id:number;name:string}[]=[];
 if(role==="SUPER_ADMIN")shifts=(await auth.db.prepare("SELECT id,name FROM shifts WHERE status='ACTIVE' ORDER BY id").all<{id:number;name:string}>()).results;
 else if(role==="ADMIN")shifts=(await auth.db.prepare("SELECT s.id,s.name FROM shift_admins sa JOIN shifts s ON s.id=sa.shift_id WHERE sa.user_id=? AND s.status='ACTIVE' ORDER BY s.id").bind(auth.record.id).all<{id:number;name:string}>()).results;
 else if(role==="TEACHER"){
  const link=await auth.db.prepare("SELECT entity_id FROM account_links WHERE user_id=? AND lower(entity_type)='teacher'").bind(auth.record.id).first<{entity_id:number}>();
  if(link)shifts=(await auth.db.prepare("SELECT s.id,s.name FROM teacher_shifts ts JOIN shifts s ON s.id=ts.shift_id WHERE ts.teacher_id=? AND s.status='ACTIVE' ORDER BY s.id").bind(link.entity_id).all<{id:number;name:string}>()).results;
 }else if(role==="STUDENT"){
  const link=await auth.db.prepare("SELECT entity_id FROM account_links WHERE user_id=? AND lower(entity_type)='student'").bind(auth.record.id).first<{entity_id:number}>();
  if(link)shifts=(await auth.db.prepare("SELECT sh.id,sh.name FROM students st JOIN classrooms c ON c.id=st.classroom_id JOIN shifts sh ON sh.id=c.shift_id WHERE st.id=? AND sh.status='ACTIVE'").bind(link.entity_id).all<{id:number;name:string}>()).results;
 }else if(role==="PARENT"){
  const link=await auth.db.prepare("SELECT entity_id FROM account_links WHERE user_id=? AND lower(entity_type)='parent'").bind(auth.record.id).first<{entity_id:number}>();
  if(link)shifts=(await auth.db.prepare("SELECT DISTINCT sh.id,sh.name FROM parent_students ps JOIN students st ON st.id=ps.student_id JOIN classrooms c ON c.id=st.classroom_id JOIN shifts sh ON sh.id=c.shift_id WHERE ps.parent_id=? AND sh.status='ACTIVE' ORDER BY sh.id").bind(link.entity_id).all<{id:number;name:string}>()).results;
 }
 if(role!=="SUPER_ADMIN"&&!shifts.length)return{error:Response.json({error:"حسابك غير مربوط بأي فترة دراسية بعد"},{status:403})} as const;
 const cookie=(await headers()).get("cookie")||"",wanted=Number(cookie.match(/(?:^|; )school_active_shift=(\d+)/)?.[1]),activeShiftId=shifts.some(s=>s.id===wanted)?wanted:shifts[0]?.id??null;
 return{...auth,shifts,activeShiftId,isGlobal:role==="SUPER_ADMIN"} as const;
}

export async function requireSchoolAdminShift(){
 const scope=await requireShiftContext();if(scope.error)return scope;
 if(!["SUPER_ADMIN","ADMIN"].includes(scope.record.role))return{error:Response.json({error:"هذه الصلاحية لمدير الفترة فقط"},{status:403})} as const;
 return scope;
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
