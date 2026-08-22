import SchoolApp from "../SchoolApp";
import { redirect } from "next/navigation";
import { requireSchoolUser } from "../../db/authorization";
export const dynamic="force-dynamic";
export default async function Dashboard(){const auth=await requireSchoolUser();if(auth.error)redirect("/login");return <SchoolApp/>;}
