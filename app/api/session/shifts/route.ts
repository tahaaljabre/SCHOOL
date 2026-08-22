import { requireShiftContext } from "../../../../db/authorization";

export async function GET(){
 const scope=await requireShiftContext();
 if(scope.error)return scope.error;
 return Response.json({role:scope.record.role,shifts:scope.shifts,activeShiftId:scope.activeShiftId,isGlobal:scope.isGlobal});
}

export async function POST(request:Request){
 const scope=await requireShiftContext();
 if(scope.error)return scope.error;
 const p=await request.json() as {shiftId?:number};
 const shiftId=Number(p.shiftId);
 if(!scope.shifts.some(shift=>shift.id===shiftId))return Response.json({error:"لا تملك صلاحية هذه الفترة"},{status:403});
 return Response.json({message:"تم تبديل الفترة",activeShiftId:shiftId},{headers:{"set-cookie":`school_active_shift=${shiftId}; Path=/; SameSite=Lax; Max-Age=2592000`}});
}
