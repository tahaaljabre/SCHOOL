"use client";
import {useEffect,useState} from "react";
type Shift={id:number;name:string};
export default function ShiftSwitcher(){
 const [data,setData]=useState<{role:string;shifts:Shift[];activeShiftId:number|null;isGlobal:boolean}|null>(null);
 const load=()=>fetch("/api/session/shifts").then(r=>r.ok?r.json():null).then(d=>d&&setData(d)).catch(()=>{});
 useEffect(()=>{void load();},[]);
 if(!data||!data.shifts.length)return null;
 const choose=async(shiftId:number)=>{const r=await fetch("/api/session/shifts",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({shiftId})});if(r.ok)location.reload();};
 return <label className="shift-switcher"><span>الفترة الحالية</span><select value={data.activeShiftId??""} onChange={e=>choose(Number(e.target.value))}>{data.shifts.map(shift=><option key={shift.id} value={shift.id}>{shift.name}</option>)}</select></label>;
}
