import { redirect } from "next/navigation";
import { externalIdentity } from "../db/external-auth";
import PublicLanding from "./PublicLanding";

export const dynamic="force-dynamic";

export default async function Home(){
  const identity=await externalIdentity();
  if(identity) redirect(identity.email.trim().toLowerCase()==="tahaaljabre@hotmail.com"?"/development":"/dashboard");
  return <PublicLanding/>;
}
