'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useUserSettings } from '@/hooks/use-user-settings';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, refreshSettings } = useUserSettings();
  const [aiProvider, setAiProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [n8nWebhook, setN8nWebhook] = useState('');
  const [syncInterval, setSyncInterval] = useState('5');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (settings) {
      setAiProvider(settings.aiProvider || 'gemini');
      setApiKey(settings.gemini_api_key || '');
      setN8nWebhook(settings.n8n_webhook_url || '');
      setSyncInterval(String(settings.sync_interval || '5'));
    }
  }, [settings]);

  const handleSaveChanges = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to save settings.',
      });
      return;
    }

    setIsSaving(true);

    const newSettings = {
      aiProvider,
      gemini_api_key: apiKey,
      n8n_webhook_url: n8nWebhook,
      sync_interval: parseInt(syncInterval, 10) || 5,
    };

    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, settings: newSettings }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error Saving Settings',
        description: error.message || 'Could not save your settings to the database.',
      });
    } else {
      toast({
        title: 'Settings Saved',
        description: 'Your settings have been updated successfully.',
      });
      // Refresh the settings in the context
      if (refreshSettings) {
        refreshSettings();
      }
    }
    
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
                  <SelectItem value="openai" disabled>OpenAI (coming soon)</SelectItem>
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
            <div className="space-y-2">
                <Label htmlFor="sync-interval">Auto-Sync Interval (minutes)</Label>
                <Input
                    id="sync-interval"
                    type="number"
                    placeholder="e.g., 5"
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(e.target.value)}
                    min="1"
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
