import { Mail, Send, FileText, Trash2, Archive, Star, AlertCircle, Settings, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface EmailSidebarProps {
  currentFolder: string;
  onFolderChange: (folder: string) => void;
  onCompose: () => void;
  unreadCount: number;
}

export function EmailSidebar({
  currentFolder,
  onFolderChange,
  onCompose,
  unreadCount,
}: EmailSidebarProps) {
  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Mail, count: unreadCount },
    { id: 'sent', label: 'Sent', icon: Send, count: 0 },
    { id: 'drafts', label: 'Drafts', icon: FileText, count: 3 },
    { id: 'starred', label: 'Starred', icon: Star, count: 0 },
    { id: 'spam', label: 'Spam', icon: AlertCircle, count: 2 },
    { id: 'trash', label: 'Trash', icon: Trash2, count: 0 },
    { id: 'archive', label: 'Archive', icon: Archive, count: 0 },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm text-gray-900">Nuvana Mail</div>
          </div>
        </div>
        <Button onClick={onCompose} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Compose
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <nav className="space-y-1">
          {folders.map((folder) => {
            const Icon = folder.icon;
            return (
              <button
                key={folder.id}
                onClick={() => onFolderChange(folder.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  currentFolder === folder.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{folder.label}</span>
                </div>
                {folder.count > 0 && (
                  <Badge variant={currentFolder === folder.id ? 'default' : 'secondary'}>
                    {folder.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="px-3 py-2 text-xs text-gray-500">Labels</div>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Personal</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Work</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Important</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => onFolderChange('settings')}
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
