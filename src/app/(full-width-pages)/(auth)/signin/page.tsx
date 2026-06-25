import GoogleLogin from "@/components/auth/GoogleLogin";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Login untuk melanjutkan",
};

export default function SignIn() {
  return <GoogleLogin />;
}

