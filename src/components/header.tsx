import { useClerk, useUser } from "@clerk/nextjs";
import { type UserType } from "@prisma/client";
import { LogOut, Mail, User } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { api } from "~/utils/api";

const ENTREPRENEUR_MENUS = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Investors",
    href: "/investors",
  },
  {
    label: "Meetings",
    href: "/meetings",
  },
  {
    label: "News",
    href: "/news/entrepreneur",
  },
  {
    label: "Shop",
    href: "/shop",
  },
];

const INVESTOR_MENUS = [
  {
    label: "Companies",
    href: "/companies",
  },
  {
    label: "Meetings",
    href: "/meetings",
  },
  {
    label: "News",
    href: "/news/investor",
  },
  {
    label: "Shop",
    href: "/shop",
  },
];

const PARTNER_MENUS = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Referrals",
    href: "/referral/list",
  },
  {
    label: "News",
    href: "/news/partner",
  },
];

export const Header = () => {
  const router = useRouter();
  const path = usePathname();

  const { data: userDetails } = api.user.getUser.useQuery();

  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const [userType, setUserType] = useState<UserType | null>(null);

  useEffect(() => {
    if (user) {
      setUserType(user.publicMetadata.userType as UserType);
    }
  }, [user]);

  return (
    <div
      className={`mb-12 flex ${isSignedIn ? "items-center justify-between" : "justify-center"} rounded-full border border-white/10 px-8 py-4`}
    >
      <div
        className={`flex ${isSignedIn ? "w-1/3" : "w-full"} items-center gap-3`}
      >
        <Image src="/logo/imvestor.png" alt="Imvestor" width={24} height={24} />
        <h1 className="text-xl font-bold text-white">Im-Vestor</h1>
      </div>
      
      {isSignedIn && userType === "INVESTOR" && (
        <div className="flex w-1/3 items-center justify-center gap-3">
          {INVESTOR_MENUS.map((menu) => (
            <Button
              key={menu.href}
              variant="ghost"
              size="sm"
              className={`${path === menu.href ? "text-[#EFD687]" : ""}`}
              onClick={() => router.push(menu.href)}
            >
              {menu.label}
            </Button>
          ))}
        </div>
      )}

      {isSignedIn && userType === "ENTREPRENEUR" && (
        <div className="flex w-1/3 items-center justify-center gap-3">
          {ENTREPRENEUR_MENUS.map((menu) => (
            <Button
              key={menu.href}
              variant="ghost"
              size="sm"
              className={`${path === menu.href ? "text-[#EFD687]" : ""}`}
              onClick={() => router.push(menu.href)}
            >
              {menu.label}
            </Button>
          ))}
        </div>
      )}

      {isSignedIn && userType === "PARTNER" && (
        <div className="flex w-1/3 items-center justify-center gap-3">
          {PARTNER_MENUS.map((menu) => (
            <Button
              key={menu.href}
              variant="ghost"
              size="sm"
              className={`${path === menu.href ? "text-[#EFD687]" : ""}`}
              onClick={() => router.push(menu.href)}
            >
              {menu.label}
            </Button>
          ))}
        </div>
      )}

      {isSignedIn && (
        <div className="flex w-1/3 items-center justify-end gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-4">
                <span>{user?.firstName}</span>
                {userDetails?.imageUrl ? (
                  <Image
                    src={userDetails?.imageUrl ?? ""}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="size-6 rounded-full object-cover"
                  />
                ) : (
                  <User className="size-6" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/referral/share")}>
                <Mail className="h-4 w-4" />
                Referrals
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => signOut({ redirectUrl: "/login" })}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};
