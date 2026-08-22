import { redirect } from "next/navigation";
import { getChatGPTUser } from "./chatgpt-auth";
import { externalIdentity } from "../db/external-auth";
import PublicLanding from "./PublicLanding";

export const dynamic="force-dynamic";

export default async function Home(){
  if((await externalIdentity())??(await getChatGPTUser())) redirect("/dashboard");
  return <PublicLanding/>;
}
