import type { Metadata } from "next";
import { MemberCenter } from "@/components/member-center";
export const metadata:Metadata={title:"Your account",robots:{index:false,follow:false}};
export default function AccountPage(){return <MemberCenter/>;}
