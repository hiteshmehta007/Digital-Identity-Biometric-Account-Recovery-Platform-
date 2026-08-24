import { Star, Paperclip, Archive, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';

interface Email {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachment: boolean;
  labels: string[];
}

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onEmailSelect: (id: string) => void;
  onStar: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function EmailList({
  emails,
  selectedEmailId,
  onEmailSelect,
  onStar,
  onArchive,
  onDelete,
}: EmailListProps) {
  return (
    <div className="w-96 border-r border-gray-200 bg-white overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm text-gray-500">{emails.length} messages</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => onEmailSelect(email.id)}
            className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedEmailId === email.id ? 'bg-indigo-50' : ''
            } ${!email.isRead ? 'bg-blue-50' : ''}`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm truncate ${
                      !email.isRead ? 'text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {email.from}
                  </span>
                  {!email.isRead && (
                    <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStar(email.id);
                  }}
                  className="hover:bg-gray-200 p-1 rounded"
                  aria-label={email.isStarred ? 'Unstar message' : 'Star message'}
                >
                  <Star
                    className={`w-4 h-4 ${
                      email.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                    }`}
                  />
                </button>
                <span className="text-xs text-gray-500">{email.timestamp}</span>
              </div>
            </div>
            <div
              className={`text-sm truncate mb-1 ${
                !email.isRead ? 'text-gray-900' : 'text-gray-700'
              }`}
            >
              {email.subject}
            </div>
            <div className="text-xs text-gray-500 truncate mb-2">{email.preview}</div>
            <div className="flex items-center gap-2">
              {email.hasAttachment && (
                <Paperclip className="w-3 h-3 text-gray-400" aria-hidden="true" />
              )}
              {email.labels.map((label) => (
                <Badge key={label} variant="secondary" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
