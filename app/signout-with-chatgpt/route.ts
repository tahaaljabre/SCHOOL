export async function GET(request:Request){
 const requested=new URL(request.url).searchParams.get("return_to")||"/";
 const destination=requested.startsWith("/")&&!requested.startsWith("//")?requested:"/";
 return new Response(null,{status:302,headers:{location:destination,"set-cookie":"school_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"}});
}
