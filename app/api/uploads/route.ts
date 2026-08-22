import { requireSchoolAdmin } from "../../../db/authorization";
import { uploadPublicSchoolFile } from "../../../db/external-auth";

export async function POST(request:Request){
 try{const auth=await requireSchoolAdmin();if(auth.error)return auth.error;const form=await request.formData(),file=form.get("file");if(!(file instanceof File))return Response.json({error:"اختر ملفًا أولاً"},{status:400});const url=await uploadPublicSchoolFile(file);return Response.json({url,message:"تم رفع الملف بنجاح"});}
 catch(error){return Response.json({error:error instanceof Error?error.message:"تعذر رفع الملف"},{status:400});}
}
