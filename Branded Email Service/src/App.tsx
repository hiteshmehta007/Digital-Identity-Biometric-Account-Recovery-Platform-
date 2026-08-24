import { useState } from 'react';
import { EmailSidebar } from './components/EmailSidebar';
import { EmailList } from './components/EmailList';
import { EmailViewer } from './components/EmailViewer';
import { ComposeEmail } from './components/ComposeEmail';
import { SettingsPanel } from './components/SettingsPanel';
import { SearchBar, SearchFilters } from './components/SearchBar';
import { Bell, User } from 'lucide-react';
import { Button } from './components/ui/button';

// Mock email data
const generateMockEmails = () => [
  {
    id: '1',
    from: 'Nuvana Team',
    fromEmail: 'welcome@nuvana.mail',
    to: 'user@nuvana.mail',
    subject: 'Welcome to Nuvana Mail!',
    preview: 'Thank you for joining Nuvana Mail. Here\'s everything you need to get started with your new secure email service...',
    body: 'Welcome to Nuvana Mail!\n\nThank you for joining our secure email platform. We\'re excited to have you here. Your new email address gives you access to:\n\n• End-to-end encryption for sensitive messages\n• Unlimited storage for emails and attachments\n• Advanced spam filtering and security\n• Cross-platform access (web, mobile, desktop)\n• Integration with calendar and other productivity tools\n\nTo get started, explore the settings panel to customize your experience. If you have any questions, feel free to reach out to our support team.\n\nBest regards,\nThe Nuvana Team',
    timestamp: '10:30 AM',
    isRead: false,
    isStarred: true,
    hasAttachment: false,
    labels: ['Important'],
    isEncrypted: false,
  },
  {
    id: '2',
    from: 'Security Team',
    fromEmail: 'security@nuvana.mail',
    to: 'user@nuvana.mail',
    subject: 'Your Account Security Summary',
    preview: 'We wanted to update you on your account security settings and recent activity...',
    body: 'Account Security Summary\n\nYour account security is our top priority. Here\'s a summary of your security settings:\n\n✓ End-to-end encryption: Enabled\n✓ Two-factor authentication: Recommended\n✓ Recovery options: Configured\n✓ Recent logins: No suspicious activity\n\nWe recommend enabling two-factor authentication for an extra layer of security. You can do this in your account settings.\n\nStay safe,\nNuvana Security Team',
    timestamp: 'Yesterday',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    labels: ['Important'],
    isEncrypted: true,
  },
  {
    id: '3',
    from: 'Sarah Johnson',
    fromEmail: 'sarah.j@company.com',
    to: 'user@nuvana.mail',
    subject: 'Project proposal for Q1 2025',
    preview: 'Hi! I wanted to share the updated project proposal with you. Please review the attached documents...',
    body: 'Hi there,\n\nI hope this email finds you well. I wanted to share the updated project proposal for Q1 2025. I\'ve attached the detailed documentation and timeline.\n\nPlease review when you get a chance and let me know your thoughts. We should schedule a meeting to discuss the implementation strategy.\n\nLooking forward to your feedback!\n\nBest,\nSarah',
    timestamp: '2 days ago',
    isRead: true,
    isStarred: false,
    hasAttachment: true,
    attachments: [
      { name: 'Q1-2025-Proposal.pdf', size: '2.4 MB', type: 'pdf' },
      { name: 'Timeline-Draft.xlsx', size: '856 KB', type: 'xlsx' },
    ],
    labels: ['Work'],
    isEncrypted: false,
  },
  {
    id: '4',
    from: 'Newsletter',
    fromEmail: 'updates@techweekly.com',
    to: 'user@nuvana.mail',
    subject: 'Tech Weekly: Top 10 AI Trends for 2025',
    preview: 'Your weekly dose of technology news and insights. This week: AI trends that will shape the future...',
    body: 'Tech Weekly Newsletter\n\nTop 10 AI Trends for 2025\n\n1. Generative AI becomes mainstream\n2. AI-powered healthcare diagnostics\n3. Autonomous vehicles reach new milestones\n4. AI in education and personalized learning\n5. Enhanced cybersecurity with AI\n\n...and much more!\n\nRead the full article on our website.\n\nStay informed,\nTech Weekly Team',
    timestamp: '3 days ago',
    isRead: false,
    isStarred: false,
    hasAttachment: false,
    labels: ['Personal'],
    isEncrypted: false,
  },
  {
    id: '5',
    from: 'Mark Thompson',
    fromEmail: 'mark.t@design.io',
    to: 'user@nuvana.mail',
    subject: 'Quick question about the wireframes',
    preview: 'Hey, I had a quick question about the wireframes you sent last week...',
    body: 'Hey,\n\nI had a quick question about the wireframes you sent last week. The mobile layout looks great, but I\'m wondering if we should adjust the navigation for tablets.\n\nCan we hop on a quick call tomorrow to discuss?\n\nThanks!\nMark',
    timestamp: '1 week ago',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    labels: ['Work'],
    isEncrypted: false,
  },
];

export default function App() {
  // Default to a placeholder user so onboarding is skipped in this branded build.
  // You can replace this with a real auth integration later.
  const [username, setUsername] = useState<string | null>('user');
  const [currentFolder, setCurrentFolder] = useState('inbox');
  const [emails, setEmails] = useState(generateMockEmails());
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});



  const handleCompose = () => {
    setIsComposing(true);
  };

  const handleSendEmail = (email: { to: string; subject: string; body: string; isEncrypted: boolean }) => {
    const newEmail = {
      id: Date.now().toString(),
      from: username || 'You',
      fromEmail: `${username}@nuvana.mail`,
      to: email.to,
      subject: email.subject,
      preview: email.body.substring(0, 100),
      body: email.body,
      timestamp: 'Just now',
      isRead: true,
      isStarred: false,
      hasAttachment: false,
      labels: [],
      isEncrypted: email.isEncrypted,
    };
    setEmails([newEmail, ...emails]);
    setIsComposing(false);
  };

  const handleToggleStar = (id: string) => {
    setEmails(
      emails.map((email) =>
        email.id === id ? { ...email, isStarred: !email.isStarred } : email
      )
    );
  };

  const handleArchive = (id: string) => {
    // In a real app, this would move to archive folder
    console.log('Archive email:', id);
  };

  const handleDelete = (id: string) => {
    // In a real app, this would move to trash folder
    setEmails(emails.filter((email) => email.id !== id));
    setSelectedEmailId(null);
  };

  const handleSearch = (query: string, filters: SearchFilters) => {
    setSearchQuery(query);
    setSearchFilters(filters);
  };

  // Filter emails based on folder and search
  const getFilteredEmails = () => {
    let filtered = emails;

    // Filter by folder
    if (currentFolder === 'starred') {
      filtered = filtered.filter((email) => email.isStarred);
    } else if (currentFolder === 'drafts') {
      filtered = []; // Mock: no drafts for now
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (email) =>
          email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.from.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply advanced filters
    if (searchFilters.from) {
      filtered = filtered.filter((email) =>
        email.fromEmail.toLowerCase().includes(searchFilters.from!.toLowerCase())
      );
    }
    if (searchFilters.subject) {
      filtered = filtered.filter((email) =>
        email.subject.toLowerCase().includes(searchFilters.subject!.toLowerCase())
      );
    }
    if (searchFilters.hasAttachment) {
      filtered = filtered.filter((email) => email.hasAttachment);
    }

    return filtered;
  };

  const selectedEmail = emails.find((email) => email.id === selectedEmailId) || null;
  const filteredEmails = getFilteredEmails();
  const unreadCount = emails.filter((email) => !email.isRead).length;

  // Show onboarding if no username
  // Show onboarding if no username
  const handleOnboardingComplete = (name?: string) => {
    setUsername(name || 'user');
  };

  // Simple placeholder OnboardingFlow used by the branded build to avoid missing import errors.
  function OnboardingFlow({ onComplete }: { onComplete?: (name?: string) => void }) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded shadow-md max-w-md text-center">
          <h3 className="text-lg font-semibold mb-2">Welcome to Nuvana</h3>
          <p className="text-sm text-gray-600 mb-4">A quick setup to get you started.</p>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            onClick={() => onComplete?.('user')}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (!username) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Show settings panel
  if (currentFolder === 'settings') {
    return (
      <SettingsPanel
        username={username}
        onBack={() => setCurrentFolder('inbox')}
      />
    );
  }

  // Main email interface
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span>Nuvana Mail</span>
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-8">
            <SearchBar onSearch={handleSearch} />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
            <div className="ml-2 text-sm text-gray-700">
              {username}@nuvana.mail
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <EmailSidebar
          currentFolder={currentFolder}
          onFolderChange={setCurrentFolder}
          onCompose={handleCompose}
          unreadCount={unreadCount}
        />
        <EmailList
          emails={filteredEmails}
          selectedEmailId={selectedEmailId}
          onEmailSelect={(id) => {
            setSelectedEmailId(id);
            // Mark as read
            setEmails(
              emails.map((email) =>
                email.id === id ? { ...email, isRead: true } : email
              )
            );
          }}
          onStar={handleToggleStar}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
        <EmailViewer
          email={selectedEmail}
          onReply={() => setIsComposing(true)}
          onForward={() => setIsComposing(true)}
          onStar={() => selectedEmailId && handleToggleStar(selectedEmailId)}
          onArchive={() => selectedEmailId && handleArchive(selectedEmailId)}
          onDelete={() => selectedEmailId && handleDelete(selectedEmailId)}
        />
      </div>

      {/* Compose Email */}
      {isComposing && (
        <ComposeEmail
          onClose={() => setIsComposing(false)}
          onSend={handleSendEmail}
          replyTo={
            selectedEmail
              ? {
                  email: selectedEmail.fromEmail,
                  subject: `Re: ${selectedEmail.subject}`,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
