import { requireSchoolUser } from "../../../../db/authorization";
import { staffEmail, updateExternalUser, validPassword } from "../../../../db/external-auth";

export async function GET(){
  const auth=await requireSchoolUser();
  if(auth.error)return auth.error;
  return Response.json({user:{id:auth.record.id,fullName:auth.record.full_name,username:(auth.record as {username?:string}).username||auth.record.email.split("@")[0],phone:auth.record.phone||"",email:auth.record.email,role:auth.record.role}});
}

export async function PUT(request:Request){try{
  const auth=await requireSchoolUser();if(auth.error)return auth.error;
  const p=await request.json() as Record<string,unknown>,fullName=String(p.fullName||"").trim(),username=String(p.username||"").trim().toLowerCase(),phone=String(p.phone||"").trim(),password=String(p.password||"");
  if(fullName.length<2)return Response.json({error:"الاسم مطلوب"},{status:400});
  if(!/^[a-z0-9._-]{3,30}$/.test(username))return Response.json({error:"اسم المستخدم من 3 إلى 30 حرفًا إنجليزيًا أو رقمًا"},{status:400});
  if(password&&!validPassword(password))return Response.json({error:"كلمة المرور يجب أن تكون 8 خانات وبها حرف كبير وصغير ورقم"},{status:400});
  const nextEmail=auth.record.role==="STUDENT"?auth.record.email:staffEmail(username),usernameChanged=nextEmail!==auth.record.email;
  if(password||usernameChanged){
    if(auth.record.external_user_id?.startsWith("pending:"))return Response.json({error:"هذا الحساب لم يُفعّل بعد لخدمة الدخول"},{status:400});
    await updateExternalUser(auth.record.external_user_id,{...(password?{password}:{}),...(usernameChanged?{email:nextEmail}:{}),user_metadata:{full_name:fullName,must_change_password:false,username}});
  }
  await auth.db.prepare("UPDATE users SET full_name=?,username=?,email=?,phone=?,must_change_password=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(fullName,username,nextEmail,phone,password?0:auth.record.must_change_password??0,auth.record.id).run();
  await auth.db.prepare("INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,after_data) VALUES(?,?,?,?,?)").bind(auth.record.id,password?"UPDATE_PROFILE_AND_PASSWORD":"UPDATE_PROFILE","users",String(auth.record.id),JSON.stringify({fullName,phone,passwordChanged:Boolean(password)})).run();
  return Response.json({message:password?"تم حفظ البيانات وتغيير كلمة المرور":"تم حفظ بيانات الحساب",user:{fullName,username,phone}});
}catch(e){return Response.json({error:e instanceof Error?e.message:"تعذر حفظ بيانات الحساب"},{status:400});}}
