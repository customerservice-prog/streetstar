import type {Metadata} from "next";
import { AccountSecurity } from "@/components/account-security";
export const metadata:Metadata={title:"Account security",robots:{index:false,follow:false},referrer:"no-referrer"};
export default function AccountSecurityPage(){return <AccountSecurity/>;}
