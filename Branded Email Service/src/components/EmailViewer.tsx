import { Star, Reply, Forward, Trash2, Archive, Download, MoreVertical, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';

interface Email {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  isStarred: boolean;
  hasAttachment: boolean;
  attachments?: Array<{ name: string; size: string; type: string }>;
  labels: string[];
  isEncrypted?: boolean;
}

interface EmailViewerProps {
  email: Email | null;
  onReply: () => void;
  onForward: () => void;
  onStar: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function EmailViewer({
  email,
  onReply,
  onForward,
  onStar,
  onArchive,
  onDelete,
}: EmailViewerProps) {
  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p>Select an email to read</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-xl mb-2">{email.subject}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {email.labels.map((label) => (
                <Badge key={label} variant="secondary">
                  {label}
                </Badge>
              ))}
              {email.isEncrypted && (
                <Badge variant="default" className="bg-green-600">
                  <Shield className="w-3 h-3 mr-1" />
                  Encrypted
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onStar}>
              <Star
                className={`w-5 h-5 ${
                  email.isStarred ? 'fill-yellow-400 text-yellow-400' : ''
                }`}
              />
            </Button>
            <Button variant="ghost" size="icon" onClick={onArchive}>
              <Archive className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Sender Info */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Avatar>
              <AvatarFallback>
                {email.from
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm text-gray-900">{email.from}</div>
              <div className="text-xs text-gray-500">{email.fromEmail}</div>
              <div className="text-xs text-gray-500 mt-1">
                To: {email.to}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">{email.timestamp}</div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-6">
        <div className="prose max-w-none">
          {email.body.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Attachments */}
        {email.hasAttachment && email.attachments && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="text-sm text-gray-700 mb-3">
              Attachments ({email.attachments.length})
            </h3>
            <div className="space-y-2">
              {email.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded flex items-center justify-center">
                      <span className="text-xs text-indigo-700 uppercase">
                        {attachment.type}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-900">{attachment.name}</div>
                      <div className="text-xs text-gray-500">{attachment.size}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <Button onClick={onReply}>
            <Reply className="w-4 h-4 mr-2" />
            Reply
          </Button>
          <Button variant="outline" onClick={onForward}>
            <Forward className="w-4 h-4 mr-2" />
            Forward
          </Button>
        </div>
      </div>
    </div>
  );
}
