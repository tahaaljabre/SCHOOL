import SchoolApp from "../SchoolApp";
import { redirect } from "next/navigation";
import { externalIdentity } from "../../db/external-auth";
export const dynamic="force-dynamic";
export default async function Dashboard(){if(!(await externalIdentity()))redirect("/login");return <SchoolApp/>;}
