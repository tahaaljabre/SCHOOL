"use client";
import {useEffect,useState} from "react";
export default function PublicDevelopmentLink(){const [show,setShow]=useState(false);useEffect(()=>setShow(location.pathname==="/"||location.pathname==="/showcase"),[]);return show?<a className="development-link" href="/development">دائرة التطوير</a>:null;}
