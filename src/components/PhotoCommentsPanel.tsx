import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Send, MessageCircle, Upload, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Comment {
  id: string;
  comment: string;
  commenter_name: string | null;
  commenter_email: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

interface PhotoCommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  photoPath: string;
  photoName: string;
  onPhotoReplaced?: () => void;
}

export default function PhotoCommentsPanel({ 
  isOpen, 
  onClose, 
  clientId, 
  photoPath, 
  photoName,
  onPhotoReplaced
}: PhotoCommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commenterName, setCommenterName] = useState('');
  const [commenterEmail, setCommenterEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [isPhotographer, setIsPhotographer] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      checkPhotographerStatus();
    }
  }, [isOpen, photoPath, user]);

  const checkPhotographerStatus = async () => {
    if (!user) {
      setIsPhotographer(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('photographer_id')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      setIsPhotographer(data?.photographer_id === user.id);
    } catch (error) {
      console.error('Error checking photographer status:', error);
      setIsPhotographer(false);
    }
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photo_comments')
        .select('*')
        .eq('client_id', clientId)
        .eq('photo_path', photoPath)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('photo_comments')
        .insert({
          client_id: clientId,
          photo_path: photoPath,
          comment: newComment.trim(),
          commenter_name: commenterName.trim() || null,
          commenter_email: commenterEmail.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Comment added successfully"
      });

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveWithUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setResolving(true);
    try {
      // Upload the new file to replace the existing one at the exact same path
      const { error: uploadError } = await supabase.storage
        .from('client-all-photos')
        .upload(photoPath, file, {
          upsert: true // This will replace if file exists
        });

      if (uploadError) throw uploadError;

      // Mark comments as resolved
      const { error: resolveError } = await supabase
        .from('photo_comments')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user.id
        })
        .eq('client_id', clientId)
        .eq('photo_path', photoPath)
        .is('resolved_at', null);

      if (resolveError) throw resolveError;

      toast({
        title: "Success",
        description: "Photo replaced and comments resolved. Client has been notified."
      });

      fetchComments();
      onPhotoReplaced?.();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error resolving comments:', error);
      toast({
        title: "Error",
        description: "Failed to resolve comments",
        variant: "destructive"
      });
    } finally {
      setResolving(false);
    }
  };

  const hasUnresolvedComments = comments.some(comment => !comment.resolved_at);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-card border-l border-border shadow-lg z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Comments</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 border-b border-border bg-card">
        <p className="text-sm font-medium truncate" title={photoName}>
          {photoName}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className={comment.resolved_at ? "border-success bg-success/5" : ""}>
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">
                      {comment.commenter_name || 'Client'}
                    </p>
                    {comment.resolved_at && (
                      <CheckCircle className="h-4 w-4 text-success" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(comment.created_at)}
                  </p>
                </div>
                <p className="text-sm">{comment.comment}</p>
                {comment.resolved_at && (
                  <p className="text-xs text-success mt-2">
                    Resolved on {formatDate(comment.resolved_at)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="p-4 border-t border-border bg-card space-y-3">
        {isPhotographer && hasUnresolvedComments && (
          <div className="mb-4">
            <Button 
              onClick={handleResolveWithUpload}
              disabled={resolving}
              className="w-full"
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              {resolving ? 'Resolving...' : 'Resolve with New Photo'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Your name (optional)"
            value={commenterName}
            onChange={(e) => setCommenterName(e.target.value)}
          />
          <Input
            placeholder="Email (optional)"
            type="email"
            value={commenterEmail}
            onChange={(e) => setCommenterEmail(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1"
            rows={2}
          />
          <Button 
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}