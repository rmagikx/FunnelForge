"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  function getSupabase() {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-heading text-xl font-bold text-navy">
            FunnelForge
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {/* Avatar */}
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-xs font-medium text-white">
                    {(
                      user.user_metadata?.full_name?.[0] ||
                      user.email?.[0] ||
                      "?"
                    ).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[160px] truncate">
                    {user.email}
                  </span>
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <div className="px-4 py-2 text-xs text-gray-400 truncate sm:hidden">
                      {user.email}
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-lg bg-navy px-4 py-1.5 text-sm font-medium text-white hover:bg-navy-light transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
