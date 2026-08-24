import { useState } from 'react';
import { Shield, Lock, Key, Bell, Eye, Database, Download, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';

interface SettingsPanelProps {
  username: string;
  onBack: () => void;
}

export function SettingsPanel({ username, onBack }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('security');
  const [e2eEnabled, setE2eEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [readReceipts, setReadReceipts] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);

  const tabs = [
    { id: 'security', label: 'Security & Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'recovery', label: 'Recovery', icon: Key },
    { id: 'data', label: 'Data & Storage', icon: Database },
  ];

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack}>
            ← Back to Inbox
          </Button>
          <h1 className="text-2xl mt-4 mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account security, privacy, and preferences
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="w-64 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white shadow-sm text-indigo-700'
                      : 'text-gray-700 hover:bg-white/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {/* Security & Privacy */}
            {activeTab === 'security' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Encryption</CardTitle>
                    <CardDescription>
                      Control how your messages are encrypted and secured
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>End-to-End Encryption</Label>
                        <p className="text-sm text-gray-500">
                          Encrypt sensitive messages for maximum privacy
                        </p>
                      </div>
                      <Switch checked={e2eEnabled} onCheckedChange={setE2eEnabled} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Zero-Knowledge Recovery</Label>
                        <p className="text-sm text-gray-500">
                          Integrated with PIAP for secure account recovery
                        </p>
                      </div>
                      <Badge className="bg-green-600">Active</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>
                      Manage who can see your activity and information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Read Receipts</Label>
                        <p className="text-sm text-gray-500">
                          Let senders know when you've read their messages
                        </p>
                      </div>
                      <Switch
                        checked={readReceipts}
                        onCheckedChange={setReadReceipts}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Profile Visibility</Label>
                        <p className="text-sm text-gray-500">
                          Control who can see your profile information
                        </p>
                      </div>
                      <select aria-label="Profile visibility" className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                        <option>Everyone</option>
                        <option>Contacts Only</option>
                        <option>Nobody</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Security Audit Log</CardTitle>
                    <CardDescription>
                      Recent login and access attempts to your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {
                          action: 'Successful login',
                          location: 'New York, USA',
                          ip: '192.168.1.1',
                          time: '2 hours ago',
                        },
                        {
                          action: 'Password changed',
                          location: 'New York, USA',
                          ip: '192.168.1.1',
                          time: '1 day ago',
                        },
                        {
                          action: 'Successful login',
                          location: 'New York, USA',
                          ip: '192.168.1.1',
                          time: '3 days ago',
                        },
                      ].map((log, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <div className="text-sm">{log.action}</div>
                            <div className="text-xs text-gray-500">
                              {log.location} • {log.ip}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">{log.time}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>
                      Choose when and how you want to be notified
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Desktop Notifications</Label>
                        <p className="text-sm text-gray-500">
                          Show notifications on your desktop
                        </p>
                      </div>
                      <Switch
                        checked={notificationsEnabled}
                        onCheckedChange={setNotificationsEnabled}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Mobile Push Notifications</Label>
                        <p className="text-sm text-gray-500">
                          Receive push notifications on your mobile device
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Digest</Label>
                        <p className="text-sm text-gray-500">
                          Receive a daily summary of your emails
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Filter Notifications</CardTitle>
                    <CardDescription>
                      Choose which types of emails trigger notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {['All emails', 'Important only', 'Contacts only', 'None'].map(
                      (option) => (
                        <label key={option} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="filter" defaultChecked={option === 'All emails'} />
                          <span className="text-sm">{option}</span>
                        </label>
                      )
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Recovery */}
            {activeTab === 'recovery' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Recovery Options</CardTitle>
                    <CardDescription>
                      Keep your account recovery information up to date
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="recovery-email">Backup Email</Label>
                      <Input
                        id="recovery-email"
                        type="email"
                        defaultValue="backup@email.com"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="recovery-phone">Recovery Phone</Label>
                      <Input
                        id="recovery-phone"
                        type="tel"
                        defaultValue="+1 (555) 000-0000"
                        className="mt-2"
                      />
                    </div>
                    <Button>Update Recovery Options</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Security Questions</CardTitle>
                    <CardDescription>
                      Update your security questions for account recovery
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Question 1</Label>
                      <select aria-label="Security question 1" className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md">
                        <option>What was the name of your first pet?</option>
                        <option>In what city were you born?</option>
                        <option>What was the name of your elementary school?</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="answer">Answer</Label>
                      <Input id="answer" type="password" defaultValue="********" className="mt-2" />
                    </div>
                    <Button>Update Security Questions</Button>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      Recovery Codes
                    </CardTitle>
                    <CardDescription>
                      Generate backup codes to access your account if you lose your credentials
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline">Generate Recovery Codes</Button>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Data & Storage */}
            {activeTab === 'data' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Storage Usage</CardTitle>
                    <CardDescription>
                      Monitor your mailbox storage and attachment usage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Storage Used</span>
                          <span className="text-sm">2.4 GB / 15 GB</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-indigo-600 h-2 rounded-full w-1/6" />
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-sm">
                          <div className="text-gray-500">Messages</div>
                          <div>1,247</div>
                        </div>
                        <div className="text-sm">
                          <div className="text-gray-500">Attachments</div>
                          <div>1.8 GB</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Attachment Settings</CardTitle>
                    <CardDescription>
                      Control how attachments are handled
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-Download Attachments</Label>
                        <p className="text-sm text-gray-500">
                          Automatically download attachments when opening emails
                        </p>
                      </div>
                      <Switch
                        checked={autoDownload}
                        onCheckedChange={setAutoDownload}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Virus Scanning</Label>
                        <p className="text-sm text-gray-500">
                          Scan all attachments for malware and viruses
                        </p>
                      </div>
                      <Badge className="bg-green-600">Active</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Data Export</CardTitle>
                    <CardDescription>
                      Download a copy of your emails and data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button>
                      <Download className="w-4 h-4 mr-2" />
                      Export All Data
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${className}`}
    >
      {children}
    </span>
  );
}
