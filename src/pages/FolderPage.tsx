import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Camera } from 'lucide-react';
import FolderView from '@/components/FolderView';

export default function FolderPage() {
  const { id, folderType } = useParams<{ id: string; folderType: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isShared = searchParams.get('shared') === 'true';

  const getFolderTitle = (type: string) => {
    switch (type) {
      case 'references': return 'Reference Images';
      case 'all-photos': return 'All Photos';
      case 'selected-photos': return 'Selected Photos';
      case 'final-photos': return 'Final Photos';
      default: return 'Files';
    }
  };

  const handleBack = () => {
    navigate(`/client/${id}${isShared ? '?shared=true' : ''}`);
  };

  if (!id || !folderType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid folder</h2>
          {!isShared && (
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Client
            </Button>
            <div className="h-6 w-px bg-border"></div>
            <Camera className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">{getFolderTitle(folderType)}</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{getFolderTitle(folderType)}</CardTitle>
          </CardHeader>
          <CardContent>
            <FolderView 
              clientId={id}
              folderType={folderType as 'references' | 'all-photos' | 'selected-photos' | 'final-photos'}
              onBack={handleBack}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}