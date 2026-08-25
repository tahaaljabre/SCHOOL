import { requireSchoolAdmin } from "../../../db/authorization";
import { deleteExternalUser, externalAuthConfigured, updateExternalUser } from "../../../db/external-auth";

const ownerEmail="tahaaljabre@hotmail.com";
const roles=["SUPER_ADMIN","ADMIN","TEACHER","STUDENT","PARENT","EMPLOYEE"];
function ownerOnly(auth:Awaited<ReturnType<typeof requireSchoolAdmin>>){
 if(auth.error)return auth.error;
 if(auth.record.role!=="SUPER_ADMIN"||auth.record.email.toLowerCase()!==ownerEmail)return Response.json({error:"هذه النافذة خاصة بمدير النظام فقط"},{status:403});
 return null;
}

export async function GET(){try{
 const auth=await requireSchoolAdmin(),denied=ownerOnly(auth);if(denied)return denied;
 const result=await auth.db.prepare("SELECT id,email,full_name,role,status,username,phone,must_change_password,created_at FROM users ORDER BY full_name").all();
 return Response.json({users:result.results});
}catch{return Response.json({error:"تعذر تحميل المستخدمين"},{status:500});}}

export async function PUT(request:Request){try{
 const auth=await requireSchoolAdmin(),denied=ownerOnly(auth);if(denied)return denied;
 const p=await request.json() as Record<string,unknown>,id=Number(p.id),fullName=String(p.fullName??"").trim(),username=String(p.username??"").trim().toLowerCase(),phone=String(p.phone??"").trim(),role=String(p.role??""),status=String(p.status??"");
 if(!id||fullName.split(/\s+/).length<2||!roles.includes(role)||!["ACTIVE","SUSPENDED"].includes(status)||!(/^[a-z0-9._-]{3,30}$/.test(username)||!username))return Response.json({error:"تحقق من الاسم واسم المستخدم والصلاحية"},{status:400});
 const before=await auth.db.prepare("SELECT id,external_user_id,email,full_name,username,phone,role,status FROM users WHERE id=?").bind(id).first<{id:number;external_user_id:string;email:string;full_name:string;username:string;phone:string;role:string;status:string}>();
 if(!before)return Response.json({error:"المستخدم غير موجود"},{status:404});
 if(id===auth.record.id&&(status==="SUSPENDED"||role!=="SUPER_ADMIN"))return Response.json({error:"لا يمكنك تعطيل حساب مدير النظام أو سحب صلاحيته"},{status:400});
 if(externalAuthConfigured()&&!before.external_user_id.startsWith("pending:"))await updateExternalUser(before.external_user_id,{user_metadata:{full_name:fullName,role,username}});
 await auth.db.prepare("UPDATE users SET full_name=?,username=?,phone=?,role=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(fullName,username||null,phone,role,status,id).run();
 await auth.db.prepare("INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,before_data,after_data) VALUES(?,?,?,?,?,?)").bind(auth.record.id,"UPDATE","users",String(id),JSON.stringify(before),JSON.stringify({fullName,username,phone,role,status})).run();
 return Response.json({message:"تم حفظ بيانات المستخدم"});
}catch(e){return Response.json({error:String(e).includes("UNIQUE")?"اسم المستخدم مستخدم بالفعل":"تعذر حفظ بيانات المستخدم"},{status:400});}}

export async function DELETE(request:Request){try{
 const auth=await requireSchoolAdmin(),denied=ownerOnly(auth);if(denied)return denied;
 const id=Number(new URL(request.url).searchParams.get("id"));if(!id)return Response.json({error:"المعرف مطلوب"},{status:400});
 if(id===auth.record.id)return Response.json({error:"لا يمكنك حذف حساب مدير النظام الحالي"},{status:400});
 const user=await auth.db.prepare("SELECT id,external_user_id,email,full_name,role FROM users WHERE id=?").bind(id).first<{id:number;external_user_id:string;email:string;full_name:string;role:string}>();
 if(!user)return Response.json({error:"المستخدم غير موجود"},{status:404});
 await auth.db.prepare("DELETE FROM account_links WHERE user_id=?").bind(id).run();
 await auth.db.prepare("DELETE FROM audit_logs WHERE actor_user_id=?").bind(id).run();
 if(externalAuthConfigured()&&!user.external_user_id.startsWith("pending:"))await deleteExternalUser(user.external_user_id);
 await auth.db.prepare("DELETE FROM users WHERE id=?").bind(id).run();
 await auth.db.prepare("INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,before_data) VALUES(?,?,?,?,?)").bind(auth.record.id,"DELETE","users",String(id),JSON.stringify(user)).run();
 return Response.json({message:"تم حذف المستخدم وحساب دخوله"});
}catch{return Response.json({error:"تعذر حذف المستخدم"},{status:400});}}
