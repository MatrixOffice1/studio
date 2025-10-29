
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [aiProvider, setAiProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [n8nWebhook, setN8nWebhook] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveChanges = async () => {
    setIsSaving(true);
    // Mock saving settings
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Saving settings:', { aiProvider, apiKey, n8nWebhook });
    toast({
      title: 'Settings Saved',
      description: 'Your settings have been updated successfully.',
    });
    setIsSaving(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application and integration settings.</p>
      </header>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>AI Configuration</CardTitle>
            <CardDescription>Configure your AI provider and API key for features like chat summary.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-provider">AI Provider</Label>
              <Select value={aiProvider} onValueChange={setAiProvider}>
                <SelectTrigger id="ai-provider">
                  <SelectValue placeholder="Select AI Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">{aiProvider === 'gemini' ? 'Gemini' : 'OpenAI'} API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
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
              <Input
                id="n8n-webhook"
                placeholder="https://n8n.example.com/webhook/..."
                value={n8nWebhook}
                onChange={(e) => setN8nWebhook(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
