import { useState } from 'react';
import { X, Paperclip, Image, Smile, Send, Minimize2, Maximize2, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';

interface ComposeEmailProps {
  onClose: () => void;
  onSend: (email: {
    to: string;
    subject: string;
    body: string;
    isEncrypted: boolean;
  }) => void;
  replyTo?: {
    email: string;
    subject: string;
  };
}

export function ComposeEmail({ onClose, onSend, replyTo }: ComposeEmailProps) {
  const [to, setTo] = useState(replyTo?.email || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(replyTo?.subject || '');
  const [body, setBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);

  const handleSend = () => {
    if (to && subject && body) {
      onSend({ to, subject, body, isEncrypted });
      onClose();
    }
  };

  const handleAddAttachment = () => {
    // Mock attachment
    setAttachments([...attachments, `document-${attachments.length + 1}.pdf`]);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-4 w-80 bg-white border border-gray-300 rounded-t-lg shadow-lg">
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <span className="text-sm truncate">New Message</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={() => setIsMinimized(false)}
              aria-label="Restore compose window"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onClose} aria-label="Close compose window">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-4 w-[600px] bg-white border border-gray-300 rounded-t-lg shadow-2xl flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <span className="text-sm">New Message</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6"
            onClick={() => setIsMinimized(true)}
              aria-label="Minimize compose window"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onClose} aria-label="Close compose window">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 w-12">To:</label>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@email.com"
              className="flex-1"
            />
            {!showCc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCc(true)}
                className="text-xs"
              >
                Cc
              </Button>
            )}
            {!showBcc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBcc(true)}
                className="text-xs"
              >
                Bcc
              </Button>
            )}
          </div>

          {showCc && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 w-12">Cc:</label>
              <Input
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@email.com"
                className="flex-1"
              />
            </div>
          )}

          {showBcc && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 w-12">Bcc:</label>
              <Input
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@email.com"
                className="flex-1"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 w-12">Subject:</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="flex-1"
            />
          </div>

          <div className="border-t border-gray-200 pt-3">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              className="min-h-[200px] border-0 focus-visible:ring-0 resize-none"
            />
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" aria-hidden="true" />
                  {attachment}
                  <button
                    onClick={() =>
                      setAttachments(attachments.filter((_, i) => i !== index))
                    }
                    className="ml-1"
                    aria-label={`Remove attachment ${attachment}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {isEncrypted && (
            <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                End-to-end encryption enabled
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 flex items-center justify-between">
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={handleAddAttachment} aria-label="Add attachment">
            <Paperclip className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Add image">
            <Image className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Insert emoji">
            <Smile className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEncrypted(!isEncrypted)}
            className={isEncrypted ? 'text-green-600' : ''}
            aria-label={isEncrypted ? 'Disable end-to-end encryption' : 'Enable end-to-end encryption'}
            aria-pressed={isEncrypted}
          >
            <Shield className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!to || !subject || !body}>
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
