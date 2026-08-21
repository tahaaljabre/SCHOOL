import SchoolApp from "./SchoolApp";
import { redirect } from "next/navigation";
import { getChatGPTUser } from "./chatgpt-auth";
import { externalIdentity } from "../db/external-auth";

export const dynamic = "force-dynamic";

export default async function Home(){
 const identity=(await externalIdentity())??(await getChatGPTUser());
 if(!identity)redirect("/login");
 return <SchoolApp/>;
}
