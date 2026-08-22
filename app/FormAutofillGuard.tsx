"use client";

import { useEffect } from "react";

/** يمنع المتصفح من نسخ بيانات المدير المحفوظة إلى نموذج إنشاء حساب جديد. */
export default function FormAutofillGuard(){
 useEffect(()=>{
  const menu=document.createElement("button");menu.type="button";menu.className="mobile-menu-toggle";menu.setAttribute("aria-label","فتح القائمة");menu.textContent="☰";
  const toggle=()=>document.body.classList.toggle("mobile-sidebar-open");menu.addEventListener("click",toggle);document.body.append(menu);
  const close=()=>document.body.classList.remove("mobile-sidebar-open");document.querySelector(".sidebar")?.addEventListener("click",close);
  const protect=(root:ParentNode=document)=>{
   if(!document.getElementById("school-stages")){const list=document.createElement("datalist");list.id="school-stages";["المرحلة الابتدائية","المرحلة المتوسطة","المرحلة الإعدادية","المرحلة الثانوية"].forEach(value=>{const option=document.createElement("option");option.value=value;list.append(option)});document.body.append(list);}
   root.querySelectorAll<HTMLInputElement>("input").forEach(input=>{
    const text=[input.placeholder,input.name,input.getAttribute("aria-label")].filter(Boolean).join(" ");
    const label=input.closest("label")?.textContent||"";
    if(label.includes("المرحلة أو الصف الدراسي")){input.setAttribute("list","school-stages");input.placeholder="اختر المرحلة أو اكتب الصف";}
    if(input.type==="password"){input.autocomplete="new-password";input.value="";input.dispatchEvent(new Event("input",{bubbles:true}));}
    if(/جوال|هاتف|phone|username|اسم المستخدم/i.test(text)){input.autocomplete="off";}
   });
  };
  protect();
  const observer=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node instanceof HTMLElement)protect(node)})));
  observer.observe(document.body,{childList:true,subtree:true});
  return()=>{observer.disconnect();menu.removeEventListener("click",toggle);menu.remove();document.querySelector(".sidebar")?.removeEventListener("click",close);};
 },[]);
 return null;
}
