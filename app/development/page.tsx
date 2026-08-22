import { redirect } from "next/navigation";
import DevelopmentHub from "../DevelopmentHub";
import { requireSchoolUser } from "../../db/authorization";

export const dynamic="force-dynamic";
export default async function DevelopmentCircle(){
 const auth=await requireSchoolUser();
 if(auth.error||auth.record.role!=="SUPER_ADMIN")redirect("/login");
 return <DevelopmentHub/>;
}
