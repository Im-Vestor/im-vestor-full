'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '~/lib/utils';
import {
  ChevronRight,
  Home,
  LogOut,
  HandCoins,
  HelpCircle,
  Calendar
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { useUser, useClerk } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebarContext } from '~/contexts/SidebarContext';
import Image from 'next/image';
const routes = [
  {
    label: 'Overview',
    icon: Home,
    href: '/admin/dashboard',
    color: 'text-sky-500',
    disabled: true,
  },
  {
    label: 'Suport',
    icon: HelpCircle,
    href: '/admin/support',
    color: 'text-violet-500',
    disabled: false,
  },
  {
    label: 'Meetings',
    icon: Calendar,
    href: '/admin/meetings',
    color: 'text-amber-500',
    disabled: false,
  },
];

// Mobile Dock Component
function MobileDock() {
  const pathname = usePathname();

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg md:hidden"
    >
      <nav className="flex justify-around items-center h-16 px-6">
        {routes.slice(0, 5).map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full px-1 relative',
                'transition-all duration-300 hover:scale-110',
                route.disabled && 'opacity-50 pointer-events-none'
              )}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </AnimatePresence>

              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <route.icon className={cn(
                  'h-5 w-5 transition-colors duration-300',
                  isActive ? route.color : 'text-muted-foreground'
                )} />
              </motion.div>

              {isActive ? (
                <motion.span
                  className={cn(
                    "text-xs mt-1 font-medium transition-colors duration-300",
                    " font-semibold"
                  )}
                  initial={{ y: 0 }}
                  animate={{ y: -2 }}
                  transition={{
                    repeat: 1,
                    repeatType: "reverse",
                    duration: 0.25,
                    ease: "easeInOut",
                    delay: 0.1
                  }}
                >
                  {route.label}
                </motion.span>
              ) : (
                <span className="text-xs mt-1 font-medium text-muted-foreground transition-colors duration-300">
                  {route.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
}

// Desktop Sidebar Component
function DesktopSidebar() {
  const { isOpen, setIsOpen } = useSidebarContext();
  const pathname = usePathname();

  return (
    <div className="h-screen hidden md:block relative">
      <motion.div
        className="flex flex-col h-full py-4 bg-background border-r fixed z-50"
        animate={{
          width: isOpen ? 240 : 70
        }}
        transition={{
          duration: 0.3,
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      >
        <div className={cn(
          "flex items-center justify-between px-3",
          !isOpen && "justify-center"
        )}
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0 }}
              >
                <Image src="/logo/imvestor.png" alt="Im-Vestor" width={32} height={32} />
                <span className="text-xl font-bold ">
                  Im-Vestor
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "transition-all bg-background-secondary  rounded-full",
                !isOpen && ""
              )}
            >
              <motion.div
                animate={{ rotate: isOpen ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronRight />
              </motion.div>
            </Button>
          </motion.div>
        </div>
        <div className="px-3 flex-1">
          <div className="space-y-1 pt-4">
            {routes.map((route, index) => {
              const isActive = pathname === route.href;
              return (
                <motion.div
                  key={route.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link
                    href={route.href}
                    className={cn(
                      'group flex items-center p-3 w-full rounded-lg transition-all',
                      'hover:bg-background-secondary duration-300',
                      isActive ? 'bg-background-secondary' : '',
                      route.disabled && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <motion.div
                      whileHover={{ rotate: [-5, 5] }}
                      transition={{ duration: 0.3, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
                    >
                      <route.icon className={cn('h-5 w-5 flex-shrink-0', isActive ? route.color : 'text-muted-foreground')} />
                    </motion.div>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.span
                          className={cn(
                            "ml-3 text-sm font-medium whitespace-nowrap",
                            isActive ? "text-foreground" : "text-muted-foreground"
                          )}
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {route.label}
                          {route.disabled && (
                            <Badge className="ml-1 scale-75 bg-background-secondary text-muted-foreground">Soon</Badge>
                          )}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-auto border-t pt-3 px-1">
          <SidebarFooter isOpen={isOpen} />
        </div>
      </motion.div>
    </div>
  );
}

// Sidebar Footer Component
function SidebarFooter({ isOpen }: { isOpen: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <div className="flex flex-col">
      {/* User Profile */}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <motion.div>
            <Button variant="ghost" className="py-6 hover:!bg-background-secondary mx-auto flex items-center">
              <div className="flex items-center">
                <motion.div whileHover={{ rotate: 10 }} transition={{ duration: 0.2 }}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.imageUrl} alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </motion.div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      className="ml-3 text-left w-36"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-sm font-medium truncate">{user?.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.emailAddresses?.[0]?.emailAddress}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Button>
          </motion.div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-background-secondary mb-4 ml-2">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive hover:!bg-destructive/10 hover:!text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </motion.div>
          </motion.div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Main Sidebar Component
export function Sidebar() {
  // For client-side rendering, check which component to render
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Use proper hydration handling
  if (!mounted) return null;

  // Display the appropriate component based on screen size
  if (isMobile) {
    return <MobileDock />;
  }

  return <DesktopSidebar />;
}