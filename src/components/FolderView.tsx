import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, File, Image as ImageIcon, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileItem {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  metadata: any;
}

interface FolderViewProps {
  clientId: string;
  folderType: 'references' | 'all-photos' | 'final-photos';
  onBack: () => void;
}

const FOLDER_CONFIG = {
  references: {
    title: 'Client References',
    description: 'Sample shots, mood boards, and inspiration images',
    bucket: 'client-references',
    icon: Upload,
    uploadText: 'Upload References'
  },
  'all-photos': {
    title: 'All Photos', 
    description: 'Raw and unedited photos from the event or photo session',
    bucket: 'client-all-photos',
    icon: ImageIcon,
    uploadText: 'Upload Photos'
  },
  'final-photos': {
    title: 'Final Photos',
    description: 'Selected and edited photos ready for client delivery',
    bucket: 'client-final-photos', 
    icon: ImageIcon,
    uploadText: 'Upload Final Photos'
  }
};

export default function FolderView({ clientId, folderType, onBack }: FolderViewProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  
  const config = FOLDER_CONFIG[folderType];
  const Icon = config.icon;

  useEffect(() => {
    fetchFiles();
  }, [clientId, folderType]);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase.storage
        .from(config.bucket)
        .list(clientId, {
          limit: 100,
          offset: 0
        });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${clientId}/${fileName}`;

        const { error } = await supabase.storage
          .from(config.bucket)
          .upload(filePath, file);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`
      });
      
      fetchFiles();
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

  const handleDownload = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(config.bucket)
        .download(`${clientId}/${fileName}`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from(config.bucket)
        .remove([`${clientId}/${fileName}`]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "File deleted successfully"
      });
      
      fetchFiles();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Icon className="h-8 w-8 animate-pulse mx-auto mb-4" />
        <p>Loading files...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <Icon className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold">{config.title}</h2>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{files.length} files</Badge>
          <div className="relative">
            <input
              type="file"
              multiple
              accept="image/*,video/*,application/pdf"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <Button disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : config.uploadText}
            </Button>
          </div>
        </div>
      </div>

      {/* Files Grid */}
      {files.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Icon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No files yet</h3>
            <p className="text-muted-foreground mb-4">
              {config.description}
            </p>
            <div className="relative inline-block">
              <input
                type="file"
                multiple
                accept="image/*,video/*,application/pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <Button variant="outline" disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : config.uploadText}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <File className="h-8 w-8 text-primary flex-shrink-0" />
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file.name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <h4 className="font-medium text-sm mb-2 truncate" title={file.name}>
                  {file.name}
                </h4>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Size: {formatFileSize(file.metadata?.size || 0)}</p>
                  <p>Uploaded: {formatDate(file.created_at)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}