import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application settings.</p>
      </header>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Sofia" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="sofia@peluflow.com" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure how you receive notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="new-message" className="font-medium">New Messages</Label>
                <p className="text-sm text-muted-foreground">Receive a notification for each new message.</p>
              </div>
              <Switch id="new-message" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="appointment-reminder" className="font-medium">Appointment Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminded of upcoming appointments.</p>
              </div>
              <Switch id="appointment-reminder" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Integration</CardTitle>
            <CardDescription>Manage your n8n and Supabase connections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="n8n-webhook">n8n Webhook URL</Label>
              <Input id="n8n-webhook" placeholder="https://n8n.example.com/webhook/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supabase-key">Supabase API Key</Label>
              <Input id="supabase-key" type="password" placeholder="••••••••••••••••••••••••" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}
