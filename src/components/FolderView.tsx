import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Upload, File, Image as ImageIcon, Download, Trash2, Check, MessageCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import PhotoCommentsPanel from './PhotoCommentsPanel';

interface FileItem {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  metadata: any;
  imageUrl?: string;
  commentStatus?: 'none' | 'has-comments' | 'resolved';
}

interface FolderViewProps {
  clientId: string;
  folderType: 'references' | 'all-photos' | 'selected-photos' | 'final-photos';
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
  'selected-photos': {
    title: 'Selected Photos',
    description: 'Approved photos ready for editing and final review',
    bucket: 'client-selected-photos',
    icon: ImageIcon,
    uploadText: 'Upload Selected Photos'
  },
  'final-photos': {
    title: 'Final Photos',
    description: 'Final edited photos ready for client delivery and review',
    bucket: 'client-final-photos', 
    icon: ImageIcon,
    uploadText: 'Upload Final Photos'
  }
};

export default function FolderView({ clientId, folderType }: FolderViewProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [clientPackage, setClientPackage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false);
  const [selectedPhotoForComments, setSelectedPhotoForComments] = useState<string>('');
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isShared = searchParams.get('shared') === 'true';
  
  const config = FOLDER_CONFIG[folderType];
  const Icon = config.icon;

  useEffect(() => {
    fetchFiles();
    fetchClientPackage();
  }, [clientId, folderType]);

  const getImageUrl = async (fileName: string): Promise<string> => {
    try {
      const { data, error } = await supabase.storage
        .from(config.bucket)
        .createSignedUrl(`${clientId}/${fileName}`, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return '';
    }
  };

  const fetchClientPackage = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          package_id,
          packages (
            id,
            name,
            max_edited_photos
          )
        `)
        .eq('id', clientId)
        .single();

      if (error) throw error;
      setClientPackage(data);
    } catch (error) {
      console.error('Error fetching client package:', error);
    }
  };

  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const extension = fileName.split('.').pop()?.toLowerCase();
    return imageExtensions.includes(extension || '');
  };

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase.storage
        .from(config.bucket)
        .list(clientId, {
          limit: 100,
          offset: 0
        });

      if (error) throw error;
      
      // Get signed URLs and comment status for all files
      const filesWithUrls = await Promise.all(
        (data || []).map(async (file) => {
          let imageUrl = '';
          if (isImageFile(file.name)) {
            imageUrl = await getImageUrl(file.name);
          }

          // Check comment status
          const { data: comments } = await supabase
            .from('photo_comments')
            .select('resolved_at')
            .eq('client_id', clientId)
            .eq('photo_path', `${clientId}/${file.name}`);

          let commentStatus: 'none' | 'has-comments' | 'resolved' = 'none';
          if (comments && comments.length > 0) {
            const hasUnresolved = comments.some(c => !c.resolved_at);
            commentStatus = hasUnresolved ? 'has-comments' : 'resolved';
          }

          return {
            ...file,
            imageUrl,
            commentStatus
          };
        })
      );
      
      setFiles(filesWithUrls);
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

  const handleFileSelection = (fileName: string, checked: boolean) => {
    const newSelection = new Set(selectedFiles);
    
    if (checked) {
      // Check package limits for selected-photos folder
      if (folderType === 'selected-photos' && clientPackage?.packages) {
        const maxPhotos = clientPackage.packages.max_edited_photos;
        if (newSelection.size >= maxPhotos) {
          toast({
            title: "Package Limit Reached",
            description: `Your ${clientPackage.packages.name} package allows only ${maxPhotos} edited photos.`,
            variant: "destructive"
          });
          return;
        }
      }
      newSelection.add(fileName);
    } else {
      newSelection.delete(fileName);
    }
    setSelectedFiles(newSelection);
  };

  const handleApproveSelected = async () => {
    if (selectedFiles.size === 0) return;

    // Additional package limit check for moving from all-photos to selected-photos
    if (folderType === 'all-photos' && clientPackage?.packages) {
      const maxPhotos = clientPackage.packages.max_edited_photos;
      
      // Check current count in selected-photos folder
      try {
        const { data: selectedPhotos, error } = await supabase.storage
          .from('client-selected-photos')
          .list(clientId, { limit: 100 });

        if (!error && selectedPhotos) {
          const currentSelectedCount = selectedPhotos.length;
          if (currentSelectedCount + selectedFiles.size > maxPhotos) {
            toast({
              title: "Package Limit Exceeded",
              description: `Your ${clientPackage.packages.name} package allows only ${maxPhotos} edited photos. You currently have ${currentSelectedCount} selected photos.`,
              variant: "destructive"
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error checking selected photos count:', error);
      }
    }

    setApproving(true);
    try {
      let sourceBucket = '';
      let targetBucket = '';
      let successMessage = '';

      if (folderType === 'all-photos') {
        sourceBucket = 'client-all-photos';
        targetBucket = 'client-selected-photos';
        successMessage = `${selectedFiles.size} photo(s) moved to selected photos`;
      } else if (folderType === 'selected-photos') {
        sourceBucket = 'client-selected-photos';
        targetBucket = 'client-final-photos';
        successMessage = `${selectedFiles.size} photo(s) moved to final photos`;
      } else {
        return; // Should not happen
      }

      const movePromises = Array.from(selectedFiles).map(async (fileName) => {
        // Download the file from source bucket
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(sourceBucket)
          .download(`${clientId}/${fileName}`);

        if (downloadError) throw downloadError;

        // Upload to target bucket
        const { error: uploadError } = await supabase.storage
          .from(targetBucket)
          .upload(`${clientId}/${fileName}`, fileData);

        if (uploadError) throw uploadError;

        // Delete from source bucket
        const { error: deleteError } = await supabase.storage
          .from(sourceBucket)
          .remove([`${clientId}/${fileName}`]);

        if (deleteError) throw deleteError;
      });

      await Promise.all(movePromises);

      toast({
        title: "Success",
        description: successMessage
      });

      setSelectedFiles(new Set());
      fetchFiles();
    } catch (error) {
      console.error('Error approving photos:', error);
      toast({
        title: "Error",
        description: "Failed to approve photos",
        variant: "destructive"
      });
    } finally {
      setApproving(false);
    }
  };

  const handleOpenComments = (fileName: string) => {
    setSelectedPhotoForComments(`${clientId}/${fileName}`);
    setCommentsPanelOpen(true);
  };

  const handleCloseComments = () => {
    setCommentsPanelOpen(false);
    setSelectedPhotoForComments('');
  };

  const handlePhotoReplaced = () => {
    fetchFiles(); // Refresh the file list to update comment status
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
        <div className="flex items-center justify-between"
        >
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{files.length} files</Badge>
          {(folderType === 'all-photos' || folderType === 'selected-photos') && selectedFiles.size > 0 && !isShared && (
            <Button 
              onClick={handleApproveSelected}
              disabled={approving}
              variant="default"
            >
              <Check className="h-4 w-4 mr-2" />
              {approving ? 'Approving...' : 
                folderType === 'all-photos' 
                  ? `Move ${selectedFiles.size} to Selected` 
                  : `Move ${selectedFiles.size} to Final`
              }
            </Button>
          )}
          {!isShared && (
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
          )}
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
            <Card key={file.id} className={`hover:shadow-md transition-shadow relative group ${
              file.commentStatus === 'has-comments' ? 'border-orange-200 bg-orange-50' : 
              file.commentStatus === 'resolved' ? 'border-green-200 bg-green-50' : ''
            }`}>
              <CardContent className="p-4">
                {/* Comment status indicator */}
                {file.commentStatus !== 'none' && (
                  <div className="absolute top-2 right-2 z-10">
                    {file.commentStatus === 'has-comments' ? (
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                )}
                
                {/* Selection checkbox for all-photos and selected-photos */}
                {(folderType === 'all-photos' || folderType === 'selected-photos') && !isShared && (
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedFiles.has(file.name)}
                      onCheckedChange={(checked) => handleFileSelection(file.name, checked as boolean)}
                      className="bg-background border-2"
                    />
                  </div>
                )}
                
                {/* Image thumbnail or file icon */}
                <div className="mb-3">
                  {isImageFile(file.name) ? (
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={file.imageUrl || ''} 
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.removeAttribute('hidden');
                        }}
                      />
                      <div className="hidden w-full h-full flex items-center justify-center">
                        <File className="h-12 w-12 text-muted-foreground" />
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                      <File className="h-12 w-12 text-primary" />
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm truncate flex-1 mr-2" title={file.name}>
                    {file.name}
                  </h4>
                  
                  <div className="flex items-center space-x-1">
                    {/* Show different buttons based on folder type */}
                    {folderType === 'references' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(file.name)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {folderType === 'selected-photos' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(file.name)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {folderType === 'final-photos' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenComments(file.name)}
                          title="Comment on this photo"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file.name)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {!isShared && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file.name)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1 mt-2">
                  <p>Size: {formatFileSize(file.metadata?.size || 0)}</p>
                  <p>Uploaded: {formatDate(file.created_at)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Comments Panel */}
      <PhotoCommentsPanel
        isOpen={commentsPanelOpen}
        onClose={handleCloseComments}
        clientId={clientId}
        photoPath={selectedPhotoForComments}
        photoName={selectedPhotoForComments.split('/').pop() || ''}
        onPhotoReplaced={handlePhotoReplaced}
      />
    </div>
  );
}