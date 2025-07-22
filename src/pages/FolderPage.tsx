import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Camera, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import FolderView from '@/components/FolderView';

export default function FolderPage() {
  const { id, folderType } = useParams<{ id: string; folderType: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isShared = searchParams.get('shared') === 'true';
  const [uploading, setUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const { toast } = useToast();

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

  const FOLDER_CONFIG = {
    references: {
      bucket: 'client-references',
      uploadText: 'Upload References'
    },
    'all-photos': {
      bucket: 'client-all-photos',
      uploadText: 'Upload Photos'
    },
    'selected-photos': {
      bucket: 'client-selected-photos',
      uploadText: 'Upload Selected Photos'
    },
    'final-photos': {
      bucket: 'client-final-photos', 
      uploadText: 'Upload Final Photos'
    }
  };

  const currentConfig = FOLDER_CONFIG[folderType as keyof typeof FOLDER_CONFIG];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !currentConfig) return;

    setUploading(true);
    
    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${id}/${fileName}`;

        const { error } = await supabase.storage
          .from(currentConfig.bucket)
          .upload(filePath, file);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`
      });
      
      // Trigger refresh in FolderView
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error", 
        description: "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
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
              <ArrowLeft className="h-4 w-4" />
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
            <div className="flex items-center justify-between">
              <CardTitle>{getFolderTitle(folderType)}</CardTitle>
              {currentConfig && folderType !== 'selected-photos' && (
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,application/pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <Button disabled={uploading} className="h-10 px-4">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : currentConfig.uploadText}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <FolderView 
              clientId={id}
              folderType={folderType as 'references' | 'all-photos' | 'selected-photos' | 'final-photos'}
              refreshTrigger={refreshTrigger}
              onFileCountChange={(count) => setFileCount(count)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}