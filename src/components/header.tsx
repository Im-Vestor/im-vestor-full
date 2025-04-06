import { useClerk, useUser } from "@clerk/nextjs";
import { type UserType } from "@prisma/client";
import { Book, LogOut, Mail, Menu, User, Users, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { Notifications } from "./notifications/notifications";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const ENTREPRENEUR_MENUS = [
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
    label: "Projects",
    href: "/projects",
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
  const { user, isSignedIn } = useUser();

  const isSignUpRoute = path?.startsWith("/sign-up");
  const { data: userDetails } = api.user.getUser.useQuery(
    undefined,
    { enabled: !isSignUpRoute && !!isSignedIn }
  );

  const { signOut } = useClerk();

  const [userType, setUserType] = useState<UserType | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setUserType(user.publicMetadata.userType as UserType);
    }
  }, [user]);

  // Get correct menu based on user type
  const getMenus = () => {
    if (userType === "INVESTOR") return INVESTOR_MENUS;
    if (userType === "ENTREPRENEUR") return ENTREPRENEUR_MENUS;
    if (userType === "PARTNER") return PARTNER_MENUS;
    return [];
  };

  // Handle navigation
  const handleNavigation = async (href: string) => {
    await router.push(href);
  };

  // Handle mobile navigation
  const handleMobileNavigation = async (href: string) => {
    await router.push(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="mb-12 md:rounded-full rounded-3xl border border-white/10 px-4 py-4 md:px-6 lg:px-8 bg-card">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image src="/logo/imvestor.png" alt="Imvestor" width={24} height={24} />
          <h1 className="text-xl font-bold text-white">Im-Vestor</h1>
        </div>

        {/* Desktop Navigation */}
        {isSignedIn && (
          <div className="hidden md:flex items-center justify-center gap-1 lg:gap-3">
            {getMenus().map((menu) => (
              <Button
                key={menu.href}
                variant="ghost"
                size="sm"
                className={`${path === menu.href ? "text-[#EFD687]" : ""}`}
                onClick={() => void handleNavigation(menu.href)}
              >
                {menu.label}
              </Button>
            ))}
          </div>
        )}

        {/* User Profile / Login */}
        {isSignedIn ? (
          <div className="flex items-center">
            <Notifications />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 md:gap-4">
                  <span className="hidden md:inline">{user?.firstName}</span>
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
                <DropdownMenuItem onClick={() => void handleNavigation("/profile")} className="hover:cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleNavigation("/connections")} className="hover:cursor-pointer">
                  <Users className="h-4 w-4 mr-2" />
                  Connections
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleNavigation("/referral/share")} className="hover:cursor-pointer">
                  <Mail className="h-4 w-4 mr-2" />
                  Referrals
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleNavigation("/terms")} className="hover:cursor-pointer">
                  <Book className="h-4 w-4 mr-2" />
                  Terms
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut({ redirectUrl: "/login" })}
                  className="hover:cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        ) : (
          <div></div> // Empty div for non-signed in state
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {isSignedIn && isMobileMenuOpen && (
        <div className="mt-4 flex flex-col space-y-2 md:hidden">
          {getMenus().map((menu) => (
            <Button
              key={menu.href}
              variant="ghost"
              size="sm"
              className={`justify-start ${path === menu.href ? "text-[#EFD687]" : ""}`}
              onClick={() => void handleMobileNavigation(menu.href)}
            >
              {menu.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
