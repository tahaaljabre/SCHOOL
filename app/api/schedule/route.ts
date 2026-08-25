import { requireSchoolAdminShift, requireSchoolUser } from "../../../db/authorization";

export async function GET(){try{
 const user=await requireSchoolUser();if(user.error)return user.error;
 let filter="",bind:unknown[]=[] as unknown[],readOnly=false,subjectFilter="",subjectBind:unknown[]=[];
 if(["SUPER_ADMIN","ADMIN"].includes(user.record.role)){const auth=await requireSchoolAdminShift();if(auth.error)return auth.error;filter=auth.isGlobal?"":" WHERE c.shift_id=?";bind=auth.isGlobal?[]:[auth.activeShiftId];if(!auth.isGlobal){subjectFilter=" AND id IN (SELECT subject_id FROM subject_shifts WHERE shift_id=?)";subjectBind=[auth.activeShiftId];}}
 else if(user.record.role==="STUDENT"){const link=await user.db.prepare("SELECT entity_id FROM account_links WHERE user_id=? AND entity_type='student'").bind(user.record.id).first<{entity_id:number}>();const student=link&&await user.db.prepare("SELECT classroom_id FROM students WHERE id=? AND archived_at IS NULL").bind(link.entity_id).first<{classroom_id:number}>();if(!student?.classroom_id)return Response.json({entries:[],classes:[],teachers:[],subjects:[],workDays:[],readOnly:true});filter=" WHERE c.id=?";bind=[student.classroom_id];readOnly=true;}
 else if(user.record.role==="PARENT"){const link=await user.db.prepare("SELECT entity_id FROM account_links WHERE user_id=? AND entity_type='parent'").bind(user.record.id).first<{entity_id:number}>();if(!link)return Response.json({entries:[],classes:[],teachers:[],subjects:[],workDays:[],readOnly:true});filter=" WHERE c.id IN (SELECT s.classroom_id FROM parent_students ps JOIN students s ON s.id=ps.student_id WHERE ps.parent_id=?)";bind=[link.entity_id];readOnly=true;}
 else return Response.json({error:"هذه الصفحة متاحة للمعلم أو الإدارة فقط"},{status:403});
 const [entries,classes,teachers,subjects,settings,shifts]=await Promise.all([
  user.db.prepare(`SELECT e.*,c.name classroom_name,t.full_name teacher_name,s.name subject_name,c.shift_id FROM schedule_entries e JOIN classrooms c ON c.id=e.classroom_id JOIN teachers t ON t.id=e.teacher_id JOIN subjects s ON s.id=e.subject_id${filter} ORDER BY e.day_of_week,e.period_number`).bind(...bind).all(),
  user.db.prepare("SELECT id,name,shift_id FROM classrooms WHERE archived_at IS NULL ORDER BY name").all(),
  user.db.prepare("SELECT id,full_name name FROM teachers WHERE archived_at IS NULL ORDER BY full_name").all(),
  user.db.prepare(`SELECT id,name FROM subjects WHERE archived_at IS NULL${subjectFilter} ORDER BY name`).bind(...subjectBind).all(),user.db.prepare("SELECT work_days FROM school_settings WHERE id=1").first<{work_days:string}>(),user.db.prepare("SELECT id,name,starts_at,ends_at,gender_scope FROM shifts WHERE status='ACTIVE' ORDER BY id").all()
 ]);
 return Response.json({entries:entries.results,classes:classes.results,teachers:teachers.results,subjects:subjects.results,workDays:JSON.parse(settings?.work_days||"[6,0,1,2,3]"),shifts:shifts.results,readOnly});
}catch{return Response.json({error:"تعذر تحميل الجدول"},{status:500});}}

export async function POST(request:Request){try{
 const auth=await requireSchoolAdminShift();if(auth.error)return auth.error;
 const p=await request.json() as Record<string,unknown>,classroomId=Number(p.classroomId),teacherId=Number(p.teacherId),subjectId=Number(p.subjectId),day=Number(p.dayOfWeek),period=Number(p.periodNumber);
 const settings=await auth.db.prepare("SELECT work_days FROM school_settings WHERE id=1").first<{work_days:string}>(),workDays=JSON.parse(settings?.work_days||"[]") as number[];
 if(!classroomId||!teacherId||!subjectId||!workDays.includes(day)||period<1||period>8)return Response.json({error:"اختر يوم عمل صحيحًا وأكمل بيانات الحصة"},{status:400});
 const classroom=await auth.db.prepare("SELECT shift_id FROM classrooms WHERE id=? AND archived_at IS NULL").bind(classroomId).first<{shift_id:number}>();
 if(!classroom?.shift_id)return Response.json({error:"يجب تعيين الفصل إلى فترة أولًا"},{status:400});
 if(!auth.isGlobal&&classroom.shift_id!==auth.activeShiftId)return Response.json({error:"لا يمكنك تعديل جدول الفترة الأخرى"},{status:403});
 const assigned=await auth.db.prepare("SELECT 1 ok FROM teacher_shifts WHERE teacher_id=? AND shift_id=?").bind(teacherId,classroom.shift_id).first();if(!assigned)return Response.json({error:"المعلم غير معين في فترة هذا الفصل"},{status:403});
 const result=await auth.db.prepare("INSERT INTO schedule_entries(classroom_id,teacher_id,subject_id,day_of_week,period_number,starts_at,ends_at) VALUES(?,?,?,?,?,?,?)").bind(classroomId,teacherId,subjectId,day,period,String(p.startsAt||"07:00"),String(p.endsAt||"07:45")).run();return Response.json({message:"تمت إضافة الحصة",id:result.meta.last_row_id},{status:201});
}catch(e){return Response.json({error:String(e).includes("UNIQUE")?"يوجد تعارض للمعلم أو الفصل في هذه الحصة":"تعذر إضافة الحصة"},{status:400});}}

export async function DELETE(request:Request){try{const auth=await requireSchoolAdminShift();if(auth.error)return auth.error;const id=Number(new URL(request.url).searchParams.get("id"));const entry=await auth.db.prepare("SELECT c.shift_id FROM schedule_entries e JOIN classrooms c ON c.id=e.classroom_id WHERE e.id=?").bind(id).first<{shift_id:number}>();if(!entry)return Response.json({error:"الحصة غير موجودة"},{status:404});if(!auth.isGlobal&&entry.shift_id!==auth.activeShiftId)return Response.json({error:"لا يمكنك حذف حصة من الفترة الأخرى"},{status:403});await auth.db.prepare("DELETE FROM schedule_entries WHERE id=?").bind(id).run();return Response.json({message:"تم حذف الحصة"});}catch{return Response.json({error:"تعذر حذف الحصة"},{status:400});}}
