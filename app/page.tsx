import { redirect } from "next/navigation";
import { externalIdentity } from "../db/external-auth";
import PublicLanding from "./PublicLanding";

export const dynamic="force-dynamic";

export default async function Home(){
  if(await externalIdentity()) redirect("/dashboard");
  return <PublicLanding/>;
}
