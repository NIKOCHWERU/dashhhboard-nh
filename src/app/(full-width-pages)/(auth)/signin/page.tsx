import GoogleLogin from "@/components/auth/GoogleLogin";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | DASHBOARD NH",
  description: "Login untuk melanjutkan",
};

export default function SignIn() {
  return <GoogleLogin />;
}

