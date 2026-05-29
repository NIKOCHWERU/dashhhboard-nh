"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";

export default function GoogleLogin() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-max-w-[400px] bg-white dark:bg-gray-800 rounded-5xl shadow-2xl p-10 border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-10">
          <div className="mb-6 inline-block p-4 rounded-full bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20">
            <Image
              src="/images/logo/logo-law.png"
              alt="Law Firm Logo"
              width={100}
              height={100}
              className="mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">DASHBOARD NH</h1>
          <p className="text-gray-500 dark:text-gray-400">Silakan masuk untuk melanjutkan</p>
        </div>


        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-white font-medium bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md group active:scale-95"
        >
          <svg className="w-6 h-6" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          <span>Login Dengan Google</span>
        </button>

        <div className="mt-8 text-center">
        </div>
      </div>

      {/* Gold Accent */}
      <div className="mt-12 w-24 h-1 bg-brand-500 rounded-full opacity-50"></div>
    </div>
  );
}
