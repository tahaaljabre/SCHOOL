export async function GET(request:Request){
 void request;
 return new Response(null,{status:302,headers:{location:"/showcase","set-cookie":"school_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0","clear-site-data":"\"cookies\"","cache-control":"no-store"}});
}
