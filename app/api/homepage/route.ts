import { ensureCoreSchema } from "../../../db/core";
import { requireSchoolAdmin } from "../../../db/authorization";

const types=["ACHIEVER","NEWS","REPORT","MEDIA","PHOTO"];
const text=(value:unknown,max:number)=>String(value??"").trim().slice(0,max);

export async function GET(){
 try{const auth=await requireSchoolAdmin();if(auth.error)return auth.error;
  const [settings,items]=await Promise.all([
   auth.db.prepare("SELECT * FROM public_home_settings WHERE id=1").first<Record<string,unknown>>(),
   auth.db.prepare("SELECT * FROM public_home_items ORDER BY sort_order,id DESC").all()
  ]);
  return Response.json({settings:settings??{},items:items.results},{headers:{"cache-control":"no-store, max-age=0"}});
 }catch{return Response.json({error:"تعذر تحميل إعدادات الشاشة الرئيسية"},{status:500});}
}

export async function PUT(request:Request){
 try{const auth=await requireSchoolAdmin();if(auth.error)return auth.error;const p=await request.json() as Record<string,unknown>,action=text(p.action,30);
  if(action==="settings"){
   await auth.db.prepare("UPDATE public_home_settings SET hero_title=?,hero_text=?,manager_name=?,manager_role=?,manager_phone=?,manager_image_url=?,ticker_text=?,updated_at=CURRENT_TIMESTAMP WHERE id=1").bind(text(p.heroTitle,120),text(p.heroText,500),text(p.managerName,120),text(p.managerRole,80)||"مدير المدرسة",text(p.managerPhone,40),text(p.managerImageUrl,1000),text(p.tickerText,500)).run();
  }else if(action==="create"||action==="update"){
   const itemType=text(p.itemType,20),title=text(p.title,160);if(!types.includes(itemType)||title.length<2)return Response.json({error:"اختر نوع البطاقة واكتب عنوانًا واضحًا"},{status:400});
   let imageUrl=text(p.imageUrl,4000),mediaUrl=text(p.mediaUrl,1000);if(!mediaUrl&&/(?:youtu\.be|youtube\.com)/i.test(imageUrl)){mediaUrl=imageUrl;imageUrl="";}const values=[itemType,title,text(p.body,2400),imageUrl,mediaUrl,text(p.achieverPercentage,20),text(p.achieverAverage,20),text(p.achieverRank,80),Number(p.sortOrder)||0,Boolean(p.published)?1:0];
   if(action==="create")await auth.db.prepare("INSERT INTO public_home_items(item_type,title,body,image_url,media_url,achiever_percentage,achiever_average,achiever_rank,sort_order,published) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(...values).run();
   else {const id=Number(p.id);if(!id)return Response.json({error:"البطاقة غير موجودة"},{status:400});await auth.db.prepare("UPDATE public_home_items SET item_type=?,title=?,body=?,image_url=?,media_url=?,achiever_percentage=?,achiever_average=?,achiever_rank=?,sort_order=?,published=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(...values,id).run();}
  }else if(action==="delete"){
   const id=Number(p.id);if(!id)return Response.json({error:"البطاقة غير موجودة"},{status:400});await auth.db.prepare("DELETE FROM public_home_items WHERE id=?").bind(id).run();
  }else return Response.json({error:"العملية غير معروفة"},{status:400});
  return Response.json({message:"تم حفظ إعدادات الشاشة الرئيسية"});
 }catch{return Response.json({error:"تعذر حفظ إعدادات الشاشة الرئيسية"},{status:500});}
}
