import { HelpCircle, Mail, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import Link from 'next/link';

export function HelpSupportPanel() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Help & Support
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Email Support */}
          <div className="group relative rounded-lg border border-border/50 bg-card/50 p-4 transition-all hover:border-primary/50 hover:bg-card">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-center gap-4">
              <div className="rounded-full bg-blue-500/10 p-2">
                <Mail className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-muted-foreground">
                  Contact us at{' '}
                  <a href="mailto:help@im-vestor.com" className="text-primary hover:underline">
                    help@im-vestor.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Support Tickets */}
          <div className="group relative rounded-lg border border-border/50 bg-card/50 p-4 transition-all hover:border-primary/50 hover:bg-card">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-center gap-4">
              <div className="rounded-full bg-amber-500/10 p-2">
                <MessageSquare className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Support Tickets</p>
                <p className="text-sm text-muted-foreground">
                  Create a ticket for detailed assistance
                </p>
              </div>
              <Link href="/support-tickets">
                <Button variant="outline" size="sm" className="transition-transform hover:scale-105">
                  Create Ticket
                </Button>
              </Link>
            </div>
          </div>

          {/* Help Center */}
          <div className="group relative rounded-lg border border-border/50 bg-card/50 p-4 transition-all hover:border-primary/50 hover:bg-card">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-center gap-4">
              <div className="rounded-full bg-emerald-500/10 p-2">
                <HelpCircle className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Help Center</p>
                <p className="text-sm text-muted-foreground">
                  Browse our knowledge base and FAQs
                </p>
              </div>
              <Link href="/help">
                <Button variant="outline" size="sm" className="transition-transform hover:scale-105">
                  Visit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}