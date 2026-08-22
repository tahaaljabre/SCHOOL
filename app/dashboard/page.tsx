import SchoolApp from "../SchoolApp";
import { redirect } from "next/navigation";
import { getChatGPTUser } from "../chatgpt-auth";
import { externalIdentity } from "../../db/external-auth";
export const dynamic="force-dynamic";
export default async function Dashboard(){if(!((await externalIdentity())??(await getChatGPTUser())))redirect("/login");return <SchoolApp/>;}
