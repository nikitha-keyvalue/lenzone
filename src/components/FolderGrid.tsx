import { Card, CardContent } from '@/components/ui/card';
import { Upload, Image, Camera, FolderOpen } from 'lucide-react';

interface FolderGridProps {
  onFolderClick: (folderType: 'references' | 'all-photos' | 'selected-photos' | 'final-photos') => void;
}

const FOLDERS = [
  {
    id: 'references',
    title: 'References',
    description: 'Sample shots, mood boards, and inspiration images provided by the client',
    icon: Upload,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'all-photos',
    title: 'All Photos', 
    description: 'Raw and unedited photos from the event or photo session',
    icon: Image,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    id: 'selected-photos',
    title: 'Selected Photos',
    description: 'Approved photos selected for final editing and delivery',
    icon: Camera,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    id: 'final-photos',
    title: 'Final Photos',
    description: 'Final edited photos ready for client delivery and review',
    icon: Camera,
    color: 'text-purple-500', 
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
];

export default function FolderGrid({ onFolderClick }: FolderGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {FOLDERS.map((folder) => {
        const Icon = folder.icon;
        
        return (
          <Card 
            key={folder.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${folder.borderColor} border-2`}
            onClick={() => onFolderClick(folder.id as 'references' | 'all-photos' | 'selected-photos' | 'final-photos')}
          >
            <CardContent className="p-6 text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${folder.bgColor} mb-4`}>
                <Icon className={`h-8 w-8 ${folder.color}`} />
              </div>
              
              <h3 className="text-lg font-semibold mb-2 flex items-center justify-center">
                {folder.title}
                <FolderOpen className="h-4 w-4 ml-2 text-muted-foreground" />
              </h3>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {folder.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}