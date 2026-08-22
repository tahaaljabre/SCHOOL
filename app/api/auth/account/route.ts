import { requireSchoolUser } from "../../../../db/authorization";
import { updateExternalUser, validPassword } from "../../../../db/external-auth";

export async function GET(){
  const auth=await requireSchoolUser();
  if(auth.error)return auth.error;
  return Response.json({user:{id:auth.record.id,fullName:auth.record.full_name,phone:auth.record.phone||"",email:auth.record.email,role:auth.record.role}});
}

export async function PUT(request:Request){try{
  const auth=await requireSchoolUser();if(auth.error)return auth.error;
  const p=await request.json() as Record<string,unknown>,fullName=String(p.fullName||"").trim(),phone=String(p.phone||"").trim(),password=String(p.password||"");
  if(fullName.length<2)return Response.json({error:"الاسم مطلوب"},{status:400});
  if(password&&!validPassword(password))return Response.json({error:"كلمة المرور يجب أن تكون 8 خانات وبها حرف كبير وصغير ورقم"},{status:400});
  if(password){
    if(auth.record.external_user_id?.startsWith("pending:"))return Response.json({error:"هذا الحساب لم يُفعّل بعد لخدمة الدخول"},{status:400});
    await updateExternalUser(auth.record.external_user_id,{password,user_metadata:{full_name:fullName,must_change_password:false}});
  }
  await auth.db.prepare("UPDATE users SET full_name=?,phone=?,must_change_password=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(fullName,phone,password?0:auth.record.must_change_password??0,auth.record.id).run();
  await auth.db.prepare("INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,after_data) VALUES(?,?,?,?,?)").bind(auth.record.id,password?"UPDATE_PROFILE_AND_PASSWORD":"UPDATE_PROFILE","users",String(auth.record.id),JSON.stringify({fullName,phone,passwordChanged:Boolean(password)})).run();
  return Response.json({message:password?"تم حفظ البيانات وتغيير كلمة المرور":"تم حفظ بيانات الحساب",user:{fullName,phone}});
}catch(e){return Response.json({error:e instanceof Error?e.message:"تعذر حفظ بيانات الحساب"},{status:400});}}
